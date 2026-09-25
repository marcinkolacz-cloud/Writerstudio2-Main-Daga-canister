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
    let offsets = {
      chapters: 0n, analyses: 0n, annotations: 0n, comments: 0n,
      chatMessages: 0n, chatArchives: 0n, chatSessions: 0n, chatSessionMessages: 0n,
    };
    let bookRec: any = null;
    let chapters: any[] = [], analyses: any[] = [], annotations: any[] = [], comments: any[] = [];
    let chatMessages: any[] = [], chatArchives: any[] = [], chatSessions: any[] = [], chatSessionMessages: any[] = [];
    let hasMore = true;
    while (hasMore) {
      const res = await actor.exportBookSliceChunk(BigInt(i), offsets);
      const c = opt(res);
      if (!c) { hasMore = false; break; }
      const ob = opt(c.book);
      if (ob) bookRec = fromBook(ob);
      chapters = chapters.concat(c.chapters.map(fromChapter));
      analyses = analyses.concat(c.analyses.map(fromAnalysis));
      annotations = annotations.concat(c.annotations.map(fromAnnotation));
      comments = comments.concat(c.comments.map(fromComment));
      chatMessages = chatMessages.concat(c.chatMessages.map(fromChatMessage));
      chatArchives = chatArchives.concat(c.chatArchives.map(fromChatArchive));
      chatSessions = chatSessions.concat(c.chatSessions.map(fromChatSession));
      chatSessionMessages = chatSessionMessages.concat(c.chatSessionMessages.map(fromChatSessionMessage));

      offsets = {
        chapters: offsets.chapters + BigInt(c.chapters.length),
        analyses: offsets.analyses + BigInt(c.analyses.length),
        annotations: offsets.annotations + BigInt(c.annotations.length),
        comments: offsets.comments + BigInt(c.comments.length),
        chatMessages: offsets.chatMessages + BigInt(c.chatMessages.length),
        chatArchives: offsets.chatArchives + BigInt(c.chatArchives.length),
        chatSessions: offsets.chatSessions + BigInt(c.chatSessions.length),
        chatSessionMessages: offsets.chatSessionMessages + BigInt(c.chatSessionMessages.length),
      };
      hasMore = c.chaptersHasMore || c.analysesHasMore || c.annotationsHasMore || c.commentsHasMore ||
        c.chatMessagesHasMore || c.chatArchivesHasMore || c.chatSessionsHasMore || c.chatSessionMessagesHasMore;
    }
    if (bookRec) {
      books.push({
        book: bookRec,
        chapters, analyses, annotations, comments,
        chatMessages, chatArchives, chatSessions, chatSessionMessages,
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
