"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

type TopbarEndSlotContextValue = {
  endSlot: ReactNode | null;
  setEndSlot: Dispatch<SetStateAction<ReactNode | null>>;
};

const TopbarEndSlotContext = createContext<TopbarEndSlotContextValue | null>(
  null,
);

export function TopbarEndSlotProvider({ children }: { children: ReactNode }) {
  const [endSlot, setEndSlot] = useState<ReactNode | null>(null);
  const value = useMemo(() => ({ endSlot, setEndSlot }), [endSlot]);
  return (
    <TopbarEndSlotContext.Provider value={value}>
      {children}
    </TopbarEndSlotContext.Provider>
  );
}

export function useTopbarEndSlot() {
  const ctx = useContext(TopbarEndSlotContext);
  if (!ctx) {
    throw new Error("useTopbarEndSlot must be used within TopbarEndSlotProvider");
  }
  return ctx;
}
