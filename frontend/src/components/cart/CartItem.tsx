"use client";

import { useCartStore, CartItem } from "@/store/cartStore";
import toast from "react-hot-toast";
import { formatVND } from "@/lib/currency";

interface CartItemProps {
    item: CartItem;
}

export function CartItemComponent({ item }: CartItemProps) {
    const updateQuantity = useCartStore((state) => state.updateQuantity);
    const removeItem = useCartStore((state) => state.removeItem);

    const handleIncrement = () => {
        if (item.quantity < item.availableStock) {
            updateQuantity(item.id, item.quantity + 1);
        } else {
            toast.error("Không thể vượt quá số lượng tồn kho");
        }
    };

    const handleDecrement = () => {
        if (item.quantity > 1) {
            updateQuantity(item.id, item.quantity - 1);
        } else {
            removeItem(item.id);
        }
    };

    const subtotal = item.price * item.quantity;

    return (
        <div className="flex gap-4 p-4 bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-accent-brown">
            {/* Product Image */}
            <div className="w-32 h-32 rounded-lg bg-slate-100 dark:bg-accent-brown overflow-hidden shrink-0">
                <img
                    alt={item.name}
                    className="w-full h-full object-cover"
                    src={item.image || "https://via.placeholder.com/150"}
                />
            </div>

            {/* Product Info */}
            <div className="flex flex-col justify-between flex-1 py-1">
                <div className="flex justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                            {item.name}
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-text-secondary-dark">
                            SKU: {item.id}
                        </p>
                    </div>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                        {formatVND(item.price)}
                    </p>
                </div>

                {/* Quantity Controls & Remove */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center border border-slate-200 dark:border-accent-brown rounded-lg bg-slate-50 dark:bg-[#231a10]">
                        <button
                            onClick={handleDecrement}
                            className="px-3 py-1 text-slate-500 hover:text-primary transition-colors"
                        >
                            <span className="material-symbols-outlined text-sm">
                                remove
                            </span>
                        </button>
                        <span className="px-3 py-1 font-bold text-sm text-white">
                            {item.quantity}
                        </span>
                        <button
                            onClick={handleIncrement}
                            className="px-3 py-1 text-slate-500 hover:text-primary transition-colors"
                        >
                            <span className="material-symbols-outlined text-sm">
                                add
                            </span>
                        </button>
                    </div>
                    <button
                        onClick={() => {
                            removeItem(item.id);
                            toast.success("Đã xóa khỏi giỏ hàng");
                        }}
                        className="text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                    >
                        <span className="material-symbols-outlined text-lg">
                            delete
                        </span>
                        <span className="text-xs font-medium">Xóa</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
