export interface ImportProgress {
  total: number;
  done: number;
  currentLabel: string;
}

export interface ImportSummary {
  imported: Record<string, number>;
  skipped: Record<string, number>;
}

function toBigIntSet(arr: bigint[]): Set<bigint> {
  return new Set(arr);
}

export { toBigIntSet };

export interface RawBook {
  book: any;
  chapters: any[];
  analyses: any[];
  annotations: any[];
  comments: any[];
  chatMessages: any[];
  chatArchives: any[];
  chatSessions: any[];
  chatSessionMessages: any[];
}

export interface RawBook {
  book: any;
  chapters: any[];
  analyses: any[];
  annotations: any[];
  comments: any[];
  chatMessages: any[];
  chatArchives: any[];
  chatSessions: any[];
  chatSessionMessages: any[];
}

export interface BackupFile {
  metadata: any;
  books: RawBook[];
  dailyWritingStats?: any[];
  hourlyActivityStats?: any[];
}

function bnum(x: string | number): bigint {
  return BigInt(x);
}

function str(x: unknown): string {
  return x == null ? "" : String(x);
}

export function toBook(raw: any, ownerId: any): any {
  return {
    id: bnum(raw.id),
    ownerId,
    title: str(raw.title),
    description: str(raw.description),
    category: str(raw.category),
    ageCategory: str(raw.ageCategory),
    authorSummary: str(raw.authorSummary),
    keyContext: str(raw.keyContext),
    themes: str(raw.themes),
    characters: str(raw.characters),
    updatedAt: bnum(raw.updatedAt ?? "0"),
  };
}

export function toChapter(raw: any): any {
  return {
    id: bnum(raw.id),
    bookId: bnum(raw.bookId),
    sessionId: str(raw.sessionId),
    title: str(raw.title),
    content: str(raw.content),
    orderIndex: bnum(raw.orderIndex),
    wordCount: bnum(raw.wordCount),
    charCount: bnum(raw.charCount),
    indentLeft: bnum(raw.indentLeft),
    indentRight: bnum(raw.indentRight),
    indentFirstLine: bnum(raw.indentFirstLine),
    createdAt: bnum(raw.createdAt),
    updatedAt: bnum(raw.updatedAt),
  };
}

export function toAnalysis(raw: any): any {
  return {
    id: bnum(raw.id),
    bookId: bnum(raw.bookId),
    chapterId: raw.chapterId != null ? [bnum(raw.chapterId)] : [],
    analysisType: str(raw.analysisType),
    provider: str(raw.provider),
    resultContent: str(raw.resultContent),
    createdAt: bnum(raw.createdAt),
  };
}

export function toAnnotation(raw: any): any {
  return {
    id: bnum(raw.id),
    analysisId: bnum(raw.analysisId),
    text: str(raw.text),
    color: str(raw.color),
    explanation: str(raw.explanation),
    proposal: str(raw.proposal),
    alternativeProposal: raw.alternativeProposal ? [str(raw.alternativeProposal)] : [],
    approved: Boolean(raw.approved),
  };
}

export function toComment(raw: any): any {
  return {
    id: bnum(raw.id),
    chapterId: bnum(raw.chapterId),
    anchorText: str(raw.anchorText),
    content: str(raw.content),
    createdAt: bnum(raw.createdAt),
  };
}

export function toChatMessage(raw: any, fallbackBookId: any): any {
  return {
    id: bnum(raw.id),
    bookId: bnum(raw.bookId ?? fallbackBookId),
    sessionId: str(raw.sessionId),
    role: str(raw.role),
    content: str(raw.content),
    provider: str(raw.provider),
    createdAt: bnum(raw.createdAt),
  };
}

export function toChatArchive(raw: any): any {
  return {
    id: bnum(raw.id),
    bookId: bnum(raw.bookId),
    sessionId: str(raw.sessionId),
    title: str(raw.title),
    summary: str(raw.summary),
    createdAt: bnum(raw.createdAt),
    updatedAt: bnum(raw.updatedAt),
  };
}

export function toChatSession(raw: any): any {
  return {
    id: bnum(raw.id),
    chapterId: bnum(raw.chapterId),
    title: str(raw.title),
    createdAt: bnum(raw.createdAt),
  };
}

export function toChatSessionMessage(raw: any): any {
  return {
    id: bnum(raw.id),
    sessionId: bnum(raw.sessionId),
    role: str(raw.role),
    content: str(raw.content),
    createdAt: bnum(raw.createdAt),
  };
}

