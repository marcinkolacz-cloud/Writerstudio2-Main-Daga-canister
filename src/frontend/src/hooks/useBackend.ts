import { Recording, createActor } from "@/backend";
import type {
  Analysis,
  Book,
  Chapter,
  ChatMessage,
  ChatSession,
  ChatSessionMessage,
  Comment,
  TextAnnotation,
} from "@/backend";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export function useBooks() {
  const { actor } = useActor(createActor);
  return useQuery<Book[]>({
    queryKey: ["books"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listBooksByOwner();
    },
    enabled: !!actor,
  });
}

export function useBook(bookId: string | number) {
  const { actor } = useActor(createActor);
  const id = BigInt(bookId);
  return useQuery<Book | null>({
    queryKey: ["book", id],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getBook(id);
    },
    enabled: !!actor && !!bookId,
  });
}

export function useChapters(bookId: string | number) {
  const { actor } = useActor(createActor);
  const id = BigInt(bookId);
  return useQuery<Chapter[]>({
    queryKey: ["chapters", id],
    queryFn: async () => {
      if (!actor) return [];
      const chapters = await actor.listChaptersByBook(id);
      return chapters.sort((a, b) => Number(a.orderIndex - b.orderIndex));
    },
    enabled: !!actor && !!bookId,
  });
}

export function useCreateChapter() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookId,
      title,
    }: {
      bookId: bigint;
      title: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createChapter(bookId, title);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["chapters", variables.bookId],
      });
    },
  });
}

export function useChapter(chapterId: string | number) {
  const { actor } = useActor(createActor);
  const id = BigInt(chapterId);
  return useQuery<Chapter | null>({
    queryKey: ["chapter", id],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getChapter(id);
    },
    enabled: !!actor && !!chapterId,
  });
}

export function useUpdateChapter() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      title,
      content,
    }: {
      id: bigint;
      title: string;
      content: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateChapter(id, title, content);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["chapter", variables.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["chapters"],
      });
    },
  });
}

export function useUpdateChapterIndents() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      indentLeft,
      indentRight,
      indentFirstLine,
    }: {
      id: bigint;
      indentLeft: bigint;
      indentRight: bigint;
      indentFirstLine: bigint;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateChapterIndents(
        id,
        indentLeft,
        indentRight,
        indentFirstLine,
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["chapter", variables.id],
      });
    },
  });
}

export function useSaveAnalysis() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookId,
      chapterId: _chapterId,
      analysisType,
      provider,
      resultContent,
    }: {
      bookId: bigint;
      chapterId: bigint | null;
      analysisType: string;
      provider: string;
      resultContent: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveAnalysis(
        bookId,
        _chapterId,
        analysisType,
        provider,
        resultContent,
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["analyses", "book", variables.bookId],
      });
      if (variables.chapterId) {
        queryClient.invalidateQueries({
          queryKey: ["analyses", "chapter", variables.chapterId],
        });
      }
    },
  });
}

export function useSaveAnnotations() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation<
    bigint[],
    Error,
    {
      analysisId: bigint;
      annotations: Array<{
        text: string;
        color: string;
        explanation: string;
        proposal: string;
      }>;
    }
  >({
    mutationFn: async ({ analysisId, annotations }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveAnnotations(analysisId, annotations);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["annotations", variables.analysisId],
      });
    },
  });
}

export function useAnalysesByChapter(chapterId: string | number) {
  const { actor } = useActor(createActor);
  const id = BigInt(chapterId);
  return useQuery<Analysis[]>({
    queryKey: ["analyses", "chapter", id],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listAnalysesByChapter(id);
    },
    enabled: !!actor && !!chapterId,
  });
}

export function useAnalysesByBook(bookId: string | number) {
  const { actor } = useActor(createActor);
  const id = BigInt(bookId);
  return useQuery<Analysis[]>({
    queryKey: ["analyses", "book", id],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listAnalysesByBook(id);
    },
    enabled: !!actor && !!bookId,
  });
}

export function useCreateBook() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      description,
      category,
    }: {
      title: string;
      description: string;
      category: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createBook(title, description, category);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
    },
  });
}

export function useChatMessages(bookId: string | number) {
  const { actor } = useActor(createActor);
  const id = BigInt(bookId);
  return useQuery<ChatMessage[]>({
    queryKey: ["chat", id],
    queryFn: async () => {
      if (!actor) return [];
      const messages = await actor.listMessagesByBook(id);
      return messages.sort((a, b) => Number(a.createdAt - b.createdAt));
    },
    enabled: !!actor && !!bookId,
  });
}

export function useSendMessage() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookId,
      role,
      content,
      provider,
    }: {
      bookId: bigint;
      role: string;
      content: string;
      provider: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.sendMessage(bookId, role, content, provider);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["chat", variables.bookId],
      });
    },
  });
}

export function useDeleteMessage() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: bigint }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteMessage(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat"] });
    },
  });
}

export function useComments(chapterId: string | number) {
  const { actor } = useActor(createActor);
  const id = BigInt(chapterId);
  return useQuery<Comment[]>({
    queryKey: ["comments", id],
    queryFn: async () => {
      if (!actor) return [];
      const comments = await actor.listCommentsByChapter(id);
      return comments.sort((a, b) => Number(a.createdAt - b.createdAt));
    },
    enabled: !!actor && !!chapterId,
  });
}

export function useCreateComment() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      chapterId,
      anchorText,
      content,
    }: {
      chapterId: bigint;
      anchorText: string;
      content: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createComment(chapterId, anchorText, content);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["comments", variables.chapterId],
      });
    },
  });
}

