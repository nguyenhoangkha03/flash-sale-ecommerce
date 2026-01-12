"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const auth = useAuth();

    useEffect(() => {
        if (!auth.isAuthenticated && !auth.isLoading) {
            router.push("/login");
            return;
        }

        if (auth.user?.role !== "ADMIN" && !auth.isLoading) {
            router.push("/");
            return;
        }
    }, [auth.isAuthenticated, auth.user?.role, router]);

    if (!auth.isAuthenticated || auth.user?.role !== "ADMIN") {
        return null;
    }

    const isActive = (href: string) => pathname === href;
    const getInitials = (email: string) => {
        return email
            .split("@")[0]
            .split(".")
            .map((part) => part[0].toUpperCase())
            .join("")
            .slice(0, 2);
    };

    return (
        <div className="flex h-screen w-full dark bg-background-light dark:bg-background-dark">
            {/* Sidebar */}
            <aside className="w-64 flex-shrink-0 flex flex-col border-r border-border-dark bg-background-dark">
                <div className="flex flex-col gap-1 p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="flex items-center justify-center w-8 h-8 rounded bg-primary text-white">
                            <span className="material-symbols-outlined text-[20px]">
                                flash_on
                            </span>
                        </div>
                        <div>
                            <h1 className="text-white text-lg font-bold leading-none tracking-tight">
                                FlashAdmin
                            </h1>
                            <p className="text-text-secondary text-xs font-medium">
                                v2.4.0 • Enterprise
                            </p>
                        </div>
                    </div>
                    <nav className="flex flex-col gap-1">
                        <Link
                            href="/admin"
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                                pathname === "/admin"
                                    ? "bg-surface-dark border border-border-dark/50 text-white shadow-sm"
                                    : "text-text-secondary hover:bg-surface-dark hover:text-white"
                            }`}
                        >
                            <span className="material-symbols-outlined">
                                dashboard
                            </span>
                            <span className="text-sm font-medium">
                                Dashboard
                            </span>
                        </Link>
                        <Link
                            href="/admin/orders"
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                                pathname === "/admin/orders"
                                    ? "bg-surface-dark border border-border-dark/50 text-white shadow-sm"
                                    : "text-text-secondary hover:bg-surface-dark hover:text-white"
                            }`}
                        >
                            <span className="material-symbols-outlined text-primary font-variation-settings">
                                shopping_bag
                            </span>
                            <span className="text-sm font-medium">
                                Đơn hàng
                            </span>
                            <span className="ml-auto text-xs bg-primary text-white px-2 py-0.5 rounded-full">
                                Live
                            </span>
                        </Link>
                        <Link
                            href="/admin/reservations"
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                                pathname === "/admin/reservations"
                                    ? "bg-surface-dark border border-border-dark/50 text-white shadow-sm"
                                    : "text-text-secondary hover:bg-surface-dark hover:text-white"
                            }`}
                        >
                            <span className="material-symbols-outlined">
                                calendar_today
                            </span>
                            <span className="text-sm font-medium">
                                Giữ hàng
                            </span>
                        </Link>
                        <Link
                            href="/admin/products"
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                                pathname === "/admin/products"
                                    ? "bg-surface-dark border border-border-dark/50 text-white shadow-sm"
                                    : "text-text-secondary hover:bg-surface-dark hover:text-white"
                            }`}
                        >
                            <span className="material-symbols-outlined">
                                inventory_2
                            </span>
                            <span className="text-sm font-medium">
                                Sản phẩm
                            </span>
                        </Link>
                        <Link
                            href="/admin/audit-logs"
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                                pathname === "/admin/audit-logs"
                                    ? "bg-surface-dark border border-border-dark/50 text-white shadow-sm"
                                    : "text-text-secondary hover:bg-surface-dark hover:text-white"
                            }`}
                        >
                            <span className="material-symbols-outlined">
                                description
                            </span>
                            <span className="text-sm font-medium">Nhật ký</span>
                        </Link>
                    </nav>
                </div>
                <div className="mt-auto p-6 border-t border-border-dark">
                    <Link
                        href="/"
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-text-secondary hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined">home</span>
                        <span className="text-sm font-medium">Trang chủ</span>
                    </Link>
                    <div className="mt-4 flex items-center gap-3 px-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-orange-400 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-primary/20">
                            {getInitials(auth.user?.email || "AD")}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-white">
                                Admin
                            </span>
                            <span className="text-xs text-text-secondary truncate">
                                {auth.user?.email}
                            </span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full overflow-hidden bg-background-light dark:bg-background-dark">
                {children}
            </main>
        </div>
    );
}
