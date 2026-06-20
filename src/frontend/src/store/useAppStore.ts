import { create } from "zustand";

// biome-ignore lint/complexity/noBannedTypes: placeholder store for future state
type AppState = {};

export const useAppStore = create<AppState>(() => ({
  // Empty store for now
}));
