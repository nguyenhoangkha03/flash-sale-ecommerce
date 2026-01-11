"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import axiosInstance from "@/lib/axios";
import { ReservationTimer } from "@/components/reservation/ReservationTimer";
import toast from "react-hot-toast";

interface ReservationItem {
    id: string;
    product_id: string;
    quantity: number;
    price_snapshot: number;
}

interface Reservation {
    id: string;
    user_id: string;
    status: string;
    expires_at: string;
    items: ReservationItem[];
    created_at: string;
}

export default function PaymentPage() {
    const router = useRouter();
    const params = useParams();
    const auth = useAuth();
    const reservationId = params.reservationId as string;

    const [reservation, setReservation] = useState<Reservation | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPaymentLoading, setIsPaymentLoading] = useState(false);
    const [reservationExpired, setReservationExpired] = useState(false);

    // Fetch reservation details
    useEffect(() => {
        const fetchReservation = async () => {
            try {
                setIsLoading(true);
                const response = await axiosInstance.get(
                    `/reservations/${reservationId}`
                );
                setReservation(response.data);

                // Check if reservation is already expired
                if (response.data.status !== "ACTIVE") {
                    setReservationExpired(true);
                    toast.error("Đơn giữ hàng đã hết hạn");
                }
            } catch (err: any) {
                // If 401 Unauthorized, redirect to login
                if (err.response?.status === 401) {
                    router.push("/login");
                    return;
                }
                const errorMessage =
                    err.response?.data?.message ||
                    "Không thể tải thông tin đơn giữ hàng";
                setError(errorMessage);
                toast.error(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReservation();
    }, [reservationId, router]);

    const handlePayment = async () => {
        if (!reservation) return;

        setIsPaymentLoading(true);
        try {
            // First create order from reservation with idempotency key
            const orderIdempotencyKey = `ord_${reservation.id}`;
            const orderResponse = await axiosInstance.post("/orders", {
                reservation_id: reservation.id,
                idempotency_key: orderIdempotencyKey,
            });
            const order = orderResponse.data;

            // Then pay the order with idempotency key
            const paymentId = `pay_${Date.now()}`;
            const paymentResponse = await axiosInstance.post(
                `/orders/${order.id}/pay`,
                {
                    payment_id: paymentId,
                }
            );
            toast.success("Thanh toán thành công!");
            router.push(`/orders/${paymentResponse.data.id}`);
        } catch (err: any) {
            const errorMessage =
                err.response?.data?.message || "Thanh toán thất bại";
            toast.error(errorMessage);
            console.error("Payment error:", err);
        } finally {
            setIsPaymentLoading(false);
        }
    };

    const handleReservationExpired = () => {
        setReservationExpired(true);
    };

    if (isLoading) {
        return (
            <div className="bg-background-light dark:bg-background-dark min-h-screen">
                <main className="max-w-[1200px] mx-auto w-full px-4 md:px-10 py-8">
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        <p className="mt-4 text-gray-600 dark:text-text-secondary-dark">
                            Đang tải...
                        </p>
                    </div>
                </main>
            </div>
        );
    }

    if (error || !reservation) {
        return (
            <div className="bg-background-light dark:bg-background-dark min-h-screen">
                <main className="max-w-[1200px] mx-auto w-full px-4 md:px-10 py-8">
                    <div className="text-center py-12">
                        <h2 className="text-xl font-semibold text-red-600 mb-4">
                            Lỗi
                        </h2>
                        <p className="text-gray-600 dark:text-text-secondary-dark mb-6">
                            {error || "Không tìm thấy đơn giữ hàng"}
                        </p>
                        <Link
                            href="/"
                            className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            Quay lại Trang Chủ
                        </Link>
                    </div>
                </main>
            </div>
        );
    }

    const totalAmount = reservation.items.reduce(
        (sum, item) => sum + item.price_snapshot * item.quantity,
        0
    );

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

                {/* Page Heading */}
                <div className="flex flex-col gap-2 mb-8 border-b border-slate-200 dark:border-accent-brown pb-8">
                    <h1 className="text-slate-900 dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
                        Thanh Toán Đơn Giữ Hàng
                    </h1>
                    <p className="text-slate-500 dark:text-text-secondary-dark text-lg font-medium">
                        {reservation.items.length} sản phẩm, {reservation.items.reduce((sum, item) => sum + item.quantity, 0)} đơn vị
                    </p>
                </div>

                {/* Error Alert */}
                {reservationExpired && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                        <p className="text-red-700 dark:text-red-400 font-semibold">
                            ⚠️ Đơn giữ hàng đã hết hạn. Hàng sẽ được trả lại kho.
                        </p>
                    </div>
                )}

                {/* Payment Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Left Column: Items */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Items List */}
                        {reservation.items.map((item, index) => (
                            <div
                                key={item.id}
                                className="flex justify-between items-center p-4 border rounded-xl bg-primary/5 border-primary/20 dark:bg-primary/10 dark:border-primary/30"
                            >
                                <div className="flex-1">
                                    <h3 className="font-semibold text-slate-900 dark:text-white">
                                        Sản phẩm {index + 1}
                                    </h3>
                                    <p className="text-sm text-slate-600 dark:text-text-secondary-dark mt-1">
                                        {item.quantity} × {item.price_snapshot.toLocaleString("vi-VN")}đ
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-slate-900 dark:text-white">
                                        {(item.price_snapshot * item.quantity).toLocaleString("vi-VN")}đ
                                    </p>
                                </div>
                            </div>
                        ))}

                        {/* Info Box */}
                        <div className="mt-8 p-6 bg-primary/5 rounded-xl border border-primary/20 flex gap-4">
                            <span className="material-symbols-outlined text-primary text-3xl flex-shrink-0">
                                info
                            </span>
                            <div>
                                <p className="text-slate-900 dark:text-white font-bold mb-1">
                                    Thông Tin Đơn Hàng
                                </p>
                                <div className="text-sm text-slate-600 dark:text-text-secondary-dark space-y-1">
                                    <p>
                                        <span className="font-semibold">Mã đơn:</span> {reservation.id.slice(0, 12)}...
                                    </p>
                                    <p>
                                        <span className="font-semibold">Trạng thái:</span>{" "}
                                        <span className={reservation.status === "ACTIVE" ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                                            {reservation.status === "ACTIVE" ? "Đang chờ" : reservation.status}
                                        </span>
                                    </p>
                                    <p>
                                        <span className="font-semibold">Tạo lúc:</span> {new Date(reservation.created_at).toLocaleString("vi-VN")}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-accent-brown p-6 sticky top-24">
                            {/* Timer */}
                            <div className="mb-6">
                                <ReservationTimer
                                    expiresAt={reservation.expires_at}
                                    onExpired={handleReservationExpired}
                                />
                            </div>

                            {/* Summary */}
                            <h2 className="text-xl text-white font-bold mb-6 border-b border-slate-100 dark:border-accent-brown pb-4">
                                Tóm Tắt Đơn Hàng
                            </h2>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-slate-600 dark:text-text-secondary-dark">
                                    <span>Tạm tính:</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">
                                        {totalAmount.toLocaleString("vi-VN")}đ
                                    </span>
                                </div>
                            </div>

                            <div className="flex justify-between items-end mb-8">
                                <span className="text-lg font-bold text-white">
                                    Tổng Cộng
                                </span>
                                <div className="text-right">
                                    <span className="text-3xl font-black text-primary">
                                        {totalAmount.toLocaleString("vi-VN")}đ
                                    </span>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-tighter">
                                        Bao gồm VAT
                                    </p>
                                </div>
                            </div>

                            {/* Payment Button */}
                            <button
                                onClick={handlePayment}
                                disabled={isPaymentLoading || reservationExpired}
                                className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-all ${
                                    isPaymentLoading || reservationExpired
                                        ? "bg-slate-400 dark:bg-slate-600 cursor-not-allowed"
                                        : "bg-primary hover:bg-primary/90 active:scale-95"
                                }`}
                            >
                                {isPaymentLoading
                                    ? "Đang xử lý..."
                                    : "Hoàn Tất Thanh Toán"}
                            </button>

                            <p className="mt-3 text-xs text-slate-500 dark:text-text-secondary-dark text-center">
                                {reservationExpired
                                    ? "Đơn giữ hàng đã hết hạn"
                                    : "Bấm nút trên để hoàn tất thanh toán"}
                            </p>

                            <button
                                onClick={() => router.push("/reservations")}
                                className="w-full mt-4 py-2 px-4 border border-slate-300 dark:border-accent-brown rounded-lg font-medium text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-900/50 transition"
                            >
                                ← Xem Tất Cả Đơn Giữ
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
