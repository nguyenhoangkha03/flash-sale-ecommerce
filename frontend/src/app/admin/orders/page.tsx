"use client";

import { useEffect, useState, useCallback } from "react";
import { useSocket } from "@/hooks/useSocket";
import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";
import { formatVND } from "@/lib/currency";

interface Order {
    id: string;
    user_id: string;
    total_amount: number;
    status: string;
    created_at: string;
    user?: {
        email: string;
    };
}

export default function AdminOrdersPage() {
    const { on, off, isConnected } = useSocket();
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [stats, setStats] = useState({
        totalToday: 0,
        revenue: 0,
        stockLevel: 0,
    });

    // Fetch orders
    const fetchOrders = useCallback(async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams();
            if (filterStatus) params.append("status", filterStatus);
            if (searchQuery) params.append("search", searchQuery);

            const response = await axiosInstance.get(
                `/admin/orders?${params.toString()}`
            );
            setOrders(response.data);

            // Calculate stats
            const total = response.data.length;
            const revenue = response.data
                .filter((o: Order) => o.status === "PAID")
                .reduce(
                    (sum: number, o: Order) =>
                        sum + (Number(o.total_amount) || 0),
                    0
                );

            setStats({
                totalToday: total,
                revenue,
                stockLevel: 45,
            });
        } catch (error) {
            console.error("Error fetching orders:", error);
            toast.error("Lỗi tải danh sách đơn hàng");
        } finally {
            setIsLoading(false);
        }
    }, [filterStatus, searchQuery]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // Subscribe to realtime updates
    useEffect(() => {
        const handleOrderCreated = (order: Order) => {
            setOrders((prev) => [order, ...prev]);
            setStats((prev) => ({ ...prev, totalToday: prev.totalToday + 1 }));
            toast.success("✨ Có đơn hàng mới");
        };

        const handleOrderPaid = ({
            orderId,
            totalAmount,
        }: {
            orderId: string;
            totalAmount?: number;
        }) => {
            setOrders((prev) =>
                prev.map((o) =>
                    o.id === orderId ? { ...o, status: "PAID" } : o
                )
            );
            if (totalAmount) {
                setStats((prev) => ({
                    ...prev,
                    revenue: prev.revenue + totalAmount,
                }));
            }
            toast.success("💳 Đã thanh toán");
        };

        const handleOrderExpired = ({ orderId }: { orderId: string }) => {
            setOrders((prev) =>
                prev.map((o) =>
                    o.id === orderId ? { ...o, status: "EXPIRED" } : o
                )
            );
        };

        on("order:created", handleOrderCreated);
        on("order:paid", handleOrderPaid);
        on("order:expired", handleOrderExpired);

        return () => {
            off("order:created", handleOrderCreated);
            off("order:paid", handleOrderPaid);
            off("order:expired", handleOrderExpired);
        };
    }, [on, off]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "PENDING_PAYMENT":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                        Chờ thanh toán
                    </span>
                );
            case "PAID":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-500 border border-green-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        Đã thanh toán
                    </span>
                );
            case "EXPIRED":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-500 border border-red-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                        Hết hạn
                    </span>
                );
            case "CANCELLED":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-500/10 text-gray-400 border border-gray-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
                        Đã hủy
                    </span>
                );
            default:
                return <span className="text-xs">{status}</span>;
        }
    };

    const getInitials = (email?: string) => {
        if (!email) return "?";
        return email
            .split("@")[0]
            .split(".")
            .map((part) => part[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const getAvatarColor = (index: number) => {
        const colors = [
            "bg-indigo-500/20 text-indigo-400",
            "bg-emerald-500/20 text-emerald-400",
            "bg-pink-500/20 text-pink-400",
            "bg-blue-500/20 text-blue-400",
        ];
        return colors[index % colors.length];
    };

    return (
        <>
            {/* Header */}
            <header className="flex-shrink-0 px-8 py-6 border-b border-border-dark/50 flex justify-between items-start bg-background-dark/50 backdrop-blur-sm z-10">
                <div className="flex flex-col gap-1">
                    <h2 className="text-3xl font-black tracking-tight text-white">
                        Quản lý Đơn hàng
                    </h2>
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2.5 w-2.5">
                            <span
                                className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                                    isConnected ? "bg-green-400" : "bg-red-400"
                                } opacity-75`}
                            ></span>
                            <span
                                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                                    isConnected ? "bg-green-500" : "bg-red-500"
                                }`}
                            ></span>
                        </span>
                        <p className="text-text-secondary text-sm font-medium">
                            {isConnected
                                ? "WebSocket Kết nối • Chế độ lưu lượng cao"
                                : "Đang kết nối..."}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border-dark hover:bg-surface-dark text-text-secondary hover:text-white transition-colors text-sm font-medium">
                        <span className="material-symbols-outlined text-[20px]">
                            cloud_download
                        </span>
                        Xuất CSV
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/20 transition-all text-sm font-medium">
                        <span className="material-symbols-outlined text-[20px]">
                            add
                        </span>
                        Đơn hàng thủ công
                    </button>
                </div>
            </header>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="px-8 py-6 flex flex-col gap-6 max-w-[1400px] mx-auto">
                    {/* Stats Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1 p-5 rounded-xl border border-border-dark bg-surface-dark relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span className="material-symbols-outlined text-6xl text-white">
                                    shopping_cart
                                </span>
                            </div>
                            <p className="text-text-secondary text-sm font-medium">
                                Tổng đơn hàng (Hôm nay)
                            </p>
                            <div className="flex items-end gap-2">
                                <p className="text-white text-3xl font-bold tracking-tight">
                                    {stats.totalToday}
                                </p>
                                <span className="text-green-500 text-sm font-medium mb-1 flex items-center">
                                    <span className="material-symbols-outlined text-[16px]">
                                        trending_up
                                    </span>
                                    12%
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 p-5 rounded-xl border border-border-dark bg-surface-dark relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span className="material-symbols-outlined text-6xl text-primary">
                                    payments
                                </span>
                            </div>
                            <p className="text-text-secondary text-sm font-medium">
                                Doanh thu (Live)
                            </p>
                            <div className="flex items-end gap-2">
                                <p className="text-white text-3xl font-bold tracking-tight">
                                    {formatVND(stats.revenue)}
                                </p>
                                <span className="text-green-500 text-sm font-medium mb-1 flex items-center">
                                    <span className="material-symbols-outlined text-[16px]">
                                        trending_up
                                    </span>
                                    15%
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 p-5 rounded-xl border border-border-dark bg-surface-dark relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span className="material-symbols-outlined text-6xl text-red-400">
                                    inventory
                                </span>
                            </div>
                            <p className="text-text-secondary text-sm font-medium">
                                Mức kho toàn cầu
                            </p>
                            <div className="flex items-end gap-2">
                                <p className="text-white text-3xl font-bold tracking-tight">
                                    {stats.stockLevel}%
                                </p>
                                <span className="text-red-500 text-sm font-medium mb-1 flex items-center">
                                    <span className="material-symbols-outlined text-[16px]">
                                        trending_down
                                    </span>
                                    Giảm nhanh
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Filters & Search */}
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 py-2">
                        <div className="relative w-full max-w-md">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-text-secondary pointer-events-none">
                                <span className="material-symbols-outlined">
                                    search
                                </span>
                            </span>
                            <input
                                className="w-full pl-10 pr-4 py-2.5 bg-surface-dark border border-border-dark rounded-lg text-white placeholder-text-secondary focus:ring-1 focus:ring-primary focus:border-primary text-sm transition-colors"
                                placeholder="Tìm theo mã, email hoặc sản phẩm..."
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 w-full lg:w-auto">
                            <button
                                onClick={() => setFilterStatus("")}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap transition-colors ${
                                    filterStatus === ""
                                        ? "bg-surface-dark-highlight border-border-dark text-white"
                                        : "bg-surface-dark border-border-dark text-text-secondary hover:text-white hover:border-primary/50"
                                }`}
                            >
                                Tất cả trạng thái
                            </button>
                            <button
                                onClick={() =>
                                    setFilterStatus("PENDING_PAYMENT")
                                }
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap transition-colors ${
                                    filterStatus === "PENDING_PAYMENT"
                                        ? "bg-surface-dark-highlight border-border-dark text-white"
                                        : "bg-surface-dark border-border-dark text-text-secondary hover:text-white hover:border-primary/50"
                                }`}
                            >
                                <span className="w-2 h-2 rounded-full bg-primary"></span>
                                Chờ thanh toán
                            </button>
                            <button
                                onClick={() => setFilterStatus("PAID")}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap transition-colors ${
                                    filterStatus === "PAID"
                                        ? "bg-surface-dark-highlight border-border-dark text-white"
                                        : "bg-surface-dark border-border-dark text-text-secondary hover:text-white hover:border-green-500/50"
                                }`}
                            >
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                Đã thanh toán
                            </button>
                            <button
                                onClick={() => setFilterStatus("EXPIRED")}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap transition-colors ${
                                    filterStatus === "EXPIRED"
                                        ? "bg-surface-dark-highlight border-border-dark text-white"
                                        : "bg-surface-dark border-border-dark text-text-secondary hover:text-white hover:border-red-500/50"
                                }`}
                            >
                                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                Hết hạn
                            </button>
                            <button
                                onClick={() => setFilterStatus("CANCELLED")}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap transition-colors ${
                                    filterStatus === "CANCELLED"
                                        ? "bg-surface-dark-highlight border-border-dark text-white"
                                        : "bg-surface-dark border-border-dark text-text-secondary hover:text-white hover:border-gray-500/50"
                                }`}
                            >
                                <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                                Đã hủy
                            </button>
                        </div>
                    </div>

                    {/* Data Table */}
                    <div className="rounded-xl border border-border-dark overflow-hidden bg-surface-dark/50">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-border-dark bg-surface-dark text-xs uppercase tracking-wider text-text-secondary">
                                        <th className="px-6 py-4 font-semibold">
                                            Mã đơn
                                        </th>
                                        <th className="px-6 py-4 font-semibold">
                                            Người dùng
                                        </th>
                                        <th className="px-6 py-4 font-semibold">
                                            Sản phẩm
                                        </th>
                                        <th className="px-6 py-4 font-semibold">
                                            Tổng cộng
                                        </th>
                                        <th className="px-6 py-4 font-semibold">
                                            Trạng thái
                                        </th>
                                        <th className="px-6 py-4 font-semibold text-right">
                                            Thời gian tạo
                                        </th>
                                        <th className="px-6 py-4 font-semibold text-center">
                                            Hành động
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm divide-y divide-border-dark">
                                    {isLoading ? (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="px-6 py-8 text-center"
                                            >
                                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                                <p className="mt-4 text-text-secondary">
                                                    Đang tải...
                                                </p>
                                            </td>
                                        </tr>
                                    ) : orders.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="px-6 py-8 text-center text-text-secondary"
                                            >
                                                Không có đơn hàng nào
                                            </td>
                                        </tr>
                                    ) : (
                                        orders.map((order, index) => (
                                            <tr
                                                key={order.id}
                                                className={`group hover:bg-surface-dark transition-colors ${
                                                    order.status ===
                                                    "PENDING_PAYMENT"
                                                        ? "animate-[pulse_2s_ease-in-out]"
                                                        : ""
                                                }`}
                                            >
                                                <td className="px-6 py-4 font-mono text-white font-medium">
                                                    #
                                                    {order.id
                                                        .substring(0, 8)
                                                        .toUpperCase()}
                                                </td>
                                                <td className="px-6 py-4 text-white">
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${getAvatarColor(
                                                                index
                                                            )}`}
                                                        >
                                                            {getInitials(
                                                                order.user
                                                                    ?.email
                                                            )}
                                                        </div>
                                                        <span>
                                                            {order.user
                                                                ?.email ||
                                                                "N/A"}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-text-secondary">
                                                    Sản phẩm (x1)
                                                </td>
                                                <td className="px-6 py-4 font-mono text-white">
                                                    {formatVND(
                                                        order.total_amount
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {getStatusBadge(
                                                        order.status
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right text-text-secondary font-mono">
                                                    {new Date(
                                                        order.created_at
                                                    ).toLocaleTimeString(
                                                        "vi-VN"
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <Link
                                                        href={`/admin/orders/${order.id}`}
                                                        className="text-text-secondary hover:text-white transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-[20px]">
                                                            more_horiz
                                                        </span>
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination */}
                        {!isLoading && orders.length > 0 && (
                            <div className="flex items-center justify-between px-6 py-4 border-t border-border-dark bg-surface-dark">
                                <span className="text-sm text-text-secondary">
                                    Hiển thị
                                    <span className="text-white font-medium">
                                        {" "}
                                        1-{orders.length}
                                    </span>
                                    của
                                    <span className="text-white font-medium">
                                        {" "}
                                        {orders.length}
                                    </span>
                                    đơn hàng
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
