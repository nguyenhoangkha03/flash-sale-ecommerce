import { create } from "zustand";

export interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    availableStock: number;
}

interface CartState {
    items: CartItem[];
    addItem: (item: CartItem) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    removeItem: (productId: string) => void;
    clearCart: () => void;
    getTotalItems: () => number;
    getTotalPrice: () => number;
    hydrate: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
    items: [],

    addItem: (item: CartItem) => {
        set((state) => {
            const existingItem = state.items.find((i) => i.id === item.id);
            if (existingItem) {
                return {
                    items: state.items.map((i) =>
                        i.id === item.id
                            ? {
                                  ...i,
                                  quantity: Math.min(
                                      i.quantity + item.quantity,
                                      i.availableStock
                                  ),
                              }
                            : i
                    ),
                };
            }
            return { items: [...state.items, item] };
        });

        // Persist to localStorage
        localStorage.setItem("cart", JSON.stringify(get().items));
    },

    updateQuantity: (productId: string, quantity: number) => {
        set((state) => ({
            items: state.items
                .map((item) =>
                    item.id === productId ? { ...item, quantity } : item
                )
                .filter((item) => item.quantity > 0),
        }));

        localStorage.setItem("cart", JSON.stringify(get().items));
    },

    removeItem: (productId: string) => {
        set((state) => ({
            items: state.items.filter((item) => item.id !== productId),
        }));

        localStorage.setItem("cart", JSON.stringify(get().items));
    },

    clearCart: () => {
        set({ items: [] });
        localStorage.removeItem("cart");
    },

    getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
    },

    getTotalPrice: () => {
        return get().items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        );
    },

    hydrate: () => {
        if (typeof window !== "undefined") {
            const cartData = localStorage.getItem("cart");
            if (cartData) {
                try {
                    const items = JSON.parse(cartData);
                    set({ items });
                } catch (error) {
                    console.error("Không thể tải dữ liệu giỏ hàng:", error);
                }
            }
        }
    },
}));
