"use client";

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
            <div className="min-h-screen bg-gray-50 py-12 px-4 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Đang tải...</p>
                </div>
            </div>
        );
    }

    if (error || !reservation) {
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4">
                <div className="max-w-2xl mx-auto text-center bg-white rounded-lg shadow p-8">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">
                        Lỗi
                    </h1>
                    <p className="text-gray-600 mb-6">
                        {error || "Không tìm thấy đơn giữ hàng"}
                    </p>
                    <button
                        onClick={() => router.push("/products")}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Quay lại mua sắm
                    </button>
                </div>
            </div>
        );
    }

    const totalAmount = reservation.items.reduce(
        (sum, item) => sum + item.price_snapshot * item.quantity,
        0
    );

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">
                    Thanh toán đơn giữ hàng
                </h1>

                {reservationExpired && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-700 font-medium">
                            ⚠️ Đơn giữ hàng đã hết hạn. Hàng sẽ được trả lại
                            kho.
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Payment Details */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow p-6 mb-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">
                                Chi tiết đơn hàng
                            </h2>

                            <div className="space-y-4 mb-6 pb-6 border-b">
                                {reservation.items.map((item, index) => (
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
                                        <span>Mã đơn giữ hàng:</span>
                                        <span className="font-mono">
                                            {reservation.id}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Trạng thái:</span>
                                        <span
                                            className={`font-medium ${
                                                reservation.status === "ACTIVE"
                                                    ? "text-green-600"
                                                    : "text-red-600"
                                            }`}
                                        >
                                            {reservation.status === "ACTIVE"
                                                ? "Đang chờ"
                                                : reservation.status}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Thời gian tạo:</span>
                                        <span>
                                            {new Date(
                                                reservation.created_at
                                            ).toLocaleString("vi-VN")}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow p-6 sticky top-6">
                            {/* Timer */}
                            <div className="mb-6">
                                <ReservationTimer
                                    expiresAt={reservation.expires_at}
                                    onExpired={handleReservationExpired}
                                />
                            </div>

                            {/* Total */}
                            <div className="mb-6 pb-6 border-b">
                                <div className="flex justify-between mb-4">
                                    <span className="text-gray-600">
                                        Tạm tính:
                                    </span>
                                    <span className="font-semibold text-gray-900">
                                        {totalAmount.toLocaleString("vi-VN")}đ
                                    </span>
                                </div>
                                <div className="flex justify-between text-lg font-bold">
                                    <span>Tổng cộng:</span>
                                    <span className="text-blue-600">
                                        {totalAmount.toLocaleString("vi-VN")}đ
                                    </span>
                                </div>
                            </div>

                            {/* Payment Button */}
                            <button
                                onClick={handlePayment}
                                disabled={
                                    isPaymentLoading || reservationExpired
                                }
                                className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition ${
                                    isPaymentLoading || reservationExpired
                                        ? "bg-gray-400 cursor-not-allowed"
                                        : "bg-green-600 hover:bg-green-700"
                                }`}
                            >
                                {isPaymentLoading
                                    ? "Đang xử lý..."
                                    : "Hoàn tất thanh toán"}
                            </button>

                            <p className="mt-4 text-xs text-gray-500 text-center">
                                {reservationExpired
                                    ? "Đơn giữ hàng đã hết hạn"
                                    : "Nhấn nút trên để hoàn tất thanh toán"}
                            </p>

                            <button
                                onClick={() => router.push("/cart")}
                                className="w-full mt-3 py-2 px-4 border border-gray-300 rounded-lg font-medium text-gray-900 hover:bg-gray-50 transition"
                            >
                                Quay lại giỏ hàng
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
