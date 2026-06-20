import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Book {
    id: bigint;
    title: string;
    ownerId: Principal;
    createdAt: bigint;
    description: string;
    updatedAt: bigint;
    category: string;
}
export interface TextAnnotation {
    id: bigint;
    explanation: string;
    color: string;
    text: string;
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
    orderIndex: bigint;
}
export interface backendInterface {
    clearChat(bookId: bigint): Promise<boolean>;
    createBook(title: string, description: string, category: string): Promise<bigint>;
    createChapter(bookId: bigint, title: string): Promise<bigint>;
    deleteAnalysis(id: bigint): Promise<boolean>;
    deleteBook(id: bigint): Promise<boolean>;
    deleteChapter(id: bigint): Promise<boolean>;
    deleteMessage(id: bigint): Promise<boolean>;
    getAnalysis(id: bigint): Promise<Analysis | null>;
    getAnnotations(analysisId: bigint): Promise<Array<TextAnnotation>>;
    getBook(id: bigint): Promise<Book | null>;
    getChapter(id: bigint): Promise<Chapter | null>;
    listAnalysesByBook(bookId: bigint): Promise<Array<Analysis>>;
    listAnalysesByChapter(chapterId: bigint): Promise<Array<Analysis>>;
    listBooksByOwner(): Promise<Array<Book>>;
    listChaptersByBook(bookId: bigint): Promise<Array<Chapter>>;
    listMessagesByBook(bookId: bigint): Promise<Array<ChatMessage>>;
    reorderChapters(bookId: bigint, orderedIds: Array<bigint>): Promise<boolean>;
    saveAnalysis(bookId: bigint, chapterId: bigint | null, analysisType: string, provider: string, resultContent: string): Promise<bigint>;
    saveAnnotations(analysisId: bigint, annotationData: Array<{
        explanation: string;
        color: string;
        text: string;
        proposal: string;
    }>): Promise<boolean>;
    sendMessage(bookId: bigint, role: string, content: string, provider: string): Promise<bigint>;
    updateBook(id: bigint, title: string, description: string, category: string): Promise<boolean>;
    updateChapter(id: bigint, title: string, content: string): Promise<boolean>;
    updateChapterIndents(id: bigint, indentLeft: bigint, indentRight: bigint, indentFirstLine: bigint): Promise<boolean>;
}
