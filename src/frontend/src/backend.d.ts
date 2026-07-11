import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface ChatSessionMessage {
    id: bigint;
    content: string;
    createdAt: bigint;
    role: string;
    sessionId: bigint;
}
export interface Comment {
    id: bigint;
    content: string;
    createdAt: bigint;
    chapterId: bigint;
    anchorText: string;
}
export interface Analysis {
    id: bigint;
    provider: string;
    analysisType: string;
    createdAt: bigint;
    bookId: bigint;
    chapterId?: bigint;
    resultContent: string;
}
export interface Book {
    id: bigint;
    title: string;
    ownerId: Principal;
    authorSummary: string;
    characters: string;
    description: string;
    updatedAt: bigint;
    themes: string;
    keyContext: string;
    category: string;
    ageCategory: string;
}
export interface Chapter {
    id: bigint;
    charCount: bigint;
    title: string;
    indentFirstLine: bigint;
    content: string;
    indentRight: bigint;
    wordCount: bigint;
    indentLeft: bigint;
    createdAt: bigint;
    bookId: bigint;
    updatedAt: bigint;
    sessionId: string;
    orderIndex: bigint;
}
export interface ChatSession {
    id: bigint;
    title: string;
    createdAt: bigint;
    chapterId: bigint;
}
export interface PendingUpload {
    id: bigint;
    voice: string;
    createdAt: bigint;
    receivedChunks: bigint;
    bookId: bigint;
    chapterId: bigint;
    totalChunks: bigint;
}
export interface DailyWritingStat {
    id: bigint;
    activeMinutes: bigint;
    ownerId: Principal;
    wordsAdded: bigint;
    date: string;
    bookId: bigint;
    netWords: bigint;
    sessionCount: bigint;
    wordsRemoved: bigint;
}
export interface InviteCode {
    code: string;
    usedAt?: bigint;
    usedBy?: Principal;
    createdAt: bigint;
}
export interface HourlyActivityStat {
    id: bigint;
    ownerId: Principal;
    wordsAdded: bigint;
    hour: bigint;
}
export interface ChatArchive {
    id: bigint;
    title: string;
    createdAt: bigint;
    bookId: bigint;
    summary: string;
    updatedAt: bigint;
    sessionId: string;
}
export interface TextAnnotation {
    id: bigint;
    alternativeProposal?: string;
    explanation: string;
    color: string;
    text: string;
    approved: boolean;
    analysisId: bigint;
    proposal: string;
}
export interface ChatMessage {
    id: bigint;
    content: string;
    provider: string;
    createdAt: bigint;
    role: string;
    bookId: bigint;
    sessionId: string;
}
export interface Recording {
    id: bigint;
    voice: string;
    createdAt: bigint;
    audioData: Uint8Array;
    bookId: bigint;
    chapterId: bigint;
}
export interface backendInterface {
    addChatMessage(sessionId: bigint, role: string, content: string): Promise<bigint>;
    checkAccess(code: string): Promise<boolean>;
    clearChat(bookId: bigint, sessionId: string): Promise<boolean>;
    createArchive(bookId: bigint, sessionId: string, title: string): Promise<bigint>;
    createBook(title: string, description: string, category: string): Promise<bigint>;
    createChapter(bookId: bigint, title: string): Promise<bigint>;
    createChatSession(chapterId: bigint, title: string): Promise<bigint>;
    createComment(chapterId: bigint, anchorText: string, content: string): Promise<bigint>;
    deleteAnalysis(id: bigint): Promise<boolean>;
    deleteArchive(id: bigint): Promise<boolean>;
    deleteBook(id: bigint): Promise<boolean>;
    deleteChapter(id: bigint): Promise<boolean>;
    deleteChatSession(sessionId: bigint): Promise<void>;
    deleteComment(id: bigint): Promise<boolean>;
    deleteMessage(id: bigint): Promise<boolean>;
    deleteRecording(id: bigint): Promise<boolean>;
    finishRecordingUpload(uploadId: bigint): Promise<bigint>;
    generateInviteCode(): Promise<string>;
    getAnalysis(id: bigint): Promise<Analysis | null>;
    getAnnotation(id: bigint): Promise<TextAnnotation | null>;
    getAnnotations(analysisId: bigint): Promise<Array<TextAnnotation>>;
    getBook(id: bigint): Promise<Book | null>;
    getBookStats(bookId: bigint): Promise<{
        totalChars: bigint;
        avgWordsPerChapter: bigint;
        chapterCount: bigint;
        totalWords: bigint;
    }>;
    getChapter(id: bigint): Promise<Chapter | null>;
    getChatMessages(sessionId: bigint): Promise<Array<ChatSessionMessage>>;
    getChatSessionsByChapter(chapterId: bigint): Promise<Array<ChatSession>>;
    getGlobalStats(fromDate: string, toDate: string): Promise<Array<DailyWritingStat>>;
    getHourlyDistribution(): Promise<Array<HourlyActivityStat>>;
    getOverallStats(): Promise<{
        totalBooks: bigint;
        totalChapters: bigint;
        totalWords: bigint;
    }>;
    getRecordingAudio(id: bigint): Promise<Uint8Array | null>;
    getStatsByBook(bookId: bigint, fromDate: string, toDate: string): Promise<Array<DailyWritingStat>>;
    listAnalysesByBook(bookId: bigint): Promise<Array<Analysis>>;
    listAnalysesByChapter(chapterId: bigint): Promise<Array<Analysis>>;
    listAnnotationsByAnalysis(analysisId: bigint): Promise<Array<TextAnnotation>>;
    listArchivesByBook(bookId: bigint): Promise<Array<ChatArchive>>;
    listBooksByOwner(): Promise<Array<Book>>;
    listChaptersByBook(bookId: bigint): Promise<Array<Chapter>>;
    listCommentsByChapter(chapterId: bigint): Promise<Array<Comment>>;
    listInviteCodes(): Promise<Array<InviteCode>>;
    listMessagesByBook(bookId: bigint, sessionId: string): Promise<Array<ChatMessage>>;
    listRecordingsByChapter(chapterId: bigint): Promise<Array<{
        id: bigint;
        voice: string;
        createdAt: bigint;
    }>>;
    recordHourlyActivity(hour: bigint, wordsAdded: bigint): Promise<void>;
    recordWritingActivity(bookId: bigint, date: string, wordsAdded: bigint, wordsRemoved: bigint, activeMinutes: bigint): Promise<void>;
    renameArchive(id: bigint, newTitle: string): Promise<boolean>;
    reorderChapters(bookId: bigint, orderedIds: Array<bigint>): Promise<boolean>;
    revokeInviteCode(code: string): Promise<boolean>;
    saveAnalysis(bookId: bigint, chapterId: bigint | null, analysisType: string, provider: string, resultContent: string): Promise<bigint>;
    saveAnnotations(analysisId: bigint, annotationData: Array<{
        alternativeProposal?: string;
        explanation: string;
        color: string;
        text: string;
        proposal: string;
    }>): Promise<Array<bigint>>;
    saveRecording(chapterId: bigint, bookId: bigint, voice: string, audioData: Uint8Array): Promise<bigint>;
    sendMessage(bookId: bigint, sessionId: string, role: string, content: string, provider: string): Promise<bigint>;
    setAdminPrincipal(p: Principal): Promise<void>;
    setArchiveSummary(id: bigint, summary: string): Promise<boolean>;
    startRecordingUpload(chapterId: bigint, bookId: bigint, voice: string, totalChunks: bigint): Promise<bigint>;
    synthesizeSpeech(text: string, voice: string, apiKey: string): Promise<Uint8Array>;
    ttsTransform(raw: {
        context: Uint8Array;
        response: {
            status: bigint;
            body: Uint8Array;
            headers: Array<{
                value: string;
                name: string;
            }>;
        };
    }): Promise<{
        status: bigint;
        body: Uint8Array;
        headers: Array<{
            value: string;
            name: string;
        }>;
    }>;
    updateAnnotationApproved(id: bigint, approved: boolean): Promise<boolean>;
    updateBook(id: bigint, title: string, description: string, category: string): Promise<boolean>;
    updateBookCharacters(id: bigint, characters: string): Promise<boolean>;
    updateBookMetadata(id: bigint, ageCategory: string, authorSummary: string, keyContext: string, themes: string, writingStyle: string): Promise<boolean>;
    updateChapter(id: bigint, title: string, content: string): Promise<boolean>;
    updateChapterIndents(id: bigint, indentLeft: bigint, indentRight: bigint, indentFirstLine: bigint): Promise<boolean>;
    uploadRecordingChunk(uploadId: bigint, chunkIndex: bigint, data: Uint8Array): Promise<boolean>;
}
