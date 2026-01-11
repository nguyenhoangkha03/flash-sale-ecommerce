"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useCartStore } from "@/store/cartStore";
import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";
import { ReservationTimer } from "@/components/reservation/ReservationTimer";

const RESERVATION_STORAGE_KEY = "active_reservation";

export function CartSummary({
    handleCheckout,
}: {
    handleCheckout: () => void;
}) {
    const router = useRouter();
    const auth = useAuth();
    const items = useCartStore((state) => state.items);
    const totalItems = useCartStore((state) => state.getTotalItems());
    const totalPrice = useCartStore((state) => state.getTotalPrice());
    const clearCart = useCartStore((state) => state.clearCart);
    const [promoCode, setPromoCode] = useState("");
    const [isHoldLoading, setIsHoldLoading] = useState(false);
    const [activeReservation, setActiveReservation] = useState<{
        id: string;
        expiresAt: string;
    } | null>(null);
    const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);

    // Load reservation from localStorage on mount
    useEffect(() => {
        const savedReservation = localStorage.getItem(RESERVATION_STORAGE_KEY);
        if (savedReservation) {
            try {
                const reservation = JSON.parse(savedReservation);
                setActiveReservation(reservation);
            } catch (e) {
                localStorage.removeItem(RESERVATION_STORAGE_KEY);
            }
        }
    }, []);

    // Save reservation to localStorage when it changes
    useEffect(() => {
        if (activeReservation) {
            localStorage.setItem(
                RESERVATION_STORAGE_KEY,
                JSON.stringify(activeReservation)
            );
        } else {
            localStorage.removeItem(RESERVATION_STORAGE_KEY);
        }
    }, [activeReservation]);

    // Generate idempotency key on first hold attempt
    const getIdempotencyKey = () => {
        if (!idempotencyKey) {
            const key = `res_${Date.now()}_${Math.random()
                .toString(36)
                .substr(2, 9)}`;
            setIdempotencyKey(key);
            return key;
        }
        return idempotencyKey;
    };

    const handleHoldCart = async () => {
        if (items.length === 0) {
            toast.error("Giỏ hàng trống");
            return;
        }

        if (!auth.isAuthenticated) {
            router.push("/login");
            return;
        }

        setIsHoldLoading(true);
        try {
            const itemsData = items.map((item) => ({
                productId: item.id,
                quantity: item.quantity,
            }));

            const key = getIdempotencyKey();

            const response = await axiosInstance.post("/reservations", {
                items: itemsData,
                idempotency_key: key,
            });

            const reservation = response.data;
            setActiveReservation({
                id: reservation.id,
                expiresAt: reservation.expires_at,
            });
            toast.success("Giữ hàng thành công!");
        } catch (error: any) {
            const errorMessage =
                error.response?.data?.message || "Không thể giữ hàng";
            toast.error(errorMessage);
            console.error("Lỗi giữ hàng:", error);
        } finally {
            setIsHoldLoading(false);
        }
    };

    const handlePaymentNow = () => {
        if (activeReservation) {
            router.push(`/payment/${activeReservation.id}`);
        }
    };

    const handleReservationExpired = () => {
        setActiveReservation(null);
        toast.error("Đơn giữ hàng đã hết hạn!");
    };

    const shipping = 0; // FREE
    const tax = totalPrice * 0.1; // 10% tax estimate
    const total = totalPrice + shipping + tax;

    // If reservation is active, show payment interface
    if (activeReservation) {
        return (
            <div className="sticky top-24">
                <div className="p-6 bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-accent-brown shadow-sm">
                    <h2 className="text-xl text-white font-bold mb-6 border-b border-slate-100 dark:border-accent-brown pb-4">
                        Đơn Giữ Hàng Đang Hoạt Động
                    </h2>

                    {/* Timer */}
                    <div className="mb-6">
                        <ReservationTimer
                            expiresAt={activeReservation.expiresAt}
                            onExpired={handleReservationExpired}
                        />
                    </div>

                    <div className="space-y-3 mb-6">
                        <div className="flex justify-between text-slate-600 dark:text-text-secondary-dark">
                            <span>Tổng Phụ</span>
                            <span>
                                {totalPrice.toLocaleString("vi-VN", {
                                    style: "currency",
                                    currency: "VND",
                                })}
                            </span>
                        </div>
                        <div className="flex justify-between text-slate-600 dark:text-text-secondary-dark">
                            <span>Vận Chuyển</span>
                            <span className="text-primary font-bold">MIỄN PHÍ</span>
                        </div>
                        <div className="flex justify-between text-slate-600 dark:text-text-secondary-dark">
                            <span>Ước Tính Thuế</span>
                            <span>
                                {tax.toLocaleString("vi-VN", {
                                    style: "currency",
                                    currency: "VND",
                                })}
                            </span>
                        </div>
                    </div>

                    <div className="flex justify-between items-end mb-8">
                        <span className="text-lg font-bold text-white">
                            Tổng Cộng
                        </span>
                        <div className="text-right">
                            <span className="text-3xl font-black text-primary">
                                {total.toLocaleString("vi-VN", {
                                    style: "currency",
                                    currency: "VND",
                                })}
                            </span>
                            <p className="text-[10px] text-slate-400 uppercase tracking-tighter">
                                Bao gồm VAT
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handlePaymentNow}
                        className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                    >
                        Tiến Hành Thanh Toán
                        <span className="material-symbols-outlined">
                            arrow_forward
                        </span>
                    </button>

                    <button
                        onClick={() => {
                            setActiveReservation(null);
                            setIdempotencyKey(null);
                        }}
                        className="w-full mt-3 py-2 px-4 border border-slate-300 dark:border-accent-brown rounded-lg font-medium text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-900/50 transition"
                    >
                        ← Quay Lại Giỏ Hàng
                    </button>
                </div>
            </div>
        );
    }

    // Normal cart view
    return (
        <div className="sticky top-24">
            {/* Order Summary Card */}
            <div className="p-6 bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-accent-brown shadow-sm">
                <h2 className="text-xl text-white font-bold mb-6 border-b border-slate-100 dark:border-accent-brown pb-4">
                    Tóm Tắt Đơn Hàng
                </h2>

                <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-slate-600 dark:text-text-secondary-dark">
                        <span>Tổng Phụ</span>
                        <span>
                            {totalPrice.toLocaleString("vi-VN", {
                                style: "currency",
                                currency: "VND",
                            })}
                        </span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-text-secondary-dark">
                        <span>Vận Chuyển</span>
                        <span className="text-primary font-bold">MIỄN PHÍ</span>
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-text-secondary-dark">
                        <span>Ước Tính Thuế</span>
                        <span>
                            {tax.toLocaleString("vi-VN", {
                                style: "currency",
                                currency: "VND",
                            })}
                        </span>
                    </div>
                </div>

                <div className="flex justify-between items-end mb-8">
                    <span className="text-lg font-bold text-white">
                        Tổng Cộng
                    </span>
                    <div className="text-right">
                        <span className="text-3xl font-black text-primary">
                            {total.toLocaleString("vi-VN", {
                                style: "currency",
                                currency: "VND",
                            })}
                        </span>
                        <p className="text-[10px] text-slate-400 uppercase tracking-tighter">
                            Bao gồm VAT
                        </p>
                    </div>
                </div>

                {/* Hold Button - 10 min */}
                <button
                    onClick={handleHoldCart}
                    disabled={items.length === 0 || isHoldLoading}
                    className="w-full bg-primary/80 hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] mb-3"
                >
                    {isHoldLoading ? "Đang giữ hàng..." : "Giữ Hàng (10 phút)"}
                    <span className="material-symbols-outlined">schedule</span>
                </button>

                <button
                    onClick={handleCheckout}
                    disabled={items.length === 0}
                    className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                    Tiến Hành Thanh Toán
                    <span className="material-symbols-outlined">
                        arrow_forward
                    </span>
                </button>

                <div className="mt-6 space-y-4">
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-text-secondary-dark">
                        <span className="material-symbols-outlined text-lg text-primary">
                            verified_user
                        </span>
                        Thanh toán SSL 256-bit được mã hóa an toàn
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-text-secondary-dark">
                        <span className="material-symbols-outlined text-lg text-primary">
                            local_shipping
                        </span>
                        Vận chuyển trong vòng 24 giờ
                    </div>
                </div>
            </div>

            {/* Promo Code */}
            <div className="mt-4 p-4 bg-slate-50 dark:bg-card-dark rounded-xl border border-dashed border-slate-300 dark:border-accent-brown">
                <div className="flex gap-2">
                    <input
                        className="bg-white dark:bg-accent-brown border-none rounded-lg flex-1 text-sm focus:ring-1 focus:ring-primary px-3 py-2 text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-text-secondary-dark"
                        placeholder="Mã Khuyến Mãi"
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                    />
                    <button className="bg-slate-200 dark:bg-accent-brown px-4 rounded-lg font-bold text-sm hover:bg-slate-300 dark:hover:bg-primary/20 transition-colors text-slate-900 dark:text-white">
                        Áp Dụng
                    </button>
                </div>
            </div>
        </div>
    );
}
