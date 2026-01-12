"use client";

import { useCartHydrate } from "@/hooks/useCartHydrate";
import { useAuthHydrate } from "@/hooks/useAuthHydrate";

export function HydrationProvider({ children }: { children: React.ReactNode }) {
    useCartHydrate();
    useAuthHydrate();
    return <>{children}</>;
}
