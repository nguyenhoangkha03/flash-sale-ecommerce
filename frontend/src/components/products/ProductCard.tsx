"use client";

import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import toast from "react-hot-toast";
import { Product } from "@/hooks/useProducts";

interface ProductCardProps {
    product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
    const addItem = useCartStore((state) => state.addItem);

    const handleAddToCart = () => {
        if (product.available_stock <= 0) {
            toast.error("Sản phẩm hết hàng");
            return;
        }

        addItem({
            id: product.id,
            name: product.name,
            price: Number(product.price),
            quantity: 1,
            availableStock: product.available_stock,
        });

        toast.success("Đã thêm vào giỏ hàng");
    };

    const getStockPercentage = () => {
        const total =
            product.available_stock +
            product.reserved_stock +
            product.sold_stock;
        return total > 0 ? Math.round((product.sold_stock / total) * 100) : 0;
    };

    const getStockStatus = () => {
        if (product.available_stock === 0) {
            return { text: "Hết hàng", color: "text-red-500", icon: "error" };
        }
        if (product.available_stock <= 5) {
            return {
                text: "Số lượng ít",
                color: "text-orange-500",
                icon: "warning",
            };
        }
        return {
            text: "Còn hàng",
            color: "text-green-600 dark:text-green-400",
            icon: "check_circle",
        };
    };

    const status = getStockStatus();
    const percentage = getStockPercentage();

    return (
        <article className="group relative bg-white dark:bg-card-dark rounded-xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-primary/10 border border-gray-100 dark:border-accent-brown/50 transition-all duration-300 fade-in-up flex flex-col h-full">
            {/* Image */}
            <div className="aspect-4/3 w-full bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
                {product.available_stock === 0 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                        <span className="text-white font-bold text-lg border-2 border-white px-4 py-2 rounded uppercase tracking-widest rotate-12">
                            Hết Hàng
                        </span>
                    </div>
                )}
                <img
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                    src={
                        product.image_url ||
                        "https://via.placeholder.com/400x300?text=Product"
                    }
                    alt={product.name}
                />
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col flex-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight mb-1 line-clamp-2 min-h-12">
                    {product.name}
                </h3>
                <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-xl font-black text-primary">
                        {typeof product.price === "string"
                            ? parseFloat(product.price).toLocaleString("vi-VN")
                            : Number(product.price).toLocaleString("vi-VN")}
                        <span className="text-sm"> ₫</span>
                    </span>
                </div>

                {/* Stock Dashboard */}
                <div className="mt-auto space-y-3 bg-gray-50 dark:bg-[#231a10] rounded-lg p-3 border border-gray-100 dark:border-accent-brown/30">
                    <div className="flex justify-between text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-text-secondary-dark">
                        <span>Trạng Thái Tồn Kho</span>
                        <span
                            className={`flex items-center gap-1 ${status.color}`}
                        >
                            <span className="material-symbols-outlined text-[14px]">
                                {status.icon}
                            </span>
                            {status.text}
                        </span>
                    </div>

                    {/* Mini Stock Grid */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-green-100 dark:bg-green-900/30 rounded p-1.5 flex flex-col">
                            <span className="text-xs text-green-700 dark:text-green-400 font-semibold">
                                Còn
                            </span>
                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                                {product.available_stock}
                            </span>
                        </div>
                        <div className="bg-yellow-100 dark:bg-yellow-900/30 rounded p-1.5 flex flex-col relative overflow-hidden">
                            <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></div>
                            <span className="text-xs text-yellow-700 dark:text-yellow-400 font-semibold">
                                Giữ
                            </span>
                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                                {product.reserved_stock}
                            </span>
                        </div>
                        <div className="bg-gray-200 dark:bg-gray-800 rounded p-1.5 flex flex-col">
                            <span className="text-xs text-gray-600 dark:text-gray-400 font-semibold">
                                Đã Bán
                            </span>
                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                                {product.sold_stock}
                            </span>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-gray-400">
                            <span>{percentage}% Đã Bán</span>
                            {percentage >= 75 && (
                                <span className="text-red-500 font-bold animate-pulse">
                                    Sắp Hết!
                                </span>
                            )}
                        </div>
                        <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${
                                    percentage >= 90
                                        ? "bg-red-500"
                                        : "bg-primary"
                                }`}
                                style={{ width: `${percentage}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex gap-2">
                    <button
                        onClick={handleAddToCart}
                        disabled={product.available_stock === 0}
                        className={`flex-3 py-2.5 font-bold rounded-lg shadow-lg transition-all transform active:scale-95 flex items-center justify-center gap-1 text-sm ${
                            product.available_stock === 0
                                ? "bg-gray-300 dark:bg-accent-brown text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                : "bg-primary hover:bg-primary-hover text-white shadow-primary/30"
                        }`}
                    >
                        {product.available_stock === 0 ? (
                            <span>Danh Sách Chờ</span>
                        ) : (
                            <>
                                <span>Mua Ngay</span>
                                <span className="material-symbols-outlined text-[16px]">
                                    arrow_forward
                                </span>
                            </>
                        )}
                    </button>

                    <Link
                        href={`/products/${product.id}`}
                        className="flex-2 py-2.5 px-3 border border-primary text-primary hover:bg-primary/5 dark:hover:bg-primary/10 rounded-lg font-medium text-sm text-center transition-all flex items-center justify-center gap-1"
                    >
                        <span className="material-symbols-outlined text-[16px]">
                            info
                        </span>
                        <span>Chi Tiết</span>
                    </Link>
                </div>
            </div>
        </article>
    );
}
