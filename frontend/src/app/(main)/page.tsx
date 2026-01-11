"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";
import { useProducts } from "@/hooks/useProducts";
import { ProductCard } from "@/components/products/ProductCard";
import { RealtimeIndicator } from "@/components/ui/RealtimeIndicator";

export default function Home() {
    const searchParams = useSearchParams();
    const searchQuery = searchParams.get("search") || "";
    
    const { on, off, isConnected } = useSocket();
    const { products, isLoading } = useProducts(1, 20);
    const [localProducts, setLocalProducts] = useState(products);
    const [filteredProducts, setFilteredProducts] = useState(products);
    const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastSequenceRef = useRef<Map<string, number>>(new Map());

    // Sync local products with fetched products
    useEffect(() => {
        setLocalProducts(products);
    }, [products]);

    // Filter products based on search query
    useEffect(() => {
        if (searchQuery.trim()) {
            const filtered = localProducts.filter((p) =>
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.description.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredProducts(filtered);
        } else {
            setFilteredProducts(localProducts);
        }
    }, [searchQuery, localProducts]);

    // Subscribe to stock changes with debouncing
    useEffect(() => {
        const handleStockChanged = (data: any) => {
            // Skip duplicate events
            const lastSeq = lastSequenceRef.current.get(data.productId) || 0;
            if (data.sequence && data.sequence <= lastSeq) {
                return;
            }
            if (data.sequence) {
                lastSequenceRef.current.set(data.productId, data.sequence);
            }

            // Debounce updates to avoid too frequent re-renders
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current);
            }

            updateTimeoutRef.current = setTimeout(() => {
                setLocalProducts((prev) =>
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
            }, 100); // Debounce 100ms
        };

        on("stock:changed", handleStockChanged);

        return () => {
            off("stock:changed", handleStockChanged);
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current);
            }
        };
    }, [on, off]);

    return (
        <div className="dark bg-background-light dark:bg-background-dark font-display text-gray-900 dark:text-white overflow-x-hidden min-h-screen flex flex-col">
            <main className="grow w-full max-w-360 mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Hero / Realtime Indicator Section */}
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

                    {/* Realtime Indicator */}
                    <div className="flex gap-3 bg-white dark:bg-card-dark p-4 rounded-xl shadow-lg border border-gray-100 dark:border-accent-brown/50">
                        <RealtimeIndicator isConnected={isConnected} />
                    </div>
                </section>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex justify-center items-center min-h-96">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                )}

                {/* Search Results Header */}
                {searchQuery && !isLoading && (
                    <div className="mb-6">
                        <p className="text-gray-600 dark:text-text-secondary-dark">
                            Kết quả tìm kiếm cho "<strong>{searchQuery}</strong>" ({filteredProducts.length} sản phẩm)
                        </p>
                    </div>
                )}

                {/* Product Grid */}
                {!isLoading && filteredProducts.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}

                {/* Empty Search Results */}
                {!isLoading && searchQuery && filteredProducts.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500 dark:text-text-secondary-dark mb-4">
                            Không tìm thấy sản phẩm nào phù hợp với "<strong>{searchQuery}</strong>"
                        </p>
                    </div>
                )}
            </main>
        </div>
    );
}
