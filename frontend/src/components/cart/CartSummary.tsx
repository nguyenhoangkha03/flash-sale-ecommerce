'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCartStore } from '@/store/cartStore';

export function CartSummary() {
  const router = useRouter();
  const auth = useAuth();
  const items = useCartStore((state) => state.items);
  const totalItems = useCartStore((state) => state.getTotalItems());
  const totalPrice = useCartStore((state) => state.getTotalPrice());

  const handleCheckout = () => {
    if (!auth.isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    if (items.length === 0) {
      return;
    }

    router.push('/checkout');
  };

  return (
    <div className="bg-gray-50 rounded-lg p-6 sticky top-24">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Tóm tắt đơn hàng</h2>

      <div className="space-y-3 mb-6 border-b pb-4">
        <div className="flex justify-between text-gray-700">
          <span>Tổng số sản phẩm:</span>
          <span className="font-semibold">{totalItems}</span>
        </div>
        <div className="flex justify-between text-gray-700">
          <span>Tổng tiền:</span>
          <span className="font-bold text-xl text-blue-600">
            {totalPrice.toLocaleString('vi-VN', {
              style: 'currency',
              currency: 'VND',
            })}
          </span>
        </div>
      </div>

      <button
        onClick={handleCheckout}
        disabled={items.length === 0}
        className="w-full px-4 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed mb-3"
      >
        Tiến hành thanh toán
      </button>

      <Link
        href="/products"
        className="block w-full px-4 py-3 border border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 text-center"
      >
        Tiếp tục mua sắm
      </Link>
    </div>
  );
}
