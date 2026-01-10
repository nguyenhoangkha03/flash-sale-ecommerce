"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useCartStore } from "@/store/cartStore";
import { ShoppingCartIcon } from "@heroicons/react/16/solid";

export function Navbar() {
    const router = useRouter();
    const auth = useAuth();
    const totalItems = useCartStore((state) => state.getTotalItems());

    const handleLogout = () => {
        auth.logout();
        router.push("/auth/login");
    };

    return (
        <nav className="bg-white shadow-md">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="shrink-0">
                        <Link
                            href="/"
                            className="text-2xl font-bold text-blue-600"
                        >
                            FlashSale
                        </Link>
                    </div>

                    {/* Navigation Links */}
                    <div className="hidden md:flex space-x-8">
                        <Link
                            href="/products"
                            className="text-gray-700 hover:text-blue-600"
                        >
                            Sản phẩm
                        </Link>
                        {auth.isAuthenticated &&
                            auth.user?.role === "ADMIN" && (
                                <Link
                                    href="/admin"
                                    className="text-gray-700 hover:text-blue-600"
                                >
                                    Admin
                                </Link>
                            )}
                    </div>

                    {/* Right side - Cart & Auth */}
                    <div className="flex items-center space-x-4">
                        {/* Cart Icon */}
                        {auth.isAuthenticated && (
                            <Link href="/cart" className="relative">
                                <ShoppingCartIcon className="w-6 h-6 text-gray-700 hover:text-blue-600" />
                                {totalItems > 0 && (
                                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                                        {totalItems}
                                    </span>
                                )}
                            </Link>
                        )}

                        {/* Auth Section */}
                        {auth.isAuthenticated ? (
                            <div className="flex items-center space-x-4">
                                <span className="text-sm text-gray-700">
                                    {auth.user?.email}
                                </span>
                                <button
                                    onClick={handleLogout}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
                                >
                                    Đăng xuất
                                </button>
                            </div>
                        ) : (
                            <div className="flex space-x-4">
                                <Link
                                    href="/login"
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                                >
                                    Đăng nhập
                                </Link>
                                <Link
                                    href="/register"
                                    className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 hover:bg-blue-50 rounded-md"
                                >
                                    Đăng ký
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
