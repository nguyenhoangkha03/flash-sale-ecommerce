"use client";

import { useCartStore, CartItem } from "@/store/cartStore";
import toast from "react-hot-toast";

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
        <div className="flex items-center gap-4 border-b pb-4">
            {/* Product Info */}
            <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                    {item.name}
                </h3>
                <p className="text-gray-600 text-sm">
                    Giá:{" "}
                    {item.price.toLocaleString("vi-VN", {
                        style: "currency",
                        currency: "VND",
                    })}
                </p>
            </div>

            {/* Quantity Controls */}
            <div className="flex items-center border border-gray-300 rounded-md">
                <button
                    onClick={handleDecrement}
                    className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                >
                    −
                </button>
                <input
                    type="text"
                    value={item.quantity}
                    readOnly
                    className="w-12 text-center border-l border-r border-gray-300 py-1"
                />
                <button
                    onClick={handleIncrement}
                    className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                >
                    +
                </button>
            </div>

            {/* Subtotal */}
            <div className="text-right min-w-30">
                <p className="text-lg font-bold text-blue-600">
                    {subtotal.toLocaleString("vi-VN", {
                        style: "currency",
                        currency: "VND",
                    })}
                </p>
                <p className="text-xs text-gray-500">x{item.quantity}</p>
            </div>

            {/* Remove Button */}
            <button
                onClick={() => {
                    removeItem(item.id);
                    toast.success("Đã xóa khỏi giỏ hàng");
                }}
                className="px-4 py-2 text-red-600 border border-red-600 rounded-md hover:bg-red-50"
            >
                Xóa
            </button>
        </div>
    );
}
