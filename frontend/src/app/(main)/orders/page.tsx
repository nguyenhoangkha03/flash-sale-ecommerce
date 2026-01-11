"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
    created_at: string;
    paid_at?: string;
}

export default function OrdersPage() {
    const router = useRouter();
    const auth = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>("");

    useEffect(() => {
        if (!auth.isAuthenticated) {
            router.push("/login");
            return;
        }

        const fetchOrders = async () => {
            try {
                setIsLoading(true);
                const url = filterStatus
                    ? `/orders/my?status=${filterStatus}`
                    : "/orders/my";
                const response = await axiosInstance.get(url);
                setOrders(response.data);
            } catch (error) {
                console.error("Error fetching orders:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOrders();
    }, [auth.isAuthenticated, router, filterStatus]);

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

    const statusColor = {
        PAID: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400",
        PENDING_PAYMENT:
            "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400",
        CANCELLED:
            "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400",
        EXPIRED:
            "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400",
    };

    const statusLabel = {
        PAID: "✓ Đã thanh toán",
        PENDING_PAYMENT: "⏳ Chờ thanh toán",
        CANCELLED: "✗ Đã hủy",
        EXPIRED: "✗ Hết hạn",
    };

    const statusIcon = {
        PAID: "verified_user",
        PENDING_PAYMENT: "schedule",
        CANCELLED: "cancel",
        EXPIRED: "error",
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
                        Đơn Hàng Của Tôi
                    </span>
                </div>

                {/* Page Heading */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8 border-b border-slate-200 dark:border-accent-brown pb-8">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-slate-900 dark:text-white text-4xl font-black leading-tight tracking-[-0.033em]">
                            Đơn Hàng Của Tôi
                        </h1>
                        <p className="text-slate-500 dark:text-text-secondary-dark text-lg font-medium">
                            {orders.length} đơn hàng
                        </p>
                    </div>

                    <Link
                        href="/"
                        className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-bold"
                    >
                        Tiếp Tục Mua Sắm
                    </Link>
                </div>

                {/* Filter */}
                <div className="mb-8">
                    <label className="block text-sm font-bold text-slate-900 dark:text-white mb-3">
                        Lọc Theo Trạng Thái:
                    </label>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2 border border-slate-200 dark:border-accent-brown rounded-lg bg-white dark:bg-card-dark text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                    >
                        <option value="">Tất Cả</option>
                        <option value="PAID">✓ Đã Thanh Toán</option>
                        <option value="PENDING_PAYMENT">⏳ Chờ Thanh Toán</option>
                        <option value="CANCELLED">✗ Đã Hủy</option>
                        <option value="EXPIRED">✗ Hết Hạn</option>
                    </select>
                </div>

                {/* Orders List */}
                {orders.length === 0 ? (
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
                            Bạn chưa có đơn hàng
                        </p>
                        <Link
                            href="/"
                            className="mt-6 inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-bold"
                        >
                            Bắt Đầu Mua Sắm
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <Link
                                key={order.id}
                                href={`/orders/${order.id}`}
                                className="block bg-white dark:bg-card-dark rounded-xl border border-slate-200 dark:border-accent-brown p-6 hover:shadow-lg dark:hover:shadow-xl transition-shadow"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {/* Order ID */}
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 dark:text-text-secondary-dark uppercase mb-2">
                                            Mã Đơn Hàng
                                        </p>
                                        <p className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                                            {order.id.substring(0, 12)}...
                                        </p>
                                    </div>

                                    {/* Total Amount */}
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 dark:text-text-secondary-dark uppercase mb-2">
                                            Tổng Tiền
                                        </p>
                                        <p className="text-2xl font-black text-primary">
                                            {order.total_amount.toLocaleString(
                                                "vi-VN"
                                            )}
                                            đ
                                        </p>
                                    </div>

                                    {/* Status */}
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 dark:text-text-secondary-dark uppercase mb-2">
                                            Trạng Thái
                                        </p>
                                        <div
                                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold ${
                                                statusColor[
                                                    order.status as keyof typeof statusColor
                                                ]
                                            }`}
                                        >
                                            <span className="material-symbols-outlined text-base">
                                                {
                                                    statusIcon[
                                                        order.status as keyof typeof statusIcon
                                                    ]
                                                }
                                            </span>
                                            {
                                                statusLabel[
                                                    order.status as keyof typeof statusLabel
                                                ]
                                            }
                                        </div>
                                    </div>

                                    {/* Time */}
                                    <div className="lg:text-right">
                                        <p className="text-xs font-bold text-slate-500 dark:text-text-secondary-dark uppercase mb-2">
                                            Thời Gian
                                        </p>
                                        <p className="font-semibold text-slate-900 dark:text-white">
                                            {new Date(
                                                order.created_at
                                            ).toLocaleDateString("vi-VN")}
                                        </p>
                                        <p className="text-xs text-slate-600 dark:text-text-secondary-dark">
                                            {new Date(
                                                order.created_at
                                            ).toLocaleTimeString("vi-VN", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </p>
                                    </div>
                                </div>

                                {/* Items Preview */}
                                {order.items.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                        <p className="text-xs font-bold text-slate-500 dark:text-text-secondary-dark uppercase mb-2">
                                            Sản Phẩm ({order.items.length})
                                        </p>
                                        <p className="text-sm text-slate-700 dark:text-text-secondary-dark">
                                            {order.items
                                                .map(
                                                    (item) =>
                                                        `${item.quantity} ×`
                                                )
                                                .join(", ")} sản phẩm
                                        </p>
                                    </div>
                                )}
                            </Link>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
