"use client";

import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import toast from "react-hot-toast";
import { Product } from "@/hooks/useProducts";
import { PhotoIcon } from "@heroicons/react/24/outline";

interface ProductCardProps {
    product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
    const addItem = useCartStore((state) => state.addItem);

    const handleAddToCart = () => {
        if (product.available_stock <= 0) {
            toast.error("Out of stock");
            return;
        }

        addItem({
            id: product.id,
            name: product.name,
            price: Number(product.price),
            quantity: 1,
            availableStock: product.available_stock,
        });

        toast.success("Added to cart!");
    };

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            {/* Image Placeholder */}
            <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <PhotoIcon className="w-12 h-12 text-gray-400" />
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {product.name}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {product.description}
                </p>

                {/* Price and Stock */}
                <div className="flex justify-between items-center mb-4">
                    <span className="text-2xl font-bold text-blue-600">
                        ${Number(product.price).toFixed(2)}
                    </span>
                    <span
                        className={`text-sm font-medium px-3 py-1 rounded-full ${
                            product.available_stock > 0
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                        }`}
                    >
                        {product.available_stock > 0
                            ? `${product.available_stock} in stock`
                            : "Out of stock"}
                    </span>
                </div>

                {/* Stock Info */}
                <div className="text-xs text-gray-500 mb-4 space-y-1">
                    <p>Reserved: {product.reserved_stock}</p>
                    <p>Sold: {product.sold_stock}</p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    <Link
                        href={`/products/${product.id}`}
                        className="flex-1 px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 font-medium text-center"
                    >
                        Xem chi tiết
                    </Link>
                    <button
                        onClick={handleAddToCart}
                        disabled={product.available_stock <= 0}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Thêm vào giỏ hàng
                    </button>
                </div>
            </div>
        </div>
    );
}
