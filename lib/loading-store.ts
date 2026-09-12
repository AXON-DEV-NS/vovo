import { create } from "zustand";

/**
 * Global loading state.
 *
 * Multiple independent operations (navigation, API mutations) can overlap;
 * the overlay stays visible while at least one reason is registered and
 * disappears only when all of them finish.
 */
interface LoadingState {
  reasons: Set<string>;
  active: boolean;
  begin: (reason: string) => void;
  end: (reason: string) => void;
  clear: () => void;
}

export const useLoadingStore = create<LoadingState>((set) => ({
  reasons: new Set<string>(),
  active: false,
  begin: (reason) =>
    set((state) => {
      const next = new Set(state.reasons);
      next.add(reason);
      return { reasons: next, active: true };
    }),
  end: (reason) =>
    set((state) => {
      const next = new Set(state.reasons);
      next.delete(reason);
      return { reasons: next, active: next.size > 0 };
    }),
  clear: () => set({ reasons: new Set<string>(), active: false }),
}));
