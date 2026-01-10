'use client';

import { useCartHydrate } from '@/hooks/useCartHydrate';

export function HydrationProvider({ children }: { children: React.ReactNode }) {
  useCartHydrate();
  return <>{children}</>;
}
