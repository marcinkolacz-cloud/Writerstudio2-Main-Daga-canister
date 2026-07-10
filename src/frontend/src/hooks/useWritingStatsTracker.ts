import { useEffect, useRef } from "react";
import { useRecordWritingActivity } from "./useBackend";
import { useRecordHourlyActivity } from "./useBackend";

const IDLE_SESSION_GAP_MS = 5 * 60 * 1000;
const ACTIVE_GAP_THRESHOLD_MS = 2 * 60 * 1000;
const FLUSH_INTERVAL_MS = 60 * 1000;

function countWords(html: string): number {
  const div = document.createElement("div");
  div.innerHTML = html;
  const text = div.textContent || div.innerText || "";
  return text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;
}

function todayDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function useWritingStatsTracker(
  bookId: bigint | undefined,
  chapterId: string | undefined,
  content: string,
) {
  const recordActivity = useRecordWritingActivity();
  const recordHourly = useRecordHourlyActivity();

  const lastWordCountRef = useRef<number | null>(null);
  const lastChangeTimeRef = useRef<number | null>(null);
  const lastChapterIdRef = useRef<string | undefined>(undefined);
  const pendingWordsAddedRef = useRef(0);
  const pendingWordsRemovedRef = useRef(0);
  const pendingActiveMsRef = useRef(0);
  const pendingSessionCountRef = useRef(0);

  const flush = () => {
    console.log("[STATS] flush called, bookId:", bookId);
    if (bookId === undefined) return;
    console.log("[STATS] pending values:", {
      wordsAdded: pendingWordsAddedRef.current,
      wordsRemoved: pendingWordsRemovedRef.current,
      sessionCount: pendingSessionCountRef.current,
    });
    const wordsAdded = pendingWordsAddedRef.current;
    const wordsRemoved = pendingWordsRemovedRef.current;
    const activeMinutes = Math.round(pendingActiveMsRef.current / 60000);
    const sessionCount = pendingSessionCountRef.current;
    if (wordsAdded === 0 && wordsRemoved === 0 && sessionCount === 0) return;

    pendingWordsAddedRef.current = 0;
    pendingWordsRemovedRef.current = 0;
    pendingActiveMsRef.current = 0;
    pendingSessionCountRef.current = 0;

    recordActivity.mutate(
      {
        bookId,
        date: todayDate(),
        wordsAdded: BigInt(wordsAdded),
        wordsRemoved: BigInt(Math.max(wordsRemoved, 0)),
        activeMinutes: BigInt(
          Math.max(activeMinutes, sessionCount > 0 ? 1 : 0),
        ),
      },
      {
        onSuccess: () => console.log("[STATS] recordWritingActivity SUCCESS"),
        onError: (err) =>
          console.error("[STATS] recordWritingActivity ERROR", err),
      },
    );

    if (wordsAdded > 0) {
      recordHourly.mutate({
        hour: BigInt(new Date().getHours()),
        wordsAdded: BigInt(wordsAdded),
      });
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: flush reads refs only, intentional omission
  useEffect(() => {
    if (lastChapterIdRef.current !== chapterId) {
      flush();
      lastWordCountRef.current = null;
      lastChangeTimeRef.current = null;
      lastChapterIdRef.current = chapterId;
    }
  }, [chapterId]);

  useEffect(() => {
    const newCount = countWords(content);
    const now = Date.now();

    if (lastWordCountRef.current !== null) {
      const diff = newCount - lastWordCountRef.current;
      if (diff > 0) pendingWordsAddedRef.current += diff;
      if (diff < 0) pendingWordsRemovedRef.current += -diff;

      if (lastChangeTimeRef.current !== null) {
        const gap = now - lastChangeTimeRef.current;
        if (gap <= ACTIVE_GAP_THRESHOLD_MS) {
          pendingActiveMsRef.current += gap;
        } else if (gap > IDLE_SESSION_GAP_MS) {
          pendingSessionCountRef.current += 1;
        }
      }
    }

    lastWordCountRef.current = newCount;
    lastChangeTimeRef.current = now;
  }, [content]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: flush and bookId are intentionally excluded — interval setup should run once
  useEffect(() => {
    const interval = setInterval(flush, FLUSH_INTERVAL_MS);
    const onBeforeUnload = () => flush();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", onBeforeUnload);
      flush();
    };
  }, [bookId]);
}
