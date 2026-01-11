"use client";

import { useState, useEffect, use, useRef } from "react";
import Link from "next/link";
import axiosInstance from "@/lib/axios";
import { useCartStore } from "@/store/cartStore";
import { useSocket } from "@/hooks/useSocket";
import { RealtimeIndicator } from "@/components/ui/RealtimeIndicator";
import toast from "react-hot-toast";
import { Product } from "@/hooks/useProducts";

interface ProductDetailPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
    const { id } = use(params);
    const addItem = useCartStore((state) => state.addItem);
    const { on, off, isConnected, emit } = useSocket();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [viewerCount, setViewerCount] = useState(0);
    const lastSequenceRef = useRef<number>(0);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await axiosInstance.get(`/products/${id}`);
                setProduct(response.data);
            } catch (err: any) {
                setError(
                    err.response?.data?.message || "Không thể tải sản phẩm"
                );
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id]);

    // Subscribe to real-time stock updates and viewer count
    useEffect(() => {
        const handleStockChanged = (data: any) => {
            // Only update if this is for current product
            if (data.productId !== id) return;

            // Skip duplicate events based on sequence
            if (data.sequence && data.sequence <= lastSequenceRef.current) {
                return;
            }

            if (data.sequence) {
                lastSequenceRef.current = data.sequence;
            }

            // Update product stock
            setProduct((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    available_stock: data.availableStock,
                    reserved_stock: data.reservedStock,
                    sold_stock: data.soldStock,
                };
            });
        };

        const handleProductViewers = (data: any) => {
            if (data.productId === id) {
                setViewerCount(data.viewerCount);
            }
        };

        on("stock:changed", handleStockChanged);
        on("product:viewers", handleProductViewers);

        // Emit product:view event to server
        if (id) {
            emit("product:view", { productId: id });
        }

        return () => {
            off("stock:changed", handleStockChanged);
            off("product:viewers", handleProductViewers);
            // Emit product:unview when leaving
            if (id) {
                emit("product:unview", { productId: id });
            }
        };
    }, [id, on, off, emit]);

    const handleAddToCart = () => {
        if (!product) return;

        if (quantity > product.available_stock) {
            toast.error("Số lượng vượt quá tồn kho");
            return;
        }

        addItem({
            id: product.id,
            name: product.name,
            price: Number(product.price),
            quantity,
            availableStock: product.available_stock,
            image: product.image_url,
        });

        toast.success("Đã thêm vào giỏ hàng!");
        setQuantity(1);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-dark">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-dark">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">Lỗi</h1>
                    <p className="text-gray-400 mb-6">{error}</p>
                    <Link
                        href="/"
                        className="inline-block px-6 py-3 bg-primary text-background-dark rounded-lg hover:bg-orange-600 font-bold"
                    >
                        Quay lại danh sách sản phẩm
                    </Link>
                </div>
            </div>
        );
    }

    const discountPercent = 25; // Mock discount
    const originalPrice = Math.round(Number(product.price) / 0.75);
    const totalStock =
        product.available_stock + product.reserved_stock + product.sold_stock;

    return (
        <main className="flex-grow w-full max-w-[1440px] mx-auto p-6 lg:p-10 flex flex-col lg:flex-row gap-8 bg-background-dark min-h-screen">
            {/* Left Content Area */}
            <div className="flex-1 flex flex-col gap-6">
                {/* Breadcrumbs */}
                <div className="flex justify-between items-center">
                    <nav className="flex flex-wrap gap-2 items-center text-sm">
                        <Link
                            href="/"
                            className="text-text-secondary-dark hover:text-primary transition-colors font-medium"
                        >
                            Home
                        </Link>
                        <span className="text-text-secondary-dark/50 material-symbols-outlined text-base">
                            chevron_right
                        </span>
                        <Link
                            href="/"
                            className="text-text-secondary-dark hover:text-primary transition-colors font-medium"
                        >
                            Sản phẩm
                        </Link>
                        <span className="text-text-secondary-dark/50 material-symbols-outlined text-base">
                            chevron_right
                        </span>
                        <span className="text-white font-semibold">
                            {product.name}
                        </span>
                    </nav>
                    <RealtimeIndicator isConnected={isConnected} />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    {/* Product Gallery (Left Column) */}
                    <div className="xl:col-span-7 flex flex-col gap-4">
                        <div className="w-full aspect-[4/3] bg-card-dark rounded-2xl overflow-hidden relative group border border-accent-brown">
                            <img
                                src={
                                    product.image_url ||
                                    "https://via.placeholder.com/600x450?text=Product"
                                }
                                alt={product.name}
                                className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
                                Flash Sale
                            </div>
                        </div>
                    </div>

                    {/* Product Details (Right Column) */}
                    <div className="xl:col-span-5 flex flex-col gap-6">
                        {/* Title & Price */}
                        <div className="space-y-4">
                            <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight tracking-tight">
                                {product.name}
                            </h1>
                            <div className="flex items-end gap-4 pb-4 border-b border-accent-brown">
                                <span className="text-4xl font-bold text-primary">
                                    {typeof product.price === "string"
                                        ? parseFloat(
                                              product.price
                                          ).toLocaleString("vi-VN")
                                        : Number(product.price).toLocaleString(
                                              "vi-VN"
                                          )}
                                    <span className="text-lg">₫</span>
                                </span>
                                <span className="text-xl text-text-secondary-dark/60 line-through mb-1.5 font-medium">
                                    {originalPrice.toLocaleString("vi-VN")}₫
                                </span>
                                <span className="bg-green-500/10 text-green-400 text-xs font-bold px-2 py-1 rounded mb-2 border border-green-500/20">
                                    SAVE {discountPercent}%
                                </span>
                            </div>
                        </div>

                        {/* Core Metrics Grid */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-card-dark p-4 rounded-xl border border-accent-brown flex flex-col items-center justify-center gap-1 group relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-1">
                                    <span className="block size-2 rounded-full bg-green-500 animate-pulse"></span>
                                </div>
                                <span className="text-3xl font-bold text-white group-hover:text-primary transition-colors">
                                    {product.available_stock}
                                </span>
                                <span className="text-xs text-text-secondary-dark font-medium uppercase tracking-wide">
                                    Còn
                                </span>
                            </div>
                            <div className="bg-card-dark p-4 rounded-xl border border-accent-brown flex flex-col items-center justify-center gap-1 opacity-80">
                                <span className="text-3xl font-bold text-text-secondary-dark">
                                    {product.reserved_stock}
                                </span>
                                <span className="text-xs text-text-secondary-dark/70 font-medium uppercase tracking-wide">
                                    Giữ
                                </span>
                            </div>
                            <div className="bg-card-dark p-4 rounded-xl border border-accent-brown flex flex-col items-center justify-center gap-1 opacity-60">
                                <span className="text-3xl font-bold text-text-secondary-dark/60">
                                    {product.sold_stock}
                                </span>
                                <span className="text-xs text-text-secondary-dark/50 font-medium uppercase tracking-wide">
                                    Đã Bán
                                </span>
                            </div>
                        </div>

                        {/* Real-time Warning */}
                        <div className="flex items-center gap-3 text-sm text-text-secondary-dark bg-accent-brown/30 p-3 rounded-lg border border-accent-brown">
                            <span className="material-symbols-outlined text-primary text-xl">
                                trending_up
                            </span>
                            <p>
                                Sản phẩm nổi bật!{" "}
                                <span className="text-white font-bold">
                                    {viewerCount}
                                </span>{" "}
                                người đang xem sản phẩm này.
                            </p>
                        </div>

                        {/* Action Area */}
                        <div className="flex flex-col gap-3 pt-2">
                            <button
                                onClick={handleAddToCart}
                                disabled={product.available_stock === 0}
                                className={`w-full h-14 ${
                                    product.available_stock > 0
                                        ? "bg-primary hover:bg-orange-600 shadow-[0_4px_20px_rgba(242,127,13,0.3)] hover:shadow-[0_4px_25px_rgba(242,127,13,0.5)]"
                                        : "bg-gray-600 cursor-not-allowed"
                                } text-background-dark text-lg font-bold rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-3`}
                            >
                                <span className="material-symbols-outlined">
                                    shopping_bag
                                </span>
                                {product.available_stock > 0
                                    ? "Thêm vào Giỏ"
                                    : "Hết Hàng"}
                            </button>
                            <p className="text-center text-xs text-text-secondary-dark/60">
                                Hàng sẽ được thêm vào giỏ chờ được giữ hàng.
                            </p>
                        </div>

                        {/* Quantity Selector */}
                        <div className="pt-4 border-t border-accent-brown">
                            <label className="block text-sm font-semibold text-gray-300 mb-3">
                                Số lượng
                            </label>
                            <div className="flex items-center border border-accent-brown rounded-lg w-fit">
                                <button
                                    onClick={() =>
                                        setQuantity(Math.max(1, quantity - 1))
                                    }
                                    className="px-4 py-2 text-text-secondary-dark hover:bg-accent-brown/30"
                                >
                                    −
                                </button>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => {
                                        const val =
                                            parseInt(e.target.value) || 1;
                                        setQuantity(
                                            Math.max(
                                                1,
                                                Math.min(
                                                    val,
                                                    product.available_stock
                                                )
                                            )
                                        );
                                    }}
                                    className="w-20 text-center border-l border-r border-accent-brown bg-background-dark py-2 text-white focus:outline-none"
                                />
                                <button
                                    onClick={() =>
                                        setQuantity(
                                            Math.min(
                                                quantity + 1,
                                                product.available_stock
                                            )
                                        )
                                    }
                                    disabled={
                                        quantity >= product.available_stock
                                    }
                                    className="px-4 py-2 text-text-secondary-dark hover:bg-accent-brown/30 disabled:opacity-50"
                                >
                                    +
                                </button>
                            </div>
                            <p className="text-xs text-text-secondary-dark/60 mt-2">
                                Tối đa: {product.available_stock} sản phẩm
                            </p>
                        </div>

                        {/* Description */}
                        {product.description && (
                            <div className="pt-4 border-t border-accent-brown">
                                <h3 className="text-lg font-semibold text-white mb-2">
                                    Mô tả sản phẩm
                                </h3>
                                <p className="text-text-secondary-dark leading-relaxed">
                                    {product.description}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
