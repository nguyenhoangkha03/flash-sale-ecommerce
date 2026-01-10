"use client";

import { useState, useEffect, useRef } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useSocket } from "@/hooks/useSocket";
import { RealtimeIndicator } from "@/components/ui/RealtimeIndicator";
import { ProductCard } from "@/components/products/ProductCard";

export default function ProductsPage() {
    const [page, setPage] = useState(1);
    const { products, meta, isLoading, error } = useProducts(page, 12);
    const { on, off, isConnected } = useSocket();
    const [localProducts, setLocalProducts] = useState(products);
    const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastSequenceRef = useRef<Map<string, number>>(new Map());

    // Sync local products with fetched products
    useEffect(() => {
        setLocalProducts(products);
    }, [products]);

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

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900">Error</h1>
                    <p className="text-gray-600">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header with Realtime Indicator */}
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">
                            Sản Phẩm Flash Sale
                        </h1>
                        <p className="text-gray-600">
                            Khám phá những ưu đãi tuyệt vời trên các mặt hàng số
                            lượng có hạn.
                        </p>
                    </div>
                    <RealtimeIndicator isConnected={isConnected} />
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex justify-center items-center min-h-96">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                )}

                {/* Products Grid */}
                {!isLoading && localProducts.length > 0 && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            {localProducts.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                />
                            ))}
                        </div>

                        {/* Pagination */}
                        {meta && meta.pages > 1 && (
                            <div className="flex justify-center items-center space-x-4">
                                <button
                                    onClick={() =>
                                        setPage((p) => Math.max(1, p - 1))
                                    }
                                    disabled={page === 1}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>

                                <div className="flex items-center space-x-2">
                                    {Array.from(
                                        { length: meta.pages },
                                        (_, i) => i + 1
                                    ).map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => setPage(p)}
                                            className={`px-3 py-2 rounded-md ${
                                                page === p
                                                    ? "bg-blue-600 text-white"
                                                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                                            }`}
                                        >
                                            {p}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={() =>
                                        setPage((p) =>
                                            Math.min(meta.pages, p + 1)
                                        )
                                    }
                                    disabled={page === meta.pages}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* Empty State */}
                {!isLoading && products.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-600 text-lg">
                            No products found
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
