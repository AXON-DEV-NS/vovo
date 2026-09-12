import { create } from "zustand";

export type TransitionPhase = "idle" | "expanding" | "covered" | "shrinking";

export interface TransitionOrigin {
  x: number;
  y: number;
}

export type TransitionTarget = "signup" | "signin";

interface TransitionState {
  phase: TransitionPhase;
  origin: TransitionOrigin;
  target: TransitionTarget;
  startExpand: (origin: TransitionOrigin, target: TransitionTarget) => void;
  markCovered: () => void;
  startShrink: () => void;
  reset: () => void;
}

export const useTransitionStore = create<TransitionState>((set) => ({
  phase: "idle",
  origin: { x: 0, y: 0 },
  target: "signup",
  startExpand: (origin, target) =>
    set({ phase: "expanding", origin, target }),
  markCovered: () => set({ phase: "covered" }),
  startShrink: () => set({ phase: "shrinking" }),
  reset: () => set({ phase: "idle" }),
}));
