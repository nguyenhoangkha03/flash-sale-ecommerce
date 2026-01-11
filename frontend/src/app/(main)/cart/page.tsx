"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useCartStore } from "@/store/cartStore";
import { CartItemComponent } from "@/components/cart/CartItem";
import { CartSummary } from "@/components/cart/CartSummary";

export default function CartPage() {
    const router = useRouter();
    const auth = useAuth();
    const items = useCartStore((state) => state.items);
    const clearCart = useCartStore((state) => state.clearCart);

    const handleCheckout = () => {
        if (!auth.isAuthenticated) {
            router.push("/login");
            return;
        }
        router.push("/checkout");
    };

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
                    <span className="text-slate-900 dark:text-white text-sm font-semibold">
                        Giỏ Hàng
                    </span>
                </div>

                {items.length === 0 ? (
                    /* Empty Cart */
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
                            Chưa có sản phẩm nào trong giỏ hàng
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
                        {/* Page Heading & Timer */}
                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 border-b border-slate-200 dark:border-accent-brown pb-8">
                            <div className="flex flex-col gap-2">
                                <h1 className="text-slate-900 dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
                                    Giỏ Hàng Của Tôi
                                </h1>
                                <p className="text-slate-500 dark:text-text-secondary-dark text-lg font-medium">
                                    {items.length} sản phẩm được dành riêng cho
                                    bạn
                                </p>
                            </div>

                            {/* Reservation Timer */}
                            <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 flex items-center gap-6">
                                <div className="flex flex-col">
                                    <span className="text-primary text-xs font-bold uppercase tracking-wider">
                                        Hết Hạn Trong
                                    </span>
                                    <div className="flex gap-2 items-center mt-1">
                                        <div className="flex flex-col items-center">
                                            <div className="bg-primary text-white font-black text-xl px-3 py-1 rounded-lg">
                                                09
                                            </div>
                                            <span className="text-[10px] text-slate-600 dark:text-text-secondary-dark font-bold mt-1 uppercase">
                                                Phút
                                            </span>
                                        </div>
                                        <span className="text-primary font-bold text-xl mb-4">
                                            :
                                        </span>
                                        <div className="flex flex-col items-center">
                                            <div className="bg-primary text-white font-black text-xl px-3 py-1 rounded-lg">
                                                52
                                            </div>
                                            <span className="text-[10px] text-slate-600 dark:text-text-secondary-dark font-bold mt-1 uppercase">
                                                Giây
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="h-12 w-px bg-primary/20 hidden sm:block"></div>
                                <div className="flex-col hidden sm:flex">
                                    <div className="flex justify-between mb-1">
                                        <span className="text-xs font-semibold text-primary">
                                            Thời Gian Còn Lại
                                        </span>
                                        <span className="text-xs font-bold text-primary">
                                            92%
                                        </span>
                                    </div>
                                    <div className="w-48 h-2 bg-primary/20 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary"
                                            style={{ width: "92%" }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Cart Content Grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                            {/* Left Column: Cart Items */}
                            <div className="lg:col-span-2 space-y-4">
                                {items.map((item) => (
                                    <CartItemComponent
                                        key={item.id}
                                        item={item}
                                    />
                                ))}

                                {/* Notice Box */}
                                <div className="mt-8 p-6 bg-primary/5 rounded-xl border border-primary/20 flex gap-4">
                                    <span className="material-symbols-outlined text-primary text-3xl flex-shrink-0">
                                        info
                                    </span>
                                    <div>
                                        <p className="text-slate-900 dark:text-white font-bold mb-1">
                                            Chính Sách Giữ Giỏ Hàng
                                        </p>
                                        <p className="text-slate-600 dark:text-text-secondary-dark text-sm leading-relaxed">
                                            Các sản phẩm trong giỏ hàng chỉ được
                                            giữ lại trong 10 phút để đảm bảo
                                            công bằng cho tất cả mọi người trong
                                            Flash Sale này. Khi hết thời gian,
                                            các sản phẩm sẽ được trả lại vào kho
                                            chung.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Order Summary */}
                            <CartSummary handleCheckout={handleCheckout} />
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
