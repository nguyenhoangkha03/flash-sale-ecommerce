"use client";

import { useEffect, useState, useCallback } from "react";
import { useSocket } from "@/hooks/useSocket";
import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";
import { formatVND } from "@/lib/currency";

interface DashboardStats {
  orders: {
    total: number;
    pending: number;
    paid: number;
    expired: number;
    revenue: number;
  };
  reservations: {
    total: number;
    active: number;
    expired: number;
  };
  products: {
    total: number;
    availableStock: number;
    reservedStock: number;
    soldStock: number;
  };
  auditLogs: {
    total: number;
    lastHourCount: number;
  };
}

interface RecentOrder {
  id: string;
  user?: { email: string };
  status: string;
  total_amount: number;
  created_at: string;
}

interface RecentReservation {
  id: string;
  user?: { email: string };
  status: string;
  expires_at: string;
  items?: Array<{ id: string }>;
}

export default function AdminDashboard() {
  const { on, off, isConnected } = useSocket();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    orders: { total: 0, pending: 0, paid: 0, expired: 0, revenue: 0 },
    reservations: { total: 0, active: 0, expired: 0 },
    products: { total: 0, availableStock: 0, reservedStock: 0, soldStock: 0 },
    auditLogs: { total: 0, lastHourCount: 0 },
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [recentReservations, setRecentReservations] = useState<RecentReservation[]>([]);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Fetch all data in parallel
      const [ordersRes, reservationsRes, productsRes, logsRes] = await Promise.all([
        axiosInstance.get("/admin/orders"),
        axiosInstance.get("/admin/reservations"),
        axiosInstance.get("/admin/products"),
        axiosInstance.get("/admin/audit-logs"),
      ]);

      const orders = ordersRes.data;
      const reservations = reservationsRes.data;
      const products = productsRes.data;
      const logs = logsRes.data;

      // Calculate stats
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const lastHourLogs = logs.filter(
        (log: any) => new Date(log.created_at) > oneHourAgo
      );

      const paidOrders = orders.filter((o: any) => o.status === "PAID");
      const totalRevenue = paidOrders.reduce(
        (sum: number, o: any) => sum + (Number(o.total_amount) || 0),
        0
      );

      const activeReservations = reservations.filter(
        (r: any) => r.status === "ACTIVE"
      );
      const expiredReservations = reservations.filter(
        (r: any) => r.status === "EXPIRED"
      );

      const totalAvailable = products.reduce(
        (sum: number, p: any) => sum + p.available_stock,
        0
      );
      const totalReserved = products.reduce(
        (sum: number, p: any) => sum + p.reserved_stock,
        0
      );
      const totalSold = products.reduce(
        (sum: number, p: any) => sum + p.sold_stock,
        0
      );

      setStats({
        orders: {
          total: orders.length,
          pending: orders.filter((o: any) => o.status === "PENDING_PAYMENT")
            .length,
          paid: paidOrders.length,
          expired: orders.filter((o: any) => o.status === "EXPIRED").length,
          revenue: totalRevenue,
        },
        reservations: {
          total: reservations.length,
          active: activeReservations.length,
          expired: expiredReservations.length,
        },
        products: {
          total: products.length,
          availableStock: totalAvailable,
          reservedStock: totalReserved,
          soldStock: totalSold,
        },
        auditLogs: {
          total: logs.length,
          lastHourCount: lastHourLogs.length,
        },
      });

      // Set recent items
      setRecentOrders(orders.slice(0, 5));
      setRecentReservations(reservations.slice(0, 5));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Lỗi tải dữ liệu dashboard");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Subscribe to realtime updates
  useEffect(() => {
    const handleOrderCreated = () => {
      setStats((prev) => ({
        ...prev,
        orders: { ...prev.orders, total: prev.orders.total + 1 },
      }));
    };

    const handleOrderPaid = ({ totalAmount }: { totalAmount?: number }) => {
      setStats((prev) => ({
        ...prev,
        orders: {
          ...prev.orders,
          paid: prev.orders.paid + 1,
          pending: Math.max(0, prev.orders.pending - 1),
          revenue: prev.orders.revenue + (totalAmount || 0),
        },
      }));
    };

    const handleReservationCreated = () => {
      setStats((prev) => ({
        ...prev,
        reservations: {
          ...prev.reservations,
          total: prev.reservations.total + 1,
          active: prev.reservations.active + 1,
        },
      }));
    };

    const handleReservationExpired = () => {
      setStats((prev) => ({
        ...prev,
        reservations: {
          ...prev.reservations,
          active: Math.max(0, prev.reservations.active - 1),
          expired: prev.reservations.expired + 1,
        },
      }));
    };

    const handleStockChanged = (data: any) => {
      setStats((prev) => ({
        ...prev,
        products: {
          ...prev.products,
          availableStock:
            prev.products.availableStock -
            (prev.products.availableStock - data.availableStock),
          reservedStock:
            prev.products.reservedStock -
            (prev.products.reservedStock - data.reservedStock),
          soldStock:
            prev.products.soldStock - (prev.products.soldStock - data.soldStock),
        },
      }));
    };

    on("order:created", handleOrderCreated);
    on("order:paid", handleOrderPaid);
    on("reservation:created", handleReservationCreated);
    on("reservation:expired", handleReservationExpired);
    on("stock:changed", handleStockChanged);

    return () => {
      off("order:created", handleOrderCreated);
      off("order:paid", handleOrderPaid);
      off("reservation:created", handleReservationCreated);
      off("reservation:expired", handleReservationExpired);
      off("stock:changed", handleStockChanged);
    };
  }, [on, off]);

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING_PAYMENT":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            <span className="w-1 h-1 rounded-full bg-primary"></span>
            Chờ thanh toán
          </span>
        );
      case "PAID":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-500 border border-green-500/20">
            <span className="w-1 h-1 rounded-full bg-green-500"></span>
            Đã thanh toán
          </span>
        );
      case "EXPIRED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-500 border border-red-500/20">
            <span className="w-1 h-1 rounded-full bg-red-500"></span>
            Hết hạn
          </span>
        );
      default:
        return (
          <span className="text-xs text-text-secondary">{status}</span>
        );
    }
  };

  const getReservationStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-500 border border-green-500/20">
            <span className="w-1 h-1 rounded-full bg-green-500"></span>
            Đang hoạt động
          </span>
        );
      case "EXPIRED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-500 border border-red-500/20">
            <span className="w-1 h-1 rounded-full bg-red-500"></span>
            Hết hạn
          </span>
        );
      default:
        return (
          <span className="text-xs text-text-secondary">{status}</span>
        );
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

  if (isLoading) {
    return (
      <>
        <header className="flex-shrink-0 px-8 py-6 border-b border-border-dark/50 flex justify-between items-start bg-background-dark/50 backdrop-blur-sm z-10">
          <div className="flex flex-col gap-1">
            <h2 className="text-3xl font-black tracking-tight text-white">
              Dashboard
            </h2>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-text-secondary">Đang tải dashboard...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Header */}
      <header className="flex-shrink-0 px-8 py-6 border-b border-border-dark/50 flex justify-between items-start bg-background-dark/50 backdrop-blur-sm z-10">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-black tracking-tight text-white">
            Dashboard
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
      </header>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="px-8 py-6 flex flex-col gap-8 max-w-[1600px] mx-auto">
          {/* Key Metrics */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white">Chỉ số chính</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Orders Card */}
              <div className="flex flex-col gap-3 p-6 rounded-xl border border-border-dark bg-surface-dark relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className="material-symbols-outlined text-6xl text-primary">
                    shopping_bag
                  </span>
                </div>
                <div>
                  <p className="text-text-secondary text-sm font-medium">
                    Đơn hàng
                  </p>
                  <p className="text-white text-3xl font-bold tracking-tight mt-1">
                    {stats.orders.total}
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap text-xs">
                  <div className="px-2 py-1 rounded bg-primary/10 text-primary">
                    {stats.orders.paid} Đã thanh toán
                  </div>
                  <div className="px-2 py-1 rounded bg-yellow-500/10 text-yellow-400">
                    {stats.orders.pending} Chờ
                  </div>
                </div>
              </div>

              {/* Revenue Card */}
              <div className="flex flex-col gap-3 p-6 rounded-xl border border-border-dark bg-surface-dark relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className="material-symbols-outlined text-6xl text-green-400">
                    payments
                  </span>
                </div>
                <div>
                  <p className="text-text-secondary text-sm font-medium">
                    Doanh thu (Đã thanh toán)
                  </p>
                  <p className="text-white text-3xl font-bold tracking-tight mt-1">
                    {formatVND(stats.orders.revenue)}
                  </p>
                </div>
                <div className="text-xs text-green-500">
                  ↑ {stats.orders.paid} giao dịch
                </div>
              </div>

              {/* Reservations Card */}
              <div className="flex flex-col gap-3 p-6 rounded-xl border border-border-dark bg-surface-dark relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className="material-symbols-outlined text-6xl text-blue-400">
                    schedule
                  </span>
                </div>
                <div>
                  <p className="text-text-secondary text-sm font-medium">
                    Giữ hàng (Hoạt động)
                  </p>
                  <p className="text-white text-3xl font-bold tracking-tight mt-1">
                    {stats.reservations.active}
                  </p>
                </div>
                <div className="text-xs text-blue-500">
                  Tổng {stats.reservations.total}
                </div>
              </div>

              {/* Inventory Card */}
              <div className="flex flex-col gap-3 p-6 rounded-xl border border-border-dark bg-surface-dark relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <span className="material-symbols-outlined text-6xl text-orange-400">
                    inventory_2
                  </span>
                </div>
                <div>
                  <p className="text-text-secondary text-sm font-medium">
                    Tồn kho sẵn
                  </p>
                  <p className="text-white text-3xl font-bold tracking-tight mt-1">
                    {stats.products.availableStock}
                  </p>
                </div>
                <div className="text-xs text-orange-500">
                  Đang giữ: {stats.products.reservedStock}
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Orders Summary */}
            <div className="rounded-xl border border-border-dark bg-surface-dark p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">Thống kê Đơn hàng</h3>
                <Link
                  href="/admin/orders"
                  className="text-primary hover:text-primary-dark text-sm font-medium"
                >
                  Xem tất cả →
                </Link>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-background-dark/50">
                  <span className="text-text-secondary">Tổng đơn</span>
                  <span className="text-white font-bold">{stats.orders.total}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-background-dark/50">
                  <span className="text-green-400 font-medium">Đã thanh toán</span>
                  <span className="text-white font-bold">{stats.orders.paid}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-background-dark/50">
                  <span className="text-primary font-medium">Chờ thanh toán</span>
                  <span className="text-white font-bold">{stats.orders.pending}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-background-dark/50">
                  <span className="text-red-400 font-medium">Hết hạn</span>
                  <span className="text-white font-bold">{stats.orders.expired}</span>
                </div>
              </div>
            </div>

            {/* Inventory Summary */}
            <div className="rounded-xl border border-border-dark bg-surface-dark p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">Thống kê Tồn kho</h3>
                <Link
                  href="/admin/products"
                  className="text-primary hover:text-primary-dark text-sm font-medium"
                >
                  Xem tất cả →
                </Link>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-background-dark/50">
                  <span className="text-text-secondary">Tổng sản phẩm</span>
                  <span className="text-white font-bold">{stats.products.total}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-background-dark/50">
                  <span className="text-green-400 font-medium">Sẵn có</span>
                  <span className="text-white font-bold">{stats.products.availableStock}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-background-dark/50">
                  <span className="text-yellow-400 font-medium">Đang giữ</span>
                  <span className="text-white font-bold">{stats.products.reservedStock}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-background-dark/50">
                  <span className="text-blue-400 font-medium">Đã bán</span>
                  <span className="text-white font-bold">{stats.products.soldStock}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Orders */}
            <div className="rounded-xl border border-border-dark bg-surface-dark overflow-hidden">
              <div className="p-6 border-b border-border-dark/50 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Đơn hàng gần đây</h3>
                <Link
                  href="/admin/orders"
                  className="text-primary hover:text-primary-dark text-sm font-medium"
                >
                  Xem tất cả →
                </Link>
              </div>
              <div className="divide-y divide-border-dark/50">
                {recentOrders.length === 0 ? (
                  <div className="p-6 text-center text-text-secondary">
                    Chưa có đơn hàng
                  </div>
                ) : (
                  recentOrders.map((order, index) => (
                    <div
                      key={order.id}
                      className="p-4 hover:bg-background-dark/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${getAvatarColor(
                              index
                            )}`}
                          >
                            {getInitials(order.user?.email)}
                          </div>
                          <span className="text-sm text-white truncate">
                            {order.user?.email || "N/A"}
                          </span>
                        </div>
                        {getOrderStatusBadge(order.status)}
                      </div>
                      <div className="flex items-center justify-between text-xs text-text-secondary">
                        <span className="font-mono">
                          #{order.id.substring(0, 8)}
                        </span>
                        <span>{formatVND(order.total_amount)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Reservations */}
            <div className="rounded-xl border border-border-dark bg-surface-dark overflow-hidden">
              <div className="p-6 border-b border-border-dark/50 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Giữ hàng gần đây</h3>
                <Link
                  href="/admin/reservations"
                  className="text-primary hover:text-primary-dark text-sm font-medium"
                >
                  Xem tất cả →
                </Link>
              </div>
              <div className="divide-y divide-border-dark/50">
                {recentReservations.length === 0 ? (
                  <div className="p-6 text-center text-text-secondary">
                    Chưa có giữ hàng
                  </div>
                ) : (
                  recentReservations.map((reservation, index) => (
                    <div
                      key={reservation.id}
                      className="p-4 hover:bg-background-dark/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${getAvatarColor(
                              index
                            )}`}
                          >
                            {getInitials(reservation.user?.email)}
                          </div>
                          <span className="text-sm text-white truncate">
                            {reservation.user?.email || "N/A"}
                          </span>
                        </div>
                        {getReservationStatusBadge(reservation.status)}
                      </div>
                      <div className="flex items-center justify-between text-xs text-text-secondary">
                        <span className="font-mono">
                          #{reservation.id.substring(0, 8)} •{" "}
                          {reservation.items?.length || 0} items
                        </span>
                        <span>
                          {new Date(
                            reservation.expires_at
                          ).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Quick Info */}
          <div className="rounded-xl border border-border-dark bg-surface-dark p-6">
            <h3 className="text-lg font-bold text-white mb-4">Thông tin nhanh</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-background-dark/50">
                <p className="text-text-secondary text-xs mb-1">Nhật ký hệ thống</p>
                <p className="text-white text-2xl font-bold">
                  {stats.auditLogs.total}
                </p>
                <p className="text-blue-500 text-xs mt-1">
                  {stats.auditLogs.lastHourCount} trong 1 giờ qua
                </p>
              </div>
              <div className="p-4 rounded-lg bg-background-dark/50">
                <p className="text-text-secondary text-xs mb-1">Tỷ lệ hoàn thành</p>
                <p className="text-white text-2xl font-bold">
                  {stats.orders.total > 0
                    ? Math.round(
                        (stats.orders.paid / stats.orders.total) * 100
                      )
                    : 0}
                  %
                </p>
                <p className="text-green-500 text-xs mt-1">
                  {stats.orders.paid} / {stats.orders.total} đơn
                </p>
              </div>
              <div className="p-4 rounded-lg bg-background-dark/50">
                <p className="text-text-secondary text-xs mb-1">Lạc quan kho</p>
                <p className="text-white text-2xl font-bold">
                  {stats.products.total > 0
                    ? Math.round(
                        (stats.products.availableStock /
                          (stats.products.availableStock +
                            stats.products.reservedStock +
                            stats.products.soldStock)) *
                          100
                      )
                    : 0}
                  %
                </p>
                <p className="text-yellow-500 text-xs mt-1">
                  Sẵn có / Tổng
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
