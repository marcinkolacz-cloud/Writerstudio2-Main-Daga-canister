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
export interface Chapter {
    id: bigint;
    charCount: bigint;
    title: string;
    content: string;
    wordCount: bigint;
    createdAt: bigint;
    bookId: bigint;
    updatedAt: bigint;
    orderIndex: bigint;
}
export interface backendInterface {
    createBook(title: string, description: string, category: string): Promise<bigint>;
    createChapter(bookId: bigint, title: string): Promise<bigint>;
    deleteBook(id: bigint): Promise<boolean>;
    deleteChapter(id: bigint): Promise<boolean>;
    getBook(id: bigint): Promise<Book | null>;
    getChapter(id: bigint): Promise<Chapter | null>;
    listBooksByOwner(): Promise<Array<Book>>;
    listChaptersByBook(bookId: bigint): Promise<Array<Chapter>>;
    reorderChapters(bookId: bigint, orderedIds: Array<bigint>): Promise<boolean>;
    updateBook(id: bigint, title: string, description: string, category: string): Promise<boolean>;
    updateChapter(id: bigint, title: string, content: string): Promise<boolean>;
}
