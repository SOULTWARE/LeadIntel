'use client';

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type InternalLayoutState = {
  title: string;
  icon?: ReactNode;
  rightSlot?: ReactNode;
};

type InternalLayoutContextValue = InternalLayoutState & {
  setLayout: (next: InternalLayoutState) => void;
};

const InternalLayoutContext = createContext<InternalLayoutContextValue | null>(null);

export function InternalLayoutProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<InternalLayoutState>({ title: '' });

  const value = useMemo(() => ({
    ...state,
    setLayout: setState,
  }), [state]);

  return (
    <InternalLayoutContext.Provider value={value}>
      {children}
    </InternalLayoutContext.Provider>
  );
}

export function useInternalLayout(): InternalLayoutContextValue {
  const ctx = useContext(InternalLayoutContext);
  if (!ctx) {
    throw new Error('useInternalLayout must be used within InternalLayoutProvider');
  }
  return ctx;
}

export function useInternalLayoutOptional(): InternalLayoutContextValue | null {
  return useContext(InternalLayoutContext);
}
