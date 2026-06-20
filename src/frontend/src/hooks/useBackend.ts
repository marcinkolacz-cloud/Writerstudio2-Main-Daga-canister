import { type Analysis, type TextAnnotation, createActor } from "@/backend";
import type { Book, Chapter } from "@/backend";
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
      chapterId,
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
        chapterId,
        analysisType,
        provider,
        resultContent,
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["analyses", variables.bookId],
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

  return useMutation({
    mutationFn: async ({
      analysisId,
      annotations,
    }: {
      analysisId: bigint;
      annotations: Array<{
        text: string;
        color: string;
        explanation: string;
        proposal: string;
      }>;
    }) => {
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
