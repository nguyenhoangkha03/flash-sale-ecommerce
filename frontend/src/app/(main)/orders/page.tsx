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
            <div className="min-h-screen bg-gray-50 py-12 px-4 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Đang tải...</p>
                </div>
            </div>
        );
    }

    const statusColor = {
        PAID: "bg-green-100 text-green-800",
        PENDING_PAYMENT: "bg-yellow-100 text-yellow-800",
        CANCELLED: "bg-red-100 text-red-800",
        EXPIRED: "bg-red-100 text-red-800",
    };

    const statusLabel = {
        PAID: "Đã thanh toán",
        PENDING_PAYMENT: "Chờ thanh toán",
        CANCELLED: "Đã hủy",
        EXPIRED: "Hết hạn",
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Đơn hàng của tôi
                    </h1>
                    <Link
                        href="/"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Tiếp tục mua sắm
                    </Link>
                </div>

                {/* Filter */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Lọc theo trạng thái:
                    </label>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">Tất cả</option>
                        <option value="PAID">Đã thanh toán</option>
                        <option value="PENDING_PAYMENT">Chờ thanh toán</option>
                        <option value="CANCELLED">Đã hủy</option>
                        <option value="EXPIRED">Hết hạn</option>
                    </select>
                </div>

                {/* Orders List */}
                {orders.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg shadow">
                        <p className="text-gray-600 mb-4">
                            Không có đơn hàng nào
                        </p>
                        <Link
                            href="/"
                            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Bắt đầu mua sắm
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => (
                            <Link
                                key={order.id}
                                href={`/order/${order.id}`}
                                className="block bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Mã đơn hàng
                                        </p>
                                        <p className="font-mono font-semibold text-gray-900 break-all">
                                            {order.id.substring(0, 8)}...
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Tổng tiền
                                        </p>
                                        <p className="font-bold text-blue-600">
                                            {order.total_amount.toLocaleString(
                                                "vi-VN"
                                            )}
                                            đ
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Trạng thái
                                        </p>
                                        <span
                                            className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                                                statusColor[
                                                    order.status as keyof typeof statusColor
                                                ]
                                            }`}
                                        >
                                            {
                                                statusLabel[
                                                    order.status as keyof typeof statusLabel
                                                ]
                                            }
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">
                                            Thời gian
                                        </p>
                                        <p className="text-gray-900">
                                            {new Date(
                                                order.created_at
                                            ).toLocaleDateString("vi-VN")}
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
