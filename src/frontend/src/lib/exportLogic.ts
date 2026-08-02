import type { Principal } from "@icp-sdk/core/principal";

export interface ExportProgress {
  total: number;
  done: number;
  currentLabel: string;
}

function principalRaw(p: Principal): { __principal__: string } {
  return { __principal__: p.toText() };
}

function opt<T>(arr: T[]): T | null {
  return arr.length > 0 ? arr[0] : null;
}

function fromBook(b: any): any {
  return {
    id: String(b.id),
    ownerId: principalRaw(b.ownerId),
    title: b.title,
    description: b.description,
    category: b.category,
    ageCategory: b.ageCategory,
    authorSummary: b.authorSummary,
    keyContext: b.keyContext,
    themes: b.themes,
    characters: b.characters,
    updatedAt: String(b.updatedAt),
  };
}

function fromChapter(c: any): any {
  return {
    id: String(c.id),
    bookId: String(c.bookId),
    sessionId: c.sessionId,
    title: c.title,
    content: c.content,
    orderIndex: String(c.orderIndex),
    wordCount: String(c.wordCount),
    charCount: String(c.charCount),
    indentLeft: String(c.indentLeft),
    indentRight: String(c.indentRight),
    indentFirstLine: String(c.indentFirstLine),
    createdAt: String(c.createdAt),
    updatedAt: String(c.updatedAt),
  };
}

function fromAnalysis(a: any): any {
  return {
    id: String(a.id),
    bookId: String(a.bookId),
    chapterId: opt(a.chapterId) != null ? String(opt(a.chapterId)) : null,
    analysisType: a.analysisType,
    provider: a.provider,
    resultContent: a.resultContent,
    createdAt: String(a.createdAt),
  };
}

function fromAnnotation(a: any): any {
  return {
    id: String(a.id),
    analysisId: String(a.analysisId),
    text: a.text,
    color: a.color,
    explanation: a.explanation,
    proposal: a.proposal,
    alternativeProposal: opt(a.alternativeProposal),
    approved: a.approved,
  };
}

function fromComment(c: any): any {
  return {
    id: String(c.id),
    chapterId: String(c.chapterId),
    anchorText: c.anchorText,
    content: c.content,
    createdAt: String(c.createdAt),
  };
}

function fromChatMessage(m: any): any {
  return {
    id: String(m.id),
    bookId: String(m.bookId),
    sessionId: m.sessionId,
    role: m.role,
    content: m.content,
    provider: m.provider,
    createdAt: String(m.createdAt),
  };
}

function fromChatArchive(a: any): any {
  return {
    id: String(a.id),
    bookId: String(a.bookId),
    sessionId: a.sessionId,
    title: a.title,
    summary: a.summary,
    createdAt: String(a.createdAt),
    updatedAt: String(a.updatedAt),
  };
}

function fromChatSession(s: any): any {
  return {
    id: String(s.id),
    chapterId: String(s.chapterId),
    title: s.title,
    createdAt: String(s.createdAt),
  };
}

function fromChatSessionMessage(m: any): any {
  return {
    id: String(m.id),
    sessionId: String(m.sessionId),
    role: m.role,
    content: m.content,
    createdAt: String(m.createdAt),
  };
}

function fromDailyWritingStat(s: any): any {
  return {
    id: String(s.id),
    ownerId: principalRaw(s.ownerId),
    bookId: String(s.bookId),
    date: s.date,
    wordsAdded: String(s.wordsAdded),
    wordsRemoved: String(s.wordsRemoved),
    netWords: String(s.netWords),
    activeMinutes: String(s.activeMinutes),
    sessionCount: String(s.sessionCount),
  };
}

function fromHourlyActivityStat(s: any): any {
  return {
    id: String(s.id),
    ownerId: principalRaw(s.ownerId),
    hour: String(s.hour),
    wordsAdded: String(s.wordsAdded),
  };
}

export async function runExport(
  actor: any,
  onProgress: (p: ExportProgress) => void,
): Promise<any> {
  const meta = await actor.exportMetadata();
  const bookCount = Number(meta.bookCount);
  // +2 for the two stats calls at the end
  const total = bookCount + 2;
  let done = 0;
  const tick = (label: string) => {
    done += 1;
    onProgress({ total, done, currentLabel: label });
  };

  const books: any[] = [];
  for (let i = 0; i < bookCount; i++) {
    const slice = await actor.exportBookSlice(BigInt(i));
    const b = opt(slice);
    if (b) {
      books.push({
        book: fromBook(b.book),
        chapters: b.chapters.map(fromChapter),
        analyses: b.analyses.map(fromAnalysis),
        annotations: b.annotations.map(fromAnnotation),
        comments: b.comments.map(fromComment),
        chatMessages: b.chatMessages.map(fromChatMessage),
        chatArchives: b.chatArchives.map(fromChatArchive),
        chatSessions: b.chatSessions.map(fromChatSession),
        chatSessionMessages: b.chatSessionMessages.map(fromChatSessionMessage),
      });
    }
    tick("Book " + (i + 1) + "/" + bookCount);
  }

  const dailyWritingStats = (await actor.getGlobalStats("0000-01-01", "9999-12-31")).map(
    fromDailyWritingStat,
  );
  tick("Statystyki dzienne");

  const hourlyActivityStats = (await actor.getHourlyDistribution()).map(fromHourlyActivityStat);
  tick("Statystyki godzinowe");

  return {
    metadata: {
      exportedAt: String(meta.exportedAt),
      owner: principalRaw(meta.owner),
    },
    books,
    dailyWritingStats,
    hourlyActivityStats,
  };
}
