"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import axiosInstance from "@/lib/axios";
import Link from "next/link";

interface OrderItem {
    id: string;
    product_id: string;
    quantity: number;
    price_snapshot: number;
}

interface Order {
    id: string;
    user_id: string;
    status: string;
    total_amount: number;
    items: OrderItem[];
    paid_at: string;
    created_at: string;
}

export default function OrderDetailPage() {
    const router = useRouter();
    const params = useParams();
    const auth = useAuth();
    const orderId = params.orderId as string;

    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Don't redirect if auth is still loading
        if (auth.isLoading) {
            return;
        }

        if (!auth.isAuthenticated) {
            router.push("/login");
            return;
        }

        const fetchOrder = async () => {
            try {
                setIsLoading(true);
                const response = await axiosInstance.get(`/orders/${orderId}`);
                setOrder(response.data);
            } catch (err: any) {
                const errorMessage =
                    err.response?.data?.message ||
                    "Không thể tải thông tin đơn hàng";
                setError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrder();
    }, [orderId, auth.isAuthenticated, auth.isLoading, router]);

    if (!auth.isAuthenticated) {
        return null;
    }

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

    if (error || !order) {
        return (
            <div className="bg-background-light dark:bg-background-dark min-h-screen">
                <main className="max-w-[1200px] mx-auto w-full px-4 md:px-10 py-8">
                    <div className="text-center py-12">
                        <h2 className="text-xl font-semibold text-red-600 mb-4">
                            Lỗi
                        </h2>
                        <p className="text-gray-600 dark:text-text-secondary-dark mb-6">
                            {error || "Không tìm thấy đơn hàng"}
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

    const statusColor = {
        PAID: "text-green-600 dark:text-green-400",
        PENDING_PAYMENT: "text-yellow-600 dark:text-yellow-400",
        CANCELLED: "text-red-600 dark:text-red-400",
        EXPIRED: "text-red-600 dark:text-red-400",
    };

    const statusBg = {
        PAID: "bg-green-100 dark:bg-green-900/30",
        PENDING_PAYMENT: "bg-yellow-100 dark:bg-yellow-900/30",
        CANCELLED: "bg-red-100 dark:bg-red-900/30",
        EXPIRED: "bg-red-100 dark:bg-red-900/30",
    };

    const statusLabel = {
        PAID: "✓ Thanh toán thành công",
        PENDING_PAYMENT: "⏳ Chờ thanh toán",
        CANCELLED: "✗ Đã hủy",
        EXPIRED: "✗ Đã hết hạn",
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
                    <Link
                        href="/orders"
                        className="text-slate-500 dark:text-text-secondary-dark text-sm font-medium hover:underline"
                    >
                        Đơn Hàng
                    </Link>
                    <span className="text-slate-400 dark:text-text-secondary-dark text-sm">
                        /
                    </span>
                    <span className="text-slate-900 dark:text-white text-sm font-semibold">
                        Chi Tiết
                    </span>
                </div>

                {/* Success Header */}
                {order.status === "PAID" && (
                    <div className="mb-8 text-center">
                        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                            <span className="material-symbols-outlined text-4xl text-green-600 dark:text-green-400">
                                check_circle
                            </span>
                        </div>
                        <h1 className="text-slate-900 dark:text-white text-4xl font-black leading-tight tracking-[-0.033em] mb-2">
                            Thanh Toán Thành Công!
                        </h1>
                        <p className="text-slate-600 dark:text-text-secondary-dark text-lg">
                            Đơn hàng của bạn đã được xác nhận
                        </p>
                    </div>
                )}

                {/* Page Heading */}
                <div className="flex flex-col gap-2 mb-8 border-b border-slate-200 dark:border-accent-brown pb-8">
                    <h1 className="text-slate-900 dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
                        Chi Tiết Đơn Hàng
                    </h1>
                    <p className="text-slate-500 dark:text-text-secondary-dark text-lg font-medium">
                        {order.items.length} sản phẩm, {order.items.reduce((sum, item) => sum + item.quantity, 0)} đơn vị
                    </p>
                </div>

                {/* Order Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Left Column: Items */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Status Badge */}
                        <div className={`p-4 rounded-xl border flex items-center gap-3 ${
                            statusBg[order.status as keyof typeof statusBg]
                        } ${statusColor[order.status as keyof typeof statusColor].replace('text-', 'border-')}`}>
                            <span className="material-symbols-outlined text-2xl">
                                {order.status === "PAID"
                                    ? "verified_user"
                                    : order.status === "PENDING_PAYMENT"
                                      ? "schedule"
                                      : "cancel"}
                            </span>
                            <div>
                                <p className="font-bold">
                                    {statusLabel[order.status as keyof typeof statusLabel]}
                                </p>
                                {order.status === "PAID" && order.paid_at && (
                                    <p className="text-xs">
                                        {new Date(order.paid_at).toLocaleString("vi-VN")}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Items */}
                        {order.items.map((item, index) => (
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
                                <p className="text-slate-900 dark:text-white font-bold mb-2">
                                    Thông Tin Đơn Hàng
                                </p>
                                <div className="text-sm text-slate-600 dark:text-text-secondary-dark space-y-1">
                                    <p>
                                        <span className="font-semibold">Mã đơn:</span> {order.id.slice(0, 12)}...
                                    </p>
                                    <p>
                                        <span className="font-semibold">Tạo lúc:</span> {new Date(order.created_at).toLocaleString("vi-VN")}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-accent-brown p-6 sticky top-24">
                            <h2 className="text-xl text-white font-bold mb-6 border-b border-slate-100 dark:border-accent-brown pb-4">
                                Tóm Tắt Đơn Hàng
                            </h2>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-slate-600 dark:text-text-secondary-dark">
                                    <span>Tạm tính:</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">
                                        {order.total_amount.toLocaleString("vi-VN")}đ
                                    </span>
                                </div>
                                <div className="flex justify-between text-slate-600 dark:text-text-secondary-dark">
                                    <span>Số lượng:</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">
                                        {order.items.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm
                                    </span>
                                </div>
                            </div>

                            <div className="flex justify-between items-end mb-8">
                                <span className="text-lg font-bold text-white">
                                    Tổng Cộng
                                </span>
                                <div className="text-right">
                                    <span className="text-3xl font-black text-primary">
                                        {order.total_amount.toLocaleString("vi-VN")}đ
                                    </span>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-tighter">
                                        Bao gồm VAT
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Link
                                    href="/"
                                    className="block w-full py-3 px-4 bg-primary hover:bg-primary/90 text-white text-center rounded-lg font-bold transition-colors"
                                >
                                    Tiếp Tục Mua Sắm
                                </Link>
                                <Link
                                    href="/orders"
                                    className="block w-full py-2 px-4 border border-slate-300 dark:border-accent-brown text-slate-900 dark:text-white text-center rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-900/50 transition"
                                >
                                    Xem Tất Cả Đơn Hàng
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
