"use client";

import { useState, useEffect, useRef } from "react";
import { useSocket } from "@/hooks/useSocket";
import axiosInstance from "@/lib/axios";
import { ProductCard } from "@/components/products/ProductCard";
import { Product } from "@/hooks/useProducts";

export default function Home() {
    const { on, off } = useSocket();

    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const lastSequenceRef = useRef<Map<string, number>>(new Map());

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await axiosInstance.get("/products?limit=8");
                setProducts(response.data.data || response.data);
                setIsLoading(false);
            } catch (error) {
                console.error("Failed to fetch products:", error);
                setIsLoading(false);
            }
        };

        fetchProducts();
    }, []);

    // Subscribe to stock changes
    useEffect(() => {
        const handleStockChanged = (data: any) => {
            const lastSeq = lastSequenceRef.current.get(data.productId) || 0;
            if (data.sequence && data.sequence <= lastSeq) {
                return;
            }
            if (data.sequence) {
                lastSequenceRef.current.set(data.productId, data.sequence);
            }

            setProducts((prev) =>
                prev.map((p) =>
                    p.id === data.productId
                        ? {
                              ...p,
                              available_stock: data.availableStock,
                              reserved_stock: data.reservedStock,
                              sold_stock: data.soldStock,
                          }
                        : p
                )
            );
        };

        on("stock:changed", handleStockChanged);
        return () => {
            off("stock:changed", handleStockChanged);
        };
    }, [on, off]);

    return (
        <div className="dark bg-background-light dark:bg-background-dark font-display text-gray-900 dark:text-white overflow-x-hidden min-h-screen flex flex-col">
            <main className="grow w-full max-w-360 mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Hero / Timer Section */}
                <section className="mb-10 flex flex-col md:flex-row gap-6 items-start md:items-end justify-between">
                    <div className="space-y-2 max-w-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-500 dark:text-red-400 border border-red-500/20">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                                Flash Sale Đang Diễn Ra
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-gray-900 dark:text-white">
                            Siêu Khuyến Mãi Công Nghệ
                        </h1>
                        <p className="text-gray-500 dark:text-text-secondary-dark text-lg">
                            Cập nhật tồn kho realtime. Hết hàng thì không còn
                            nữa.
                        </p>
                    </div>

                    {/* Countdown Timer */}
                    <div className="flex gap-3 bg-white dark:bg-card-dark p-4 rounded-xl shadow-lg border border-gray-100 dark:border-accent-brown/50">
                        <div className="flex flex-col items-center">
                            <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-lg bg-gray-100 dark:bg-accent-brown text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                                02
                            </div>
                            <span className="text-xs text-gray-500 dark:text-text-secondary-dark mt-1 uppercase font-medium">
                                Giờ
                            </span>
                        </div>
                        <div className="flex items-start pt-2 text-gray-300 dark:text-gray-600 font-bold">
                            :
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-lg bg-gray-100 dark:bg-accent-brown text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                                14
                            </div>
                            <span className="text-xs text-gray-500 dark:text-text-secondary-dark mt-1 uppercase font-medium">
                                Phút
                            </span>
                        </div>
                        <div className="flex items-start pt-2 text-gray-300 dark:text-gray-600 font-bold">
                            :
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-lg bg-primary text-xl sm:text-2xl font-bold text-white">
                                55
                            </div>
                            <span className="text-xs text-gray-500 dark:text-text-secondary-dark mt-1 uppercase font-medium">
                                Giây
                            </span>
                        </div>
                    </div>
                </section>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex justify-center items-center min-h-96">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                )}

                {/* Product Grid */}
                {!isLoading && products.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {products.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