export function useDeleteComment() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: bigint }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteComment(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] });
    },
  });
}

interface OverallStats {
  totalBooks: bigint;
  totalWords: bigint;
  totalChapters: bigint;
}

interface BookStats {
  totalWords: bigint;
  totalChars: bigint;
  chapterCount: bigint;
  avgWordsPerChapter: bigint;
}

export function useOverallStats() {
  const { actor } = useActor(createActor);
  return useQuery<OverallStats>({
    queryKey: ["overallStats"],
    queryFn: async () => {
      if (!actor) return { totalBooks: 0n, totalWords: 0n, totalChapters: 0n };
      return actor.getOverallStats();
    },
    enabled: !!actor,
  });
}

export function useBookStats(bookId: string | number) {
  const { actor } = useActor(createActor);
  const id = BigInt(bookId);
  return useQuery<BookStats>({
    queryKey: ["bookStats", id],
    queryFn: async () => {
      if (!actor)
        return {
          totalWords: 0n,
          totalChars: 0n,
          chapterCount: 0n,
          avgWordsPerChapter: 0n,
        };
      return actor.getBookStats(id);
    },
    enabled: !!actor && !!bookId,
  });
}

export function useRecordings(chapterId: string | number) {
  const { actor } = useActor(createActor);
  const id = BigInt(chapterId);
  return useQuery<
    Array<{
      id: bigint;
      voice: string;
      createdAt: bigint;
    }>
  >({
    queryKey: ["recordings", id],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listRecordingsByChapter(id);
    },
    enabled: !!actor && !!chapterId,
  });
}

export function useSaveRecording() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      chapterId,
      bookId,
      voice,
      audioData,
    }: {
      chapterId: bigint;
      bookId: bigint;
      voice: string;
      audioData: Uint8Array;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveRecording(chapterId, bookId, voice, audioData);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["recordings", variables.chapterId],
      });
    },
  });
}

export function useDeleteRecording() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: bigint }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteRecording(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recordings"] });
    },
  });
}

export async function fetchRecordingAudio(
  actor: ReturnType<typeof createActor>,
  id: bigint,
): Promise<Uint8Array | null> {
  if (!actor) return null;
  return actor.getRecordingAudio(id);
}

export function useAnnotationsByAnalysis(analysisId: string | number) {
  const { actor } = useActor(createActor);
  const id = BigInt(analysisId);
  return useQuery<TextAnnotation[]>({
    queryKey: ["annotations", "analysis", id],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listAnnotationsByAnalysis(id);
    },
    enabled: !!actor && !!analysisId,
  });
}

export function useUpdateAnnotationApproved() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      approved,
    }: {
      id: bigint;
      approved: boolean;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateAnnotationApproved(id, approved);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["annotations"] });
    },
  });
}

export async function getAnnotation(
  actor: ReturnType<typeof createActor>,
  id: bigint,
): Promise<TextAnnotation | null> {
  if (!actor) return null;
  return actor.getAnnotation(id);
}

export function useDeleteAnalysis() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: bigint }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteAnalysis(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["analyses"] });
    },
  });
}

export function useUpdateBookMetadata() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ageCategory,
      authorSummary,
      keyContext,
      themes,
      writingStyle,
    }: {
      id: bigint;
      ageCategory: string;
      authorSummary: string;
      keyContext: string;
      themes: string;
      writingStyle: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.updateBookMetadata(
        id,
        ageCategory,
        authorSummary,
        keyContext,
        themes,
        writingStyle,
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["book", variables.id],
      });
    },
  });
}

export function useReorderChapters() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookId,
      orderedChapterIds,
    }: {
      bookId: bigint;
      orderedChapterIds: bigint[];
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.reorderChapters(bookId, orderedChapterIds);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["chapters", variables.bookId],
      });
    },
  });
}

export function useClearChat() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ bookId }: { bookId: bigint }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.clearChat(bookId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["chat", variables.bookId],
      });
    },
  });
}

export function useChatSessions(chapterId: string | number) {
  const { actor } = useActor(createActor);
  const id = BigInt(chapterId);
  return useQuery<ChatSession[]>({
    queryKey: ["chatSessions", id],
    queryFn: async () => {
      if (!actor) return [];
      const sessions = await actor.getChatSessionsByChapter(id);
      return sessions.sort((a, b) => Number(b.createdAt - a.createdAt));
    },
    enabled: !!actor && !!chapterId,
  });
}

export function useCreateChatSession() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      chapterId,
      title,
    }: {
      chapterId: bigint;
      title: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.createChatSession(chapterId, title);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["chatSessions", variables.chapterId],
      });
    },
  });
}

export function useChatSessionMessages(sessionId: string | number) {
  const { actor } = useActor(createActor);
  const id = BigInt(sessionId);
  return useQuery<ChatSessionMessage[]>({
    queryKey: ["chatMessages", id],
    queryFn: async () => {
      if (!actor) return [];
      const messages = await actor.getChatMessages(id);
      return messages.sort((a, b) => Number(a.createdAt - b.createdAt));
    },
    enabled: !!actor && !!sessionId,
  });
}

export function useAddChatMessage() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      role,
      content,
    }: {
      sessionId: bigint;
      role: string;
      content: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.addChatMessage(sessionId, role, content);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["chatMessages", variables.sessionId],
      });
    },
  });
}

export function useDeleteChatSession() {
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      chapterId: _chapterId,
    }: {
      sessionId: bigint;
      chapterId: bigint;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.deleteChatSession(sessionId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["chatSessions", variables.chapterId],
      });
    },
  });
}