export async function runImport(
  actor: any,
  backup: BackupFile,
  ownerId: any,
  onProgress: (p: ImportProgress) => void,
): Promise<ImportSummary> {
  const existingRaw: any = await actor.adminGetAllIds();
  const existing: Record<string, Set<string>> = {
    books: new Set(existingRaw.books.map(String)),
    chapters: new Set(existingRaw.chapters.map(String)),
    analyses: new Set(existingRaw.analyses.map(String)),
    annotations: new Set(existingRaw.annotations.map(String)),
    comments: new Set(existingRaw.comments.map(String)),
    chatMessages: new Set(existingRaw.chatMessages.map(String)),
    chatArchives: new Set(existingRaw.chatArchives.map(String)),
    chatSessions: new Set(existingRaw.chatSessions.map(String)),
    chatSessionMessages: new Set(existingRaw.chatSessionMessages.map(String)),
    writingStats: new Set(existingRaw.writingStatsKeys as string[]),
    hourlyStats: new Set(existingRaw.hourlyStatsKeys as string[]),
  };

  const imported: Record<string, number> = {};
  const skipped: Record<string, number> = {};
  for (const k of Object.keys(existing)) {
    imported[k] = 0;
    skipped[k] = 0;
  }

  let totalItems = 0;
  for (const b of backup.books) {
    totalItems += 1 + b.chapters.length + b.analyses.length + b.annotations.length +
      b.comments.length + b.chatMessages.length + b.chatArchives.length +
      b.chatSessions.length + b.chatSessionMessages.length;
  }
  totalItems += (backup.dailyWritingStats ?? []).length + (backup.hourlyActivityStats ?? []).length;
  let done = 0;
  const tick = (label: string) => {
    done += 1;
    onProgress({ total: totalItems, done, currentLabel: label });
  };


  for (const b of backup.books) {
    await actor.adminImportBook(toBook(b.book, ownerId));
    imported.books += 1;
    tick("Book: " + b.book.title);

    for (const ch of b.chapters) {
      const cid = String(ch.id);
      await actor.adminImportChapter(toChapter(ch));
      imported.chapters += 1;
      tick("Chapter " + cid);
    }

    for (const an of b.analyses) {
      const aid = String(an.id);
      if (existing.analyses.has(aid)) { skipped.analyses += 1; tick("Analysis " + aid); continue; }
      await actor.adminImportAnalysis(toAnalysis(an));
      imported.analyses += 1;
      tick("Analysis " + aid);
    }

    for (const ann of b.annotations) {
      const annid = String(ann.id);
      if (existing.annotations.has(annid)) { skipped.annotations += 1; tick("Annotation " + annid); continue; }
      await actor.adminImportAnnotation(toAnnotation(ann));
      imported.annotations += 1;
      tick("Annotation " + annid);
    }

    for (const c of b.comments) {
      const cmid = String(c.id);
      if (existing.comments.has(cmid)) { skipped.comments += 1; tick("Comment " + cmid); continue; }
      await actor.adminImportComment(toComment(c));
      imported.comments += 1;
      tick("Comment " + cmid);
    }

    for (const m of b.chatMessages) {
      const mid = String(m.id);
      if (existing.chatMessages.has(mid)) { skipped.chatMessages += 1; tick("ChatMessage " + mid); continue; }
      await actor.adminImportChatMessage(toChatMessage(m, b.book.id));
      imported.chatMessages += 1;
      tick("ChatMessage " + mid);
    }

    for (const a of b.chatArchives) {
      const aaid = String(a.id);
      if (existing.chatArchives.has(aaid)) { skipped.chatArchives += 1; tick("ChatArchive " + aaid); continue; }
      await actor.adminImportChatArchive(toChatArchive(a));
      imported.chatArchives += 1;
      tick("ChatArchive " + aaid);
    }

    for (const sess of b.chatSessions) {
      const sid = String(sess.id);
      if (existing.chatSessions.has(sid)) { skipped.chatSessions += 1; tick("ChatSession " + sid); continue; }
      await actor.adminImportChatSession(toChatSession(sess));
      imported.chatSessions += 1;
      tick("ChatSession " + sid);
    }

    for (const sm of b.chatSessionMessages) {
      const smid = String(sm.id);
      if (existing.chatSessionMessages.has(smid)) { skipped.chatSessionMessages += 1; tick("ChatSessionMessage " + smid); continue; }
      await actor.adminImportChatSessionMessage(toChatSessionMessage(sm));
      imported.chatSessionMessages += 1;
      tick("ChatSessionMessage " + smid);
    }
  }

  for (const stat of backup.dailyWritingStats ?? []) {
    const key = String(ownerId) + "|" + String(stat.bookId) + "|" + String(stat.date);
    if (existing.writingStats.has(key)) { skipped.writingStats += 1; tick("WritingStat " + stat.date); continue; }
    await actor.adminImportDailyWritingStat(toDailyWritingStat(stat, ownerId));
    imported.writingStats += 1;
    tick("WritingStat " + stat.date);
  }

  for (const stat of backup.hourlyActivityStats ?? []) {
    const key = String(ownerId) + "|" + String(stat.hour);
    if (existing.hourlyStats.has(key)) { skipped.hourlyStats += 1; tick("HourlyStat " + stat.hour); continue; }
    await actor.adminImportHourlyActivityStat(toHourlyActivityStat(stat, ownerId));
    imported.hourlyStats += 1;
    tick("HourlyStat " + stat.hour);
  }

  return { imported, skipped };
}

export function toDailyWritingStat(raw: any, ownerId: any): any {
  return {
    id: bnum(raw.id),
    ownerId,
    bookId: bnum(raw.bookId),
    date: str(raw.date),
    wordsAdded: bnum(raw.wordsAdded),
    wordsRemoved: bnum(raw.wordsRemoved),
    netWords: BigInt(raw.netWords),
    activeMinutes: bnum(raw.activeMinutes),
    sessionCount: bnum(raw.sessionCount),
  };
}

export function toHourlyActivityStat(raw: any, ownerId: any): any {
  return {
    id: bnum(raw.id),
    ownerId,
    hour: bnum(raw.hour),
    wordsAdded: bnum(raw.wordsAdded),
  };
}
