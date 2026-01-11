"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useCartStore } from "@/store/cartStore";
import { useState } from "react";

export function Navbar() {
    const router = useRouter();
    const auth = useAuth();
    const totalItems = useCartStore((state) => state.getTotalItems());

    const [userMenuOpen, setUserMenuOpen] = useState(false);

    const handleLogout = () => {
        auth.logout();
        router.push("/login");
        setUserMenuOpen(false);
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-accent-brown bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md transition-colors duration-300">
            <div className="max-w-360 mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 gap-4">
                    {/* Logo */}
                    <div className="flex items-center gap-3 shrink-0">
                        <Link
                            href="/"
                            className="flex items-center gap-3 text-primary"
                        >
                            <span className="material-symbols-outlined text-3xl">
                                bolt
                            </span>
                            <h2 className="text-xl font-bold tracking-tight hidden sm:block">
                                FlashMarket
                            </h2>
                        </Link>
                    </div>

                    {/* Search Bar (placeholder) */}
                    <div className="flex-1 max-w-2xl mx-auto hidden md:block">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-text-secondary-dark group-focus-within:text-primary transition-colors">
                                <span className="material-symbols-outlined">
                                    search
                                </span>
                            </div>
                            <input
                                className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-accent-brown rounded-lg leading-5 bg-white dark:bg-accent-brown/30 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm transition-all shadow-sm"
                                placeholder="Tìm kiếm sản phẩm, phân loại..."
                                type="text"
                            />
                        </div>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-3 shrink-0">
                        {/* Notifications */}
                        <button className="relative p-2 text-gray-500 dark:text-text-secondary-dark hover:text-primary dark:hover:text-primary transition-colors">
                            <span className="material-symbols-outlined text-2xl">
                                notifications
                            </span>
                            <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                            </span>
                        </button>

                        {/* Cart */}
                        <button
                            onClick={() => router.push("/cart")}
                            className="relative p-2 text-gray-500 dark:text-text-secondary-dark hover:text-primary dark:hover:text-primary transition-colors"
                        >
                            <span className="material-symbols-outlined text-2xl">
                                shopping_cart
                            </span>
                            {totalItems > 0 && (
                                <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-background-light dark:border-background-dark">
                                    {totalItems}
                                </span>
                            )}
                        </button>

                        <div className="h-8 w-px bg-gray-200 dark:bg-accent-brown mx-1"></div>

                        {/* User Profile / Auth */}
                        {auth.isAuthenticated ? (
                            <div className="relative">
                                {/* User Email Button */}
                                <button
                                    onClick={() =>
                                        setUserMenuOpen(!userMenuOpen)
                                    }
                                    className="flex items-center gap-2 px-3 py-1 rounded-lg hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors"
                                >
                                    <span className="text-sm text-gray-600 dark:text-text-secondary-dark hidden sm:block">
                                        {auth.user?.email}
                                    </span>
                                    <span className="material-symbols-outlined text-lg text-gray-600 dark:text-text-secondary-dark">
                                        {userMenuOpen
                                            ? "expand_less"
                                            : "expand_more"}
                                    </span>
                                </button>

                                {/* Dropdown Menu */}
                                {userMenuOpen && (
                                    <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-card-dark rounded-lg shadow-lg border border-gray-200 dark:border-accent-brown overflow-hidden z-10">
                                        {/* User Email Display */}
                                        <div className="px-4 py-3 border-b border-gray-200 dark:border-accent-brown">
                                            <p className="text-xs text-gray-500 dark:text-text-secondary-dark">
                                                Tài khoản
                                            </p>
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                                {auth.user?.email}
                                            </p>
                                        </div>

                                        {/* Menu Items */}
                                        <div className="py-2">
                                            <Link
                                                href="/reservations"
                                                onClick={() =>
                                                    setUserMenuOpen(false)
                                                }
                                                className="block px-4 py-2 text-sm text-gray-700 dark:text-text-secondary-dark hover:bg-gray-50 dark:hover:bg-accent-brown transition-colors"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-lg">
                                                        schedule
                                                    </span>
                                                    Đơn Hàng Đã Giữ Chỗ
                                                </span>
                                            </Link>

                                            <Link
                                                href="/orders"
                                                onClick={() =>
                                                    setUserMenuOpen(false)
                                                }
                                                className="block px-4 py-2 text-sm text-gray-700 dark:text-text-secondary-dark hover:bg-gray-50 dark:hover:bg-accent-brown transition-colors"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-lg">
                                                        shopping_bag
                                                    </span>
                                                    Đơn Hàng Của Tôi
                                                </span>
                                            </Link>

                                            {auth.user?.role === "ADMIN" && (
                                                <Link
                                                    href="/admin/orders"
                                                    onClick={() =>
                                                        setUserMenuOpen(false)
                                                    }
                                                    className="block px-4 py-2 text-sm text-primary hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors"
                                                >
                                                    <span className="flex items-center gap-2">
                                                        <span className="material-symbols-outlined text-lg">
                                                            admin_panel_settings
                                                        </span>
                                                        Bảng Điều Khiển Admin
                                                    </span>
                                                </Link>
                                            )}

                                            <Link
                                                href="/"
                                                onClick={() =>
                                                    setUserMenuOpen(false)
                                                }
                                                className="block px-4 py-2 text-sm text-gray-700 dark:text-text-secondary-dark hover:bg-gray-50 dark:hover:bg-accent-brown transition-colors"
                                            >
                                                <span className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-lg">
                                                        settings
                                                    </span>
                                                    Cài Đặt Tài Khoản
                                                </span>
                                            </Link>
                                        </div>

                                        {/* Logout */}
                                        <div className="border-t border-gray-200 dark:border-accent-brown py-2">
                                            <button
                                                onClick={handleLogout}
                                                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
                                            >
                                                <span className="material-symbols-outlined text-lg">
                                                    logout
                                                </span>
                                                Đăng Xuất
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => router.push("/login")}
                                    className="px-3 py-1 text-xs font-semibold text-primary hover:text-primary-hover transition"
                                >
                                    Đăng nhập
                                </button>
                                <button
                                    onClick={() => router.push("/register")}
                                    className="px-3 py-1 text-xs font-semibold bg-primary text-white rounded hover:bg-primary-hover transition"
                                >
                                    Đăng ký
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Mobile Search */}
                <div className="md:hidden px-4 pb-3">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-text-secondary-dark">
                            <span className="material-symbols-outlined text-xl">
                                search
                            </span>
                        </div>
                        <input
                            className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-accent-brown rounded-lg bg-white dark:bg-accent-brown/30 text-sm text-gray-900 dark:text-white"
                            placeholder="Search deals..."
                            type="text"
                        />
                    </div>
                </div>
            </div>
        </header>
    );
}
