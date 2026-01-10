'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useCartStore } from '@/store/cartStore';
import { CartItemComponent } from '@/components/cart/CartItem';
import { CartSummary } from '@/components/cart/CartSummary';

export default function CartPage() {
  const auth = useAuth();
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);

  // Redirect to login if not authenticated
  if (!auth.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Vui lòng đăng nhập
          </h1>
          <p className="text-gray-600 mb-8">
            Bạn cần đăng nhập để xem giỏ hàng của mình
          </p>
          <Link
            href="/auth/login"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Giỏ hàng</h1>

        {items.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="mt-4 text-xl font-semibold text-gray-900">
              Giỏ hàng trống
            </h3>
            <p className="mt-2 text-gray-600">
              Chưa có sản phẩm nào trong giỏ hàng
            </p>
            <Link
              href="/products"
              className="mt-6 inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Tiếp tục mua sắm
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6 pb-4 border-b">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {items.length} sản phẩm trong giỏ
                  </h2>
                  <button
                    onClick={clearCart}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Xóa tất cả
                  </button>
                </div>

                <div className="space-y-4">
                  {items.map((item) => (
                    <CartItemComponent key={item.id} item={item} />
                  ))}
                </div>
              </div>
            </div>

            {/* Summary */}
            <CartSummary />
          </div>
        )}
      </div>
    </div>
  );
}
