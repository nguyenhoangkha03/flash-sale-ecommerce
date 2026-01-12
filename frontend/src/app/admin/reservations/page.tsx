"use client";

import { useEffect, useState, useCallback } from "react";
import { useSocket } from "@/hooks/useSocket";
import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";
import Link from "next/link";

interface Reservation {
  id: string;
  user_id: string;
  status: string;
  expires_at: string;
  created_at: string;
  items?: Array<{ id: string }>;
  user?: {
    email: string;
  };
}

export default function AdminReservationsPage() {
  const { on, off, isConnected } = useSocket();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({
    totalActive: 0,
    totalExpired: 0,
    totalItems: 0,
  });

  // Fetch reservations
  const fetchReservations = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filterStatus) params.append("status", filterStatus);
      if (searchQuery) params.append("search", searchQuery);

      const response = await axiosInstance.get(
        `/admin/reservations?${params.toString()}`
      );
      setReservations(response.data);

      // Calculate stats
      const activeCount = response.data.filter((r: Reservation) => r.status === "ACTIVE").length;
      const expiredCount = response.data.filter((r: Reservation) => r.status === "EXPIRED").length;
      const totalItems = response.data.reduce((sum: number, r: Reservation) => sum + (r.items?.length || 0), 0);

      setStats({
        totalActive: activeCount,
        totalExpired: expiredCount,
        totalItems,
      });
    } catch (error) {
      console.error("Error fetching reservations:", error);
      toast.error("Lỗi tải danh sách giữ hàng");
    } finally {
      setIsLoading(false);
    }
  }, [filterStatus, searchQuery]);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  // Subscribe to realtime updates
  useEffect(() => {
    const handleReservationCreated = (reservation: Reservation) => {
      setReservations((prev) => [reservation, ...prev]);
      setStats((prev) => ({
        ...prev,
        totalActive: prev.totalActive + 1,
        totalItems: prev.totalItems + (reservation.items?.length || 0),
      }));
      toast.success("✨ Có đơn giữ hàng mới");
    };

    const handleReservationExpired = ({ reservationId }: { reservationId: string }) => {
      setReservations((prev) =>
        prev.map((r) => {
          if (r.id === reservationId) {
            setStats((prevStats) => ({
              ...prevStats,
              totalActive: Math.max(0, prevStats.totalActive - 1),
              totalExpired: prevStats.totalExpired + 1,
            }));
            return { ...r, status: "EXPIRED" };
          }
          return r;
        })
      );
    };

    on("reservation:created", handleReservationCreated);
    on("reservation:expired", handleReservationExpired);

    return () => {
      off("reservation:created", handleReservationCreated);
      off("reservation:expired", handleReservationExpired);
    };
  }, [on, off]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-500 border border-green-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
            Đang hoạt động
          </span>
        );
      case "EXPIRED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-500 border border-red-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            Hết hạn
          </span>
        );
      case "CONVERTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Đã chuyển
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

  const handleExpireNow = async (reservationId: string) => {
    try {
      await axiosInstance.post(`/reservations/${reservationId}/expire`);
      setReservations((prev) =>
        prev.map((r) => {
          if (r.id === reservationId) {
            setStats((prevStats) => ({
              ...prevStats,
              totalActive: Math.max(0, prevStats.totalActive - 1),
              totalExpired: prevStats.totalExpired + 1,
            }));
            return { ...r, status: "EXPIRED" };
          }
          return r;
        })
      );
      toast.success("Đã hết hạn giữ hàng");
    } catch (error) {
      toast.error("Lỗi hết hạn giữ hàng");
    }
  };

  return (
    <>
      {/* Header */}
      <header className="flex-shrink-0 px-8 py-6 border-b border-border-dark/50 flex justify-between items-start bg-background-dark/50 backdrop-blur-sm z-10">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-black tracking-tight text-white">
            Quản lý Giữ hàng
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
        <div className="px-8 py-6 flex flex-col gap-6 max-w-[1400px] mx-auto">
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1 p-5 rounded-xl border border-border-dark bg-surface-dark relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-6xl text-green-400">
                  check_circle
                </span>
              </div>
              <p className="text-text-secondary text-sm font-medium">
                Đang hoạt động
              </p>
              <div className="flex items-end gap-2">
                <p className="text-white text-3xl font-bold tracking-tight">
                  {stats.totalActive}
                </p>
                <span className="text-green-500 text-sm font-medium mb-1 flex items-center">
                  <span className="material-symbols-outlined text-[16px]">
                    trending_up
                  </span>
                  Mới
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1 p-5 rounded-xl border border-border-dark bg-surface-dark relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-6xl text-red-400">
                  schedule
                </span>
              </div>
              <p className="text-text-secondary text-sm font-medium">
                Hết hạn
              </p>
              <div className="flex items-end gap-2">
                <p className="text-white text-3xl font-bold tracking-tight">
                  {stats.totalExpired}
                </p>
                <span className="text-red-500 text-sm font-medium mb-1 flex items-center">
                  <span className="material-symbols-outlined text-[16px]">
                    trending_down
                  </span>
                  Expired
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1 p-5 rounded-xl border border-border-dark bg-surface-dark relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-6xl text-blue-400">
                  shopping_basket
                </span>
              </div>
              <p className="text-text-secondary text-sm font-medium">
                Tổng mặt hàng
              </p>
              <div className="flex items-end gap-2">
                <p className="text-white text-3xl font-bold tracking-tight">
                  {stats.totalItems}
                </p>
                <span className="text-blue-500 text-sm font-medium mb-1 flex items-center">
                  <span className="material-symbols-outlined text-[16px]">
                    info
                  </span>
                  Items
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
                placeholder="Tìm theo mã, email..."
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
                onClick={() => setFilterStatus("ACTIVE")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap transition-colors ${
                  filterStatus === "ACTIVE"
                    ? "bg-surface-dark-highlight border-border-dark text-white"
                    : "bg-surface-dark border-border-dark text-text-secondary hover:text-white hover:border-green-500/50"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Đang hoạt động
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
                onClick={() => setFilterStatus("CONVERTED")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium whitespace-nowrap transition-colors ${
                  filterStatus === "CONVERTED"
                    ? "bg-surface-dark-highlight border-border-dark text-white"
                    : "bg-surface-dark border-border-dark text-text-secondary hover:text-white hover:border-blue-500/50"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Đã chuyển
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
                      Mã giữ hàng
                    </th>
                    <th className="px-6 py-4 font-semibold">
                      Người dùng
                    </th>
                    <th className="px-6 py-4 font-semibold">
                      Số items
                    </th>
                    <th className="px-6 py-4 font-semibold">
                      Trạng thái
                    </th>
                    <th className="px-6 py-4 font-semibold text-right">
                      Hết hạn lúc
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
                        colSpan={6}
                        className="px-6 py-8 text-center"
                      >
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <p className="mt-4 text-text-secondary">
                          Đang tải...
                        </p>
                      </td>
                    </tr>
                  ) : reservations.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-8 text-center text-text-secondary"
                      >
                        Không có đơn giữ hàng nào
                      </td>
                    </tr>
                  ) : (
                    reservations.map((res, index) => (
                      <tr
                        key={res.id}
                        className={`group hover:bg-surface-dark transition-colors ${
                          res.status === "ACTIVE"
                            ? "animate-[pulse_2s_ease-in-out]"
                            : ""
                        }`}
                      >
                        <td className="px-6 py-4 font-mono text-white font-medium">
                          #
                          {res.id
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
                                res.user
                                  ?.email
                              )}
                            </div>
                            <span>
                              {res.user
                                ?.email ||
                                "N/A"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-white font-medium">
                          {res.items?.length || 0}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(
                            res.status
                          )}
                        </td>
                        <td className="px-6 py-4 text-right text-text-secondary font-mono">
                          {new Date(
                            res.expires_at
                          ).toLocaleTimeString(
                            "vi-VN"
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {res.status === "ACTIVE" && (
                            <button
                              onClick={() => handleExpireNow(res.id)}
                              className="text-red-500 hover:text-red-400 transition-colors text-sm font-medium"
                            >
                              <span className="material-symbols-outlined text-[20px]">
                                schedule
                              </span>
                            </button>
                          )}
                          {res.status !== "ACTIVE" && (
                            <span className="text-text-secondary text-sm">
                              -
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {!isLoading && reservations.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border-dark bg-surface-dark">
                <span className="text-sm text-text-secondary">
                  Hiển thị
                  <span className="text-white font-medium">
                    {" "}
                    1-{reservations.length}
                  </span>
                  của
                  <span className="text-white font-medium">
                    {" "}
                    {reservations.length}
                  </span>
                  giữ hàng
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
