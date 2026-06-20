import type { Principal } from "@icp-sdk/core/principal";
import { create } from "zustand";

interface AppState {
  principal: Principal | null;
  isAuthenticated: boolean;
  setPrincipal: (principal: Principal | null) => void;
  clearAuth: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  principal: null,
  isAuthenticated: false,
  setPrincipal: (principal) =>
    set({ principal, isAuthenticated: principal !== null }),
  clearAuth: () => set({ principal: null, isAuthenticated: false }),
}));
