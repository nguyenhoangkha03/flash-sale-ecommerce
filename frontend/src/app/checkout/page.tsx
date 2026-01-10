'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCartStore } from '@/store/cartStore';
import axiosInstance from '@/lib/axios';
import toast from 'react-hot-toast';

export default function CheckoutPage() {
  const router = useRouter();
  const auth = useAuth();
  const cartItems = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const [isLoading, setIsLoading] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);
  const [outOfStockItems, setOutOfStockItems] = useState<string[]>([]);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!auth.isAuthenticated) {
      router.push('/login');
    }
  }, [auth.isAuthenticated, router]);

  // Check stock for all items
  useEffect(() => {
    const checkStock = async () => {
      if (cartItems.length === 0) return;

      try {
        const outOfStock: string[] = [];
        for (const item of cartItems) {
          const response = await axiosInstance.get(`/products/${item.id}`);
          const product = response.data;

          if (product.available_stock < item.quantity) {
            outOfStock.push(item.id);
          }
        }

        if (outOfStock.length > 0) {
          setOutOfStockItems(outOfStock);
          setCartError(
            `${outOfStock.length} sản phẩm không đủ hàng. Vui lòng kiểm tra lại.`
          );
        } else {
          setOutOfStockItems([]);
          setCartError(null);
        }
      } catch (error) {
        console.error('Lỗi kiểm tra tồn kho:', error);
      }
    };

    checkStock();
  }, [cartItems]);

  const handleCreateReservation = async () => {
    if (cartItems.length === 0) {
      toast.error('Giỏ hàng trống');
      return;
    }

    if (outOfStockItems.length > 0) {
      toast.error('Vui lòng xóa các sản phẩm hết hàng trước');
      return;
    }

    setIsLoading(true);
    try {
      const items = cartItems.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
      }));

      // Generate idempotency key for this reservation
      const idempotencyKey = `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const response = await axiosInstance.post('/reservations', { 
        items,
        idempotency_key: idempotencyKey 
      });
      const reservation = response.data;

      toast.success('Giữ hàng thành công!');
      clearCart();
      router.push(`/payment/${reservation.id}`);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || 'Không thể tạo đơn giữ hàng';
      toast.error(errorMessage);
      console.error('Lỗi tạo reservation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveOutOfStockItem = (productId: string) => {
    const removeItem = useCartStore.getState().removeItem;
    removeItem(productId);
    toast.success('Đã xóa sản phẩm khỏi giỏ');
  };

  if (!auth.isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Thanh toán</h1>

        {cartItems.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Giỏ hàng trống
            </h2>
            <p className="text-gray-600 mb-6">
              Vui lòng thêm sản phẩm vào giỏ hàng trước
            </p>
            <button
              onClick={() => router.push('/products')}
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Tiếp tục mua sắm
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Chi tiết đơn hàng
                </h2>

                {cartError && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 font-medium mb-4">{cartError}</p>
                    <div className="space-y-2">
                      {outOfStockItems.map((itemId) => {
                        const item = cartItems.find((i) => i.id === itemId);
                        return (
                          <div
                            key={itemId}
                            className="flex justify-between items-center p-3 bg-red-100 rounded"
                          >
                            <div>
                              <p className="text-red-900 font-medium">
                                {item?.name}
                              </p>
                              <p className="text-sm text-red-700">
                                Yêu cầu: {item?.quantity}, Tồn: {item?.availableStock}
                              </p>
                            </div>
                            <button
                              onClick={() => handleRemoveOutOfStockItem(itemId)}
                              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                            >
                              Xóa
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className={`flex justify-between items-center p-4 border rounded-lg ${
                        outOfStockItems.includes(item.id)
                          ? 'bg-red-50 border-red-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {item.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {item.quantity} × {item.price.toLocaleString('vi-VN')}đ
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                        </p>
                        <p className="text-xs text-gray-500">
                          Tồn: {item.availableStock}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Checkout Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6 sticky top-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Tóm tắt
                </h2>

                <div className="space-y-4 mb-6 pb-6 border-b">
                  <div className="flex justify-between text-gray-600">
                    <span>Tạm tính:</span>
                    <span>
                      {cartItems
                        .reduce((sum, item) => sum + item.price * item.quantity, 0)
                        .toLocaleString('vi-VN')}
                      đ
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Số lượng:</span>
                    <span>
                      {cartItems.reduce((sum, item) => sum + item.quantity, 0)} sản phẩm
                    </span>
                  </div>
                </div>

                <div className="flex justify-between mb-6">
                  <span className="text-lg font-semibold text-gray-900">
                    Tổng cộng:
                  </span>
                  <span className="text-lg font-bold text-blue-600">
                    {cartItems
                      .reduce((sum, item) => sum + item.price * item.quantity, 0)
                      .toLocaleString('vi-VN')}
                    đ
                  </span>
                </div>

                <button
                  onClick={handleCreateReservation}
                  disabled={isLoading || outOfStockItems.length > 0}
                  className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition ${
                    isLoading || outOfStockItems.length > 0
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isLoading ? 'Đang xử lý...' : 'Giữ hàng (10 phút)'}
                </button>

                <p className="mt-4 text-xs text-gray-500 text-center">
                  Đơn giữ hàng sẽ hết hạn sau 10 phút
                </p>

                <button
                  onClick={() => router.push('/cart')}
                  className="w-full mt-2 py-2 px-4 border border-gray-300 rounded-lg font-medium text-gray-900 hover:bg-gray-50 transition"
                >
                  Quay lại giỏ hàng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
