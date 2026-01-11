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
            <div className="min-h-screen bg-gray-50 py-12 px-4 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Đang tải...</p>
                </div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4">
                <div className="max-w-2xl mx-auto text-center bg-white rounded-lg shadow p-8">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">
                        Lỗi
                    </h1>
                    <p className="text-gray-600 mb-6">
                        {error || "Không tìm thấy đơn hàng"}
                    </p>
                    <Link
                        href="/"
                        className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Quay lại mua sắm
                    </Link>
                </div>
            </div>
        );
    }

    const statusColor = {
        PAID: "text-green-600",
        PENDING_PAYMENT: "text-yellow-600",
        CANCELLED: "text-red-600",
        EXPIRED: "text-red-600",
    };

    const statusLabel = {
        PAID: "✓ Thanh toán thành công",
        PENDING_PAYMENT: "⏳ Chờ thanh toán",
        CANCELLED: "✗ Đã hủy",
        EXPIRED: "✗ Đã hết hạn",
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                {/* Success Header */}
                {order.status === "PAID" && (
                    <div className="mb-8 text-center">
                        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                            <svg
                                className="h-8 w-8 text-green-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Thanh toán thành công!
                        </h1>
                        <p className="text-gray-600">
                            Đơn hàng của bạn đã được xác nhận
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Order Details */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow p-6 mb-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">
                                Chi tiết đơn hàng
                            </h2>

                            <div className="space-y-4 mb-6 pb-6 border-b">
                                {order.items.map((item, index) => (
                                    <div
                                        key={item.id}
                                        className="flex justify-between items-center"
                                    >
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                Sản phẩm {index + 1}
                                            </p>
                                            <p className="text-sm text-gray-600">
                                                {item.quantity} ×{" "}
                                                {item.price_snapshot.toLocaleString(
                                                    "vi-VN"
                                                )}
                                                đ
                                            </p>
                                        </div>
                                        <p className="font-semibold text-gray-900">
                                            {(
                                                item.price_snapshot *
                                                item.quantity
                                            ).toLocaleString("vi-VN")}
                                            đ
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="mb-8">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Thông tin đơn hàng
                                </h3>
                                <div className="space-y-3 text-sm text-gray-600">
                                    <div className="flex justify-between">
                                        <span>Mã đơn hàng:</span>
                                        <span className="font-mono font-semibold">
                                            {order.id}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Trạng thái:</span>
                                        <span
                                            className={`font-medium ${
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
                                    <div className="flex justify-between">
                                        <span>Thời gian đặt:</span>
                                        <span>
                                            {new Date(
                                                order.created_at
                                            ).toLocaleString("vi-VN")}
                                        </span>
                                    </div>
                                    {order.status === "PAID" &&
                                        order.paid_at && (
                                            <div className="flex justify-between">
                                                <span>
                                                    Thời gian thanh toán:
                                                </span>
                                                <span>
                                                    {new Date(
                                                        order.paid_at
                                                    ).toLocaleString("vi-VN")}
                                                </span>
                                            </div>
                                        )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow p-6 sticky top-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-6">
                                Tóm tắt đơn hàng
                            </h2>

                            <div className="space-y-4 mb-6 pb-6 border-b">
                                <div className="flex justify-between text-gray-600">
                                    <span>Tạm tính:</span>
                                    <span className="font-semibold">
                                        {order.total_amount.toLocaleString(
                                            "vi-VN"
                                        )}
                                        đ
                                    </span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Số lượng:</span>
                                    <span>
                                        {order.items.reduce(
                                            (sum, item) => sum + item.quantity,
                                            0
                                        )}{" "}
                                        sản phẩm
                                    </span>
                                </div>
                            </div>

                            <div className="flex justify-between mb-6">
                                <span className="text-lg font-semibold text-gray-900">
                                    Tổng cộng:
                                </span>
                                <span className="text-lg font-bold text-blue-600">
                                    {order.total_amount.toLocaleString("vi-VN")}
                                    đ
                                </span>
                            </div>

                            <div className="space-y-3">
                                <Link
                                    href="/"
                                    className="block w-full py-3 px-4 bg-blue-600 text-white text-center rounded-lg font-semibold hover:bg-blue-700 transition"
                                >
                                    Tiếp tục mua sắm
                                </Link>
                                <Link
                                    href="/orders"
                                    className="block w-full py-3 px-4 border border-gray-300 text-gray-900 text-center rounded-lg font-semibold hover:bg-gray-50 transition"
                                >
                                    Xem tất cả đơn hàng
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
