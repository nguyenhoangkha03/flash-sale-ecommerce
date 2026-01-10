'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axiosInstance from '@/lib/axios';
import { useCartStore } from '@/store/cartStore';
import { useSocket } from '@/hooks/useSocket';
import { RealtimeIndicator } from '@/components/ui/RealtimeIndicator';
import toast from 'react-hot-toast';
import { Product } from '@/hooks/useProducts';

interface ProductDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const router = useRouter();
  const { id } = use(params);
  const addItem = useCartStore((state) => state.addItem);
  const { on, off, isConnected } = useSocket();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const lastSequenceRef = useRef<number>(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axiosInstance.get(`/products/${id}`);
        setProduct(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Không thể tải sản phẩm');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Subscribe to real-time stock updates
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

    on('stock:changed', handleStockChanged);

    return () => {
      off('stock:changed', handleStockChanged);
    };
  }, [id, on, off]);

  const handleAddToCart = () => {
    if (!product) return;

    if (quantity > product.available_stock) {
      toast.error('Số lượng vượt quá tồn kho');
      return;
    }

    addItem({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      quantity,
      availableStock: product.available_stock,
    });

    toast.success('Đã thêm vào giỏ hàng!');
    setQuantity(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Lỗi</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/products"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Quay lại danh sách sản phẩm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb with Realtime Indicator */}
        <div className="flex justify-between items-center mb-8">
          <nav className="text-sm text-gray-600">
            <Link href="/products" className="hover:text-blue-600">
              Sản phẩm
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-semibold">{product.name}</span>
          </nav>
          <RealtimeIndicator isConnected={isConnected} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Image */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden flex items-center justify-center h-96">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <svg
                className="w-24 h-24 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            )}
          </div>

          {/* Product Info */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {product.name}
            </h1>

            {/* Price */}
            <div className="mb-6 pb-6 border-b">
              <p className="text-gray-600 text-sm mb-2">Giá bán</p>
              <p className="text-4xl font-bold text-blue-600">
                {Number(product.price).toLocaleString('vi-VN', {
                  style: 'currency',
                  currency: 'VND',
                })}
              </p>
            </div>

            {/* Stock Info */}
            <div className="mb-6 pb-6 border-b space-y-3">
              <p className="text-gray-600 text-sm mb-3 font-semibold">Thông tin tồn kho</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-gray-600 text-sm">Tồn kho</p>
                  <p className="text-2xl font-bold text-green-600">
                    {product.available_stock}
                  </p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <p className="text-gray-600 text-sm">Được giữ chỗ</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {product.reserved_stock}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-gray-600 text-sm">Đã bán</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {product.sold_stock}
                  </p>
                </div>
                <div className="bg-gray-100 rounded-lg p-4">
                  <p className="text-gray-600 text-sm">Tổng cộng</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {product.available_stock +
                      product.reserved_stock +
                      product.sold_stock}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div className="mb-6 pb-6 border-b">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Mô tả sản phẩm
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Số lượng
              </label>
              <div className="flex items-center border border-gray-300 rounded-lg w-fit">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100"
                >
                  −
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setQuantity(
                      Math.max(
                        1,
                        Math.min(val, product.available_stock),
                      ),
                    );
                  }}
                  className="w-20 text-center border-l border-r border-gray-300 py-2 focus:outline-none"
                />
                <button
                  onClick={() =>
                    setQuantity(
                      Math.min(quantity + 1, product.available_stock),
                    )
                  }
                  disabled={quantity >= product.available_stock}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                >
                  +
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Tối đa: {product.available_stock} sản phẩm
              </p>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={product.available_stock === 0}
              className="w-full px-6 py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
            >
              {product.available_stock > 0
                ? 'Thêm vào giỏ hàng'
                : 'Hết hàng'}
            </button>

            {/* Back Link */}
            <Link
              href="/products"
              className="block text-center px-6 py-3 border border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50"
            >
              Quay lại danh sách sản phẩm
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
