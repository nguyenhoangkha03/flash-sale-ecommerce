import { useEffect } from "react";
import { useCartStore } from "@/store/cartStore";

export const useCartHydrate = () => {
    useEffect(() => {
        useCartStore.getState().hydrate();
    }, []);
};
