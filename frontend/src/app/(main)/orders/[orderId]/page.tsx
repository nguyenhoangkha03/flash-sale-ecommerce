"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import axiosInstance from "@/lib/axios";
import Link from "next/link";
import { formatVND } from "@/lib/currency";
import toast from "react-hot-toast";
import FullScreenLoader from "@/components/ui/FullScreenLoader";

interface OrderItem {
    id: string;
    product_id: string;
    quantity: number;
    price_snapshot: number;
    product?: {
        id: string;
        name: string;
        image_url: string;
    };
}

interface Order {
    id: string;
    user_id: string;
    status: string;
    total_amount: number;
    items: OrderItem[];
    payment_expires_at: string;
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
    const [isPaymentLoading, setIsPaymentLoading] = useState(false);
    const [isCancelLoading, setIsCancelLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number>(0);

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

    // Timer for PENDING_PAYMENT countdown
    useEffect(() => {
        if (
            !order ||
            order.status !== "PENDING_PAYMENT" ||
            !order.payment_expires_at
        ) {
            return;
        }

        const timer = setInterval(() => {
            const expiresAt = new Date(order.payment_expires_at).getTime();
            const now = new Date().getTime();
            const remaining = Math.max(0, expiresAt - now);
            setTimeLeft(Math.ceil(remaining / 1000));

            if (remaining <= 0) {
                clearInterval(timer);
                // Refresh order to get updated status
                axiosInstance.get(`/orders/${orderId}`).then((res) => {
                    setOrder(res.data);
                });
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [order, orderId]);

    const handlePayment = async () => {
        if (!order) return;

        setIsPaymentLoading(true);
        try {
            const paymentId = `pay_${Date.now()}`;
            const response = await axiosInstance.post(
                `/orders/${order.id}/pay`,
                {
                    payment_id: paymentId,
                }
            );
            setOrder(response.data);
            toast.success("Thanh toán thành công!");
            // Auto refresh after success
            setTimeout(() => {
                axiosInstance.get(`/orders/${orderId}`).then((res) => {
                    setOrder(res.data);
                });
            }, 1000);
        } catch (err: any) {
            const errorMessage =
                err.response?.data?.message || "Thanh toán thất bại";
            toast.error(errorMessage);
            console.error("Payment error:", err);
        } finally {
            setIsPaymentLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!order) return;

        if (
            !confirm(
                "Bạn chắc chắn muốn hủy đơn hàng này? Hàng sẽ được trả lại kho."
            )
        ) {
            return;
        }

        setIsCancelLoading(true);
        try {
            await axiosInstance.post(`/orders/${order.id}/cancel`);
            toast.success("Đơn hàng đã được hủy thành công");
            // Refresh to get updated status
            const response = await axiosInstance.get(`/orders/${orderId}`);
            setOrder(response.data);
        } catch (err: any) {
            const errorMessage =
                err.response?.data?.message || "Hủy đơn hàng thất bại";
            toast.error(errorMessage);
            console.error("Cancel error:", err);
        } finally {
            setIsCancelLoading(false);
        }
    };

    if (!auth.isAuthenticated) {
        return null;
    }

    if (isLoading) {
        return <FullScreenLoader />;
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
        PAID: "Thanh toán thành công",
        PENDING_PAYMENT: "Chờ thanh toán",
        CANCELLED: "Đã hủy",
        EXPIRED: "Đã hết hạn",
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
                        {order.items.length} sản phẩm,{" "}
                        {order.items.reduce(
                            (sum, item) => sum + item.quantity,
                            0
                        )}{" "}
                        đơn vị
                    </p>
                </div>

                {/* Order Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Left Column: Items */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Status Badge */}
                        <div
                            className={`p-4 rounded-xl border flex items-center gap-3 ${
                                statusBg[order.status as keyof typeof statusBg]
                            } ${statusColor[
                                order.status as keyof typeof statusColor
                            ].replace("text-", "border-")}`}
                        >
                            <span className="material-symbols-outlined text-2xl">
                                {order.status === "PAID"
                                    ? "verified_user"
                                    : order.status === "PENDING_PAYMENT"
                                    ? "schedule"
                                    : "cancel"}
                            </span>
                            <div>
                                <p className="font-bold">
                                    {
                                        statusLabel[
                                            order.status as keyof typeof statusLabel
                                        ]
                                    }
                                </p>
                                {order.status === "PAID" && order.paid_at && (
                                    <p className="text-xs">
                                        {new Date(order.paid_at).toLocaleString(
                                            "vi-VN"
                                        )}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Items */}
                        {order.items.map((item, index) => (
                            <div
                                key={item.id}
                                className="flex gap-4 p-4 border rounded-xl bg-primary/5 border-primary/20 dark:bg-primary/10 dark:border-primary/30"
                            >
                                {/* Product Image */}
                                <div className="flex-shrink-0">
                                    {item.product?.image_url ? (
                                        <img
                                            src={item.product.image_url}
                                            alt={item.product.name}
                                            className="w-20 h-20 object-cover rounded-lg"
                                        />
                                    ) : (
                                        <div className="w-20 h-20 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                                            <span className="material-symbols-outlined text-slate-400">
                                                image
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Product Info */}
                                <div className="flex-1">
                                    <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-2">
                                        {item.product?.name || `Sản phẩm ${index + 1}`}
                                    </h3>
                                    <p className="text-sm text-slate-600 dark:text-text-secondary-dark mt-2">
                                        {item.quantity} ×{" "}
                                        {formatVND(item.price_snapshot)}
                                    </p>
                                </div>

                                {/* Total Price */}
                                <div className="text-right flex-shrink-0">
                                    <p className="font-bold text-slate-900 dark:text-white">
                                        {formatVND(
                                            item.price_snapshot * item.quantity
                                        )}
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
                                        <span className="font-semibold">
                                            Mã đơn:
                                        </span>{" "}
                                        {order.id.slice(0, 12)}...
                                    </p>
                                    <p>
                                        <span className="font-semibold">
                                            Tạo lúc:
                                        </span>{" "}
                                        {new Date(
                                            order.created_at
                                        ).toLocaleString("vi-VN")}
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
                                        {formatVND(order.total_amount)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-slate-600 dark:text-text-secondary-dark">
                                    <span>Số lượng:</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">
                                        {order.items.reduce(
                                            (sum, item) => sum + item.quantity,
                                            0
                                        )}{" "}
                                        sản phẩm
                                    </span>
                                </div>
                            </div>

                            <div className="flex justify-between items-end mb-8">
                                <span className="text-lg font-bold text-white">
                                    Tổng Cộng
                                </span>
                                <div className="text-right">
                                    <span className="text-3xl font-black text-primary">
                                        {formatVND(order.total_amount)}
                                    </span>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-tighter">
                                        Bao gồm VAT
                                    </p>
                                </div>
                            </div>

                            {/* Status Badge */}
                            <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-accent-brown">
                                <p className="text-xs text-slate-500 dark:text-text-secondary-dark font-semibold mb-2 uppercase">
                                    Trạng Thái
                                </p>
                                <div
                                    className={`text-lg font-bold px-3 py-2 rounded inline-block ${
                                        order.status === "PAID"
                                            ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                                            : order.status === "PENDING_PAYMENT"
                                            ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400"
                                            : order.status === "CANCELLED"
                                            ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                                            : "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                                    }`}
                                >
                                    {order.status === "PAID"
                                        ? "Thanh toán thành công"
                                        : order.status === "PENDING_PAYMENT"
                                        ? "Chờ thanh toán"
                                        : order.status === "CANCELLED"
                                        ? "Đã hủy"
                                        : "Đã hết hạn"}
                                </div>
                            </div>

                            {/* Timer for PENDING_PAYMENT */}
                            {order.status === "PENDING_PAYMENT" && (
                                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <p className="text-xs text-slate-500 dark:text-text-secondary-dark font-semibold mb-2 uppercase">
                                        Thời Gian Còn Lại
                                    </p>
                                    <p className="text-3xl font-black text-blue-600 dark:text-blue-400">
                                        {Math.floor(timeLeft / 60)}:
                                        {String(timeLeft % 60).padStart(2, "0")}
                                    </p>
                                    <p className="text-xs text-slate-600 dark:text-text-secondary-dark mt-2">
                                        Vui lòng thanh toán trước khi hết thời
                                        gian
                                    </p>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                {order.status === "PENDING_PAYMENT" && (
                                    <>
                                        <button
                                            onClick={handlePayment}
                                            disabled={
                                                isPaymentLoading ||
                                                timeLeft <= 0
                                            }
                                            className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-all ${
                                                isPaymentLoading ||
                                                timeLeft <= 0
                                                    ? "bg-slate-400 dark:bg-slate-600 cursor-not-allowed"
                                                    : "bg-primary hover:bg-primary/90 active:scale-95"
                                            }`}
                                        >
                                            {isPaymentLoading
                                                ? "Đang xử lý..."
                                                : "Thanh Toán Ngay"}
                                        </button>
                                        <button
                                            onClick={handleCancel}
                                            disabled={isCancelLoading}
                                            className={`w-full py-2 px-4 border border-red-300 dark:border-red-800 rounded-lg font-medium transition-all ${
                                                isCancelLoading
                                                    ? "bg-slate-100 dark:bg-slate-900 text-slate-400 cursor-not-allowed"
                                                    : "bg-white dark:bg-card-dark text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                            }`}
                                        >
                                            {isCancelLoading
                                                ? "Đang hủy..."
                                                : "Hủy Đơn"}
                                        </button>
                                    </>
                                )}
                                {order.status === "PAID" && (
                                    <>
                                        <Link
                                            href="/"
                                            className="block w-full py-3 px-4 bg-primary hover:bg-primary/90 text-white text-center rounded-lg font-bold transition-colors"
                                        >
                                            Tiếp Tục Mua Sắm
                                        </Link>
                                    </>
                                )}
                                {(order.status === "CANCELLED" ||
                                    order.status === "EXPIRED") && (
                                    <>
                                        <Link
                                            href="/reservations"
                                            className="block w-full py-3 px-4 bg-primary hover:bg-primary/90 text-white text-center rounded-lg font-bold transition-colors"
                                        >
                                            Xem Đơn Giữ Hàng Khác
                                        </Link>
                                    </>
                                )}
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
