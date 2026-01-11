"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useCartStore } from "@/store/cartStore";
import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

export default function CheckoutPage() {
    const router = useRouter();
    const auth = useAuth();
    const cartItems = useCartStore((state) => state.items);
    const clearCart = useCartStore((state) => state.clearCart);
    const [isLoading, setIsLoading] = useState(false);
    const [cartError, setCartError] = useState<string | null>(null);
    const [outOfStockItems, setOutOfStockItems] = useState<string[]>([]);
    const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);

    useEffect(() => {
        // Redirect to login if not authenticated
        if (!auth.isAuthenticated) {
            router.push("/login");
        }
    }, [auth.isAuthenticated, router]);

    // Generate idempotency key once when component mounts (per checkout session)
    useEffect(() => {
        if (!idempotencyKey && cartItems.length > 0) {
            const key = `res_${Date.now()}_${Math.random()
                .toString(36)
                .substr(2, 9)}`;
            setIdempotencyKey(key);
        }
    }, [cartItems.length, idempotencyKey]);

    // Check stock for all items
    useEffect(() => {
        const checkStock = async () => {
            if (cartItems.length === 0) return;

            try {
                const outOfStock: string[] = [];
                for (const item of cartItems) {
                    const response = await axiosInstance.get(
                        `/products/${item.id}`
                    );
                    const product = response.data;

                    if (product.available_stock < item.quantity) {
                        outOfStock.push(item.id);
                    }
                }

                if (outOfStock.length > 0) {
                    setOutOfStockItems(outOfStock);
                    setCartError(
                        `${outOfStock.length} sản phẩm không đủ hàng. Vui lòng kiểm tra lại.`
                    );
                } else {
                    setOutOfStockItems([]);
                    setCartError(null);
                }
            } catch (error) {
                console.error("Lỗi kiểm tra tồn kho:", error);
            }
        };

        checkStock();
    }, [cartItems]);

    const handleCreateReservation = async () => {
        if (cartItems.length === 0) {
            toast.error("Giỏ hàng trống");
            return;
        }

        if (outOfStockItems.length > 0) {
            toast.error("Vui lòng xóa các sản phẩm hết hàng trước");
            return;
        }

        if (!idempotencyKey) {
            toast.error("Lỗi hệ thống, vui lòng reload trang");
            return;
        }

        setIsLoading(true);
        try {
            const items = cartItems.map((item) => ({
                productId: item.id,
                quantity: item.quantity,
            }));

            const response = await axiosInstance.post("/reservations", {
                items,
                idempotency_key: idempotencyKey,
            });
            const reservation = response.data;

            toast.success("Giữ hàng thành công!");
            clearCart();
            router.push(`/payment/${reservation.id}`);
        } catch (error: any) {
            const errorMessage =
                error.response?.data?.message || "Không thể tạo đơn giữ hàng";
            toast.error(errorMessage);
            console.error("Lỗi tạo reservation:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveOutOfStockItem = (productId: string) => {
        const removeItem = useCartStore.getState().removeItem;
        removeItem(productId);
        toast.success("Đã xóa sản phẩm khỏi giỏ");
    };

    if (!auth.isAuthenticated) {
        return null;
    }

    return (
        <div className="bg-background-light dark:bg-background-dark min-h-screen">
            <main className="max-w-[1200px] mx-auto w-full px-4 md:px-10 py-8">
                {/* Breadcrumbs */}
                <div className="flex flex-wrap gap-2 mb-6">
                    <Link
                        href="/"
                        className="text-slate-500 dark:text-text-secondary-dark text-sm font-medium hover:underline"
                    >
                        Trang Chủ
                    </Link>
                    <span className="text-slate-400 dark:text-text-secondary-dark text-sm">
                        /
                    </span>
                    <Link
                        href="/cart"
                        className="text-slate-500 dark:text-text-secondary-dark text-sm font-medium hover:underline"
                    >
                        Giỏ Hàng
                    </Link>
                    <span className="text-slate-400 dark:text-text-secondary-dark text-sm">
                        /
                    </span>
                    <span className="text-slate-900 dark:text-white text-sm font-semibold">
                        Thanh Toán
                    </span>
                </div>

                {cartItems.length === 0 ? (
                    /* Empty Checkout */
                    <div className="text-center py-12">
                        <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                        </svg>
                        <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
                            Giỏ Hàng Trống
                        </h3>
                        <p className="mt-2 text-gray-600 dark:text-text-secondary-dark">
                            Vui lòng thêm sản phẩm vào giỏ hàng trước
                        </p>
                        <Link
                            href="/"
                            className="mt-6 inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            Tiếp Tục Mua Sắm
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Page Heading */}
                        <div className="flex flex-col gap-2 mb-8 border-b border-slate-200 dark:border-accent-brown pb-8">
                            <h1 className="text-slate-900 dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
                                Thanh Toán
                            </h1>
                            <p className="text-slate-500 dark:text-text-secondary-dark text-lg font-medium">
                                {cartItems.length} sản phẩm,{" "}
                                {cartItems.reduce(
                                    (sum, item) => sum + item.quantity,
                                    0
                                )}{" "}
                                đơn vị
                            </p>
                        </div>

                        {/* Checkout Content Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                            {/* Left Column: Checkout Items */}
                            <div className="lg:col-span-2 space-y-4">
                                {/* Error Alert */}
                                {cartError && (
                                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                                        <p className="text-red-700 dark:text-red-400 font-semibold mb-4">
                                            ⚠️ {cartError}
                                        </p>
                                        <div className="space-y-2">
                                            {outOfStockItems.map((itemId) => {
                                                const item = cartItems.find(
                                                    (i) => i.id === itemId
                                                );
                                                return (
                                                    <div
                                                        key={itemId}
                                                        className="flex justify-between items-center p-3 bg-red-100 dark:bg-red-900/30 rounded-lg"
                                                    >
                                                        <div>
                                                            <p className="text-red-900 dark:text-red-300 font-semibold">
                                                                {item?.name}
                                                            </p>
                                                            <p className="text-sm text-red-700 dark:text-red-400">
                                                                Yêu cầu:{" "}
                                                                {item?.quantity}
                                                                , Tồn:{" "}
                                                                {
                                                                    item?.availableStock
                                                                }
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() =>
                                                                handleRemoveOutOfStockItem(
                                                                    itemId
                                                                )
                                                            }
                                                            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                                                        >
                                                            Xóa
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Checkout Items */}
                                {cartItems.map((item) => (
                                    <div
                                        key={item.id}
                                        className={`flex justify-between items-center p-4 border rounded-xl transition-colors ${
                                            outOfStockItems.includes(item.id)
                                                ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900"
                                                : "bg-primary/5 border-primary/20 dark:bg-primary/5 dark:border-primary/30"
                                        }`}
                                    >
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-slate-900 dark:text-white">
                                                {item.name}
                                            </h3>
                                            <p className="text-sm text-slate-600 dark:text-text-secondary-dark mt-1">
                                                {item.quantity} ×{" "}
                                                {item.price.toLocaleString(
                                                    "vi-VN"
                                                )}
                                                đ
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-slate-900 dark:text-white">
                                                {(
                                                    item.price * item.quantity
                                                ).toLocaleString("vi-VN")}
                                                đ
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-text-secondary-dark mt-1">
                                                Tồn: {item.availableStock}
                                            </p>
                                        </div>
                                    </div>
                                ))}

                                {/* Notice Box */}
                                <div className="mt-8 p-6 bg-primary/5 rounded-xl border border-primary/20 flex gap-4">
                                    <span className="material-symbols-outlined text-primary text-3xl flex-shrink-0">
                                        info
                                    </span>
                                    <div>
                                        <p className="text-slate-900 dark:text-white font-bold mb-1">
                                            Giữ Hàng Tạm Thời
                                        </p>
                                        <p className="text-slate-600 dark:text-text-secondary-dark text-sm leading-relaxed">
                                            Khi bấm "Giữ hàng", hệ thống sẽ giữ
                                            lại các sản phẩm này trong 10 phút.
                                            Hãy hoàn tất thanh toán trước khi
                                            hết hạn.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Checkout Summary */}
                            <div className="lg:col-span-1">
                                <div className="bg-primary/5 border-primary/20 dark:bg-primary/5 dark:border-primary/30 rounded-xl border p-6 sticky top-24">
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">
                                        Tóm Tắt Đơn Hàng
                                    </h2>

                                    <div className="space-y-4 mb-6 pb-6 border-b border-primary/20 dark:border-primary/30">
                                        <div className="flex justify-between">
                                            <span className="text-slate-600 dark:text-text-secondary-dark">
                                                Tạm tính:
                                            </span>
                                            <span className="font-semibold text-slate-900 dark:text-white">
                                                {cartItems
                                                    .reduce(
                                                        (sum, item) =>
                                                            sum +
                                                            item.price *
                                                                item.quantity,
                                                        0
                                                    )
                                                    .toLocaleString("vi-VN")}
                                                đ
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-600 dark:text-text-secondary-dark">
                                                Số lượng:
                                            </span>
                                            <span className="font-semibold text-slate-900 dark:text-white">
                                                {cartItems.reduce(
                                                    (sum, item) =>
                                                        sum + item.quantity,
                                                    0
                                                )}{" "}
                                                sản phẩm
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between mb-8">
                                        <span className="text-lg font-bold text-slate-900 dark:text-white">
                                            Tổng cộng:
                                        </span>
                                        <span className="text-2xl font-black text-primary">
                                            {cartItems
                                                .reduce(
                                                    (sum, item) =>
                                                        sum +
                                                        item.price *
                                                            item.quantity,
                                                    0
                                                )
                                                .toLocaleString("vi-VN")}
                                            đ
                                        </span>
                                    </div>

                                    <button
                                        onClick={handleCreateReservation}
                                        disabled={
                                            isLoading ||
                                            outOfStockItems.length > 0
                                        }
                                        className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-all ${
                                            isLoading ||
                                            outOfStockItems.length > 0
                                                ? "bg-slate-400 dark:bg-slate-600 cursor-not-allowed"
                                                : "bg-primary hover:bg-primary/90 active:scale-95"
                                        }`}
                                    >
                                        {isLoading
                                            ? "Đang xử lý..."
                                            : "Giữ Hàng (10 phút)"}
                                    </button>

                                    <p className="mt-3 text-xs text-slate-500 dark:text-text-secondary-dark text-center">
                                        Đơn giữ hàng sẽ hết hạn sau 10 phút
                                    </p>

                                    <button
                                        onClick={() => router.push("/cart")}
                                        className="w-full mt-4 py-2 px-4 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                                    >
                                        ← Quay Lại Giỏ Hàng
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
