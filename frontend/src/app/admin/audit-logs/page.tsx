"use client";

import { useEffect, useState, useCallback } from "react";
import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";

interface AuditLog {
    id: string;
    user_id: string;
    action: string;
    entity_type: string;
    entity_id: string;
    details: Record<string, any>;
    ip_address?: string;
    created_at: string;
    user?: {
        email: string;
    };
}

export default function AdminAuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterAction, setFilterAction] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
    const [stats, setStats] = useState({
        totalLogs: 0,
        lastHourCount: 0,
        uniqueUsers: 0,
    });

    // Fetch logs
    const fetchLogs = useCallback(async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams();
            if (filterAction) params.append("action", filterAction);
            if (searchQuery) params.append("search", searchQuery);

            const response = await axiosInstance.get(
                `/admin/audit-logs?${params.toString()}`
            );
            console.log(response);
            setLogs(response.data);

            // Calculate stats
            const now = new Date();
            const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
            const lastHourLogs = response.data.filter(
                (log: AuditLog) => new Date(log.created_at) > oneHourAgo
            );
            const uniqueUserIds = new Set(
                response.data.map((log: AuditLog) => log.user_id)
            );

            setStats({
                totalLogs: response.data.length,
                lastHourCount: lastHourLogs.length,
                uniqueUsers: uniqueUserIds.size,
            });
        } catch (error) {
            console.error("Error fetching logs:", error);
            toast.error("Lỗi tải nhật ký");
        } finally {
            setIsLoading(false);
        }
    }, [filterAction, searchQuery]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const actionColors: Record<string, string> = {
        RESERVATION_CREATED:
            "bg-green-500/10 text-green-400 border-green-500/20",
        RESERVATION_EXPIRED:
            "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
        ORDER_CREATED: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        ORDER_PAID: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        ORDER_CANCELLED: "bg-red-500/10 text-red-400 border-red-500/20",
        PRODUCT_UPDATED:
            "bg-orange-500/10 text-orange-400 border-orange-500/20",
        STOCK_CHANGED: "bg-purple-500/10 text-purple-400 border-purple-500/20",
        DEFAULT: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    };

    const getActionLabel = (action: string): string => {
        const labels: Record<string, string> = {
            RESERVATION_CREATED: "Tạo giữ hàng",
            RESERVATION_EXPIRED: "Giữ hàng hết hạn",
            RESERVATION_RELEASED: "Trả hàng",
            ORDER_CREATED: "Tạo đơn hàng",
            ORDER_PAID: "Thanh toán đơn",
            ORDER_EXPIRED: "Đơn hết hạn",
            ORDER_CANCELLED: "Hủy đơn",
            PRODUCT_UPDATED: "Cập nhật sản phẩm",
            STOCK_CHANGED: "Thay đổi tồn kho",
        };
        return labels[action] || action;
    };

    const getActionIcon = (action: string): string => {
        const icons: Record<string, string> = {
            RESERVATION_CREATED: "add_circle",
            RESERVATION_EXPIRED: "schedule",
            RESERVATION_RELEASED: "restore",
            ORDER_CREATED: "shopping_bag",
            ORDER_PAID: "check_circle",
            ORDER_EXPIRED: "schedule",
            ORDER_CANCELLED: "cancel",
            PRODUCT_UPDATED: "edit",
            STOCK_CHANGED: "inventory",
        };
        return icons[action] || "info";
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
                        Nhật ký Hệ thống
                    </h2>
                    <p className="text-text-secondary text-sm font-medium">
                        Top 50 hoạt động gần nhất
                    </p>
                </div>
            </header>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="px-8 py-6 flex flex-col gap-6 max-w-[1400px] mx-auto">
                    {/* Stats Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1 p-5 rounded-xl border border-border-dark bg-surface-dark relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span className="material-symbols-outlined text-6xl text-primary">
                                    description
                                </span>
                            </div>
                            <p className="text-text-secondary text-sm font-medium">
                                Tổng nhật ký
                            </p>
                            <div className="flex items-end gap-2">
                                <p className="text-white text-3xl font-bold tracking-tight">
                                    {stats.totalLogs}
                                </p>
                                <span className="text-blue-500 text-sm font-medium mb-1">
                                    Entries
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 p-5 rounded-xl border border-border-dark bg-surface-dark relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span className="material-symbols-outlined text-6xl text-red-400">
                                    trending_up
                                </span>
                            </div>
                            <p className="text-text-secondary text-sm font-medium">
                                1 giờ qua
                            </p>
                            <div className="flex items-end gap-2">
                                <p className="text-white text-3xl font-bold tracking-tight">
                                    {stats.lastHourCount}
                                </p>
                                <span className="text-red-500 text-sm font-medium mb-1 flex items-center">
                                    <span className="material-symbols-outlined text-[16px]">
                                        info
                                    </span>
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 p-5 rounded-xl border border-border-dark bg-surface-dark relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <span className="material-symbols-outlined text-6xl text-cyan-400">
                                    group
                                </span>
                            </div>
                            <p className="text-text-secondary text-sm font-medium">
                                Người dùng duy nhất
                            </p>
                            <div className="flex items-end gap-2">
                                <p className="text-white text-3xl font-bold tracking-tight">
                                    {stats.uniqueUsers}
                                </p>
                                <span className="text-cyan-500 text-sm font-medium mb-1">
                                    Users
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
                                placeholder="Tìm theo email hoặc entity..."
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <select
                            value={filterAction}
                            onChange={(e) => setFilterAction(e.target.value)}
                            className="px-4 py-2.5 bg-surface-dark border border-border-dark rounded-lg text-white text-sm focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                        >
                            <option value="">Tất cả hành động</option>
                            <option value="RESERVATION_CREATED">
                                Tạo giữ hàng
                            </option>
                            <option value="RESERVATION_EXPIRED">
                                Giữ hàng hết hạn
                            </option>
                            <option value="ORDER_CREATED">Tạo đơn hàng</option>
                            <option value="ORDER_PAID">Thanh toán</option>
                            <option value="ORDER_CANCELLED">Hủy đơn</option>
                            <option value="STOCK_CHANGED">
                                Thay đổi tồn kho
                            </option>
                        </select>
                    </div>

                    {/* Logs List */}
                    <div className="space-y-3">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                <p className="ml-4 text-text-secondary">
                                    Đang tải...
                                </p>
                            </div>
                        ) : logs.length === 0 ? (
                            <div className="p-8 text-center text-text-secondary bg-surface-dark rounded-xl border border-border-dark">
                                Không có nhật ký nào
                            </div>
                        ) : (
                            logs.map((log, index) => (
                                <div
                                    key={log.id}
                                    className="rounded-lg border border-border-dark bg-surface-dark/50 hover:bg-surface-dark transition-colors overflow-hidden"
                                >
                                    <button
                                        onClick={() =>
                                            setExpandedLogId(
                                                expandedLogId === log.id
                                                    ? null
                                                    : log.id
                                            )
                                        }
                                        className="w-full p-4 text-left"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div
                                                className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getAvatarColor(
                                                    index
                                                )}`}
                                            >
                                                <span className="material-symbols-outlined text-[20px]">
                                                    {getActionIcon(log.action)}
                                                </span>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
                                                    <div>
                                                        <p className="text-xs text-text-secondary mb-1">
                                                            Thời gian
                                                        </p>
                                                        <p className="text-sm font-mono text-white">
                                                            {new Date(
                                                                log.created_at
                                                            ).toLocaleTimeString(
                                                                "vi-VN"
                                                            )}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-text-secondary mb-1">
                                                            Hành động
                                                        </p>
                                                        <span
                                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                                                actionColors[
                                                                    log.action
                                                                ] ||
                                                                actionColors.DEFAULT
                                                            }`}
                                                        >
                                                            <span className="material-symbols-outlined text-[14px]">
                                                                {getActionIcon(
                                                                    log.action
                                                                )}
                                                            </span>
                                                            {getActionLabel(
                                                                log.action
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-text-secondary mb-1">
                                                            Người dùng
                                                        </p>
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${getAvatarColor(
                                                                    index
                                                                )}`}
                                                            >
                                                                {getInitials(
                                                                    log.user
                                                                        ?.email
                                                                )}
                                                            </div>
                                                            <span className="text-sm text-white truncate">
                                                                {log.user
                                                                    ?.email ||
                                                                    "N/A"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-text-secondary mb-1">
                                                            Entity
                                                        </p>
                                                        <p className="text-sm text-text-secondary font-mono">
                                                            {log.entity_type}:{" "}
                                                            {log.entity_id.substring(
                                                                0,
                                                                8
                                                            )}
                                                            ...
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-text-secondary">
                                                            {expandedLogId ===
                                                            log.id
                                                                ? "▼"
                                                                : "▶"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </button>

                                    {expandedLogId === log.id && (
                                        <div className="px-4 pb-4 border-t border-border-dark/50 pt-4 bg-background-dark/50">
                                            <p className="text-xs font-semibold text-text-secondary mb-3 uppercase tracking-wider">
                                                Chi tiết (JSON)
                                            </p>
                                            <pre className="bg-background-dark p-4 rounded-lg border border-border-dark text-xs overflow-x-auto text-gray-300 font-mono max-h-48">
                                                {JSON.stringify(
                                                    log.details,
                                                    null,
                                                    2
                                                )}
                                            </pre>
                                            {log.ip_address && (
                                                <div className="mt-3 text-xs text-text-secondary">
                                                    IP:{" "}
                                                    <span className="text-white font-mono">
                                                        {log.ip_address}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
