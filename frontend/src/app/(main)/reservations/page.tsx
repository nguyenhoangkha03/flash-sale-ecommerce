"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";
import { ReservationTimer } from "@/components/reservation/ReservationTimer";
import { formatVND } from "@/lib/currency";
import FullScreenLoader from "@/components/ui/FullScreenLoader";

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

export default function ReservationsPage() {
    const router = useRouter();
    const auth = useAuth();
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Redirect to login if not authenticated
        if (auth.isInitialized && !auth.isAuthenticated) {
            router.push("/login");
        }

        const fetchReservations = async () => {
            try {
                setIsLoading(true);
                const response = await axiosInstance.get(
                    "/reservations/user/active"
                );
                setReservations(response.data);
                setError(null);
            } catch (err: any) {
                if (err.response?.status === 401) {
                    router.push("/login");
                    return;
                }
                const errorMessage =
                    err.response?.data?.message ||
                    "Không thể tải danh sách đơn giữ hàng";
                setError(errorMessage);
                toast.error(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReservations();
    }, [auth.isAuthenticated, auth.isInitialized, router]);

    if (!auth.isAuthenticated) {
        return null;
    }

    if (isLoading) {
        return <FullScreenLoader />;
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
                    <span className="text-slate-900 dark:text-white text-sm font-semibold">
                        Đơn Hàng Đã Giữ Chỗ
                    </span>
                </div>

                {error ? (
                    <div className="text-center py-12">
                        <h2 className="text-xl font-semibold text-red-600 mb-4">
                            Lỗi
                        </h2>
                        <p className="text-gray-600 dark:text-text-secondary-dark mb-6">
                            {error}
                        </p>
                        <Link
                            href="/"
                            className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            Quay lại Trang Chủ
                        </Link>
                    </div>
                ) : reservations.length === 0 ? (
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
                                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                            />
                        </svg>
                        <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
                            Không có đơn hàng nào
                        </h3>
                        <p className="mt-2 text-gray-600 dark:text-text-secondary-dark">
                            Bạn chưa có đơn hàng đã giữ chỗ
                        </p>
                        <Link
                            href="/"
                            className="mt-6 inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            Bắt Đầu Mua Sắm
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Page Heading */}
                        <div className="flex flex-col gap-2 mb-8 border-b border-slate-200 dark:border-accent-brown pb-8">
                            <h1 className="text-slate-900 dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
                                Đơn Hàng Đã Giữ Chỗ
                            </h1>
                            <p className="text-slate-500 dark:text-text-secondary-dark text-lg font-medium">
                                {reservations.length} đơn hàng đang chờ thanh
                                toán
                            </p>
                        </div>

                        {/* Reservations Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {reservations.map((reservation) => {
                                const totalValue = reservation.items.reduce(
                                    (sum, item) =>
                                        sum +
                                        item.price_snapshot * item.quantity,
                                    0
                                );

                                return (
                                    <div
                                        key={reservation.id}
                                        className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-accent-brown p-6 hover:shadow-lg dark:hover:shadow-xl transition-shadow"
                                    >
                                        {/* Header */}
                                        <div className="flex justify-between items-start mb-4 pb-4 border-b border-slate-200 dark:border-accent-brown">
                                            <div>
                                                <p className="text-xs text-slate-500 dark:text-text-secondary-dark font-semibold uppercase">
                                                    Mã Đơn
                                                </p>
                                                <p className="text-sm font-mono text-slate-900 dark:text-white mt-1">
                                                    {reservation.id.slice(0, 8)}
                                                    ...
                                                </p>
                                            </div>
                                            <span className="inline-block px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-semibold">
                                                {reservation.status}
                                            </span>
                                        </div>

                                        {/* Items Count */}
                                        <div className="mb-4">
                                            <p className="text-xs text-slate-500 dark:text-text-secondary-dark font-semibold mb-2">
                                                SỐ LƯỢNG HÀNG
                                            </p>
                                            <p className="text-2xl font-black text-slate-900 dark:text-white">
                                                {reservation.items.reduce(
                                                    (sum, item) =>
                                                        sum + item.quantity,
                                                    0
                                                )}{" "}
                                                <span className="text-sm font-medium text-slate-500 dark:text-text-secondary-dark">
                                                    sản phẩm
                                                </span>
                                            </p>
                                        </div>

                                        {/* Total Value */}
                                        <div className="mb-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                                            <p className="text-xs text-slate-500 dark:text-text-secondary-dark font-semibold mb-1">
                                                TỔNG GIÁ TRỊ
                                            </p>
                                            <p className="text-3xl font-black text-primary">
                                                {formatVND(totalValue)}
                                            </p>
                                        </div>

                                        {/* Time Left - Use ReservationTimer */}
                                        <div className="mb-6">
                                            <ReservationTimer
                                                expiresAt={
                                                    reservation.expires_at
                                                }
                                                onExpired={() => {
                                                    // Refresh list khi hết hạn
                                                    window.location.reload();
                                                }}
                                            />
                                        </div>

                                        {/* Action Button */}
                                        <button
                                            onClick={() =>
                                                router.push(
                                                    `/payment/${reservation.id}`
                                                )
                                            }
                                            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg transition-colors"
                                        >
                                            Thanh Toán Ngay
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
