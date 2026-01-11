'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';
import axiosInstance from '@/lib/axios';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: string;
  created_at: string;
  user?: {
    email: string;
  };
}

export default function AdminOrdersPage() {
  const { on, off } = useSocket();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams();
        if (filterStatus) params.append('status', filterStatus);
        if (searchQuery) params.append('search', searchQuery);

        const response = await axiosInstance.get(
          `/admin/orders?${params.toString()}`
        );
        setOrders(response.data);
      } catch (error) {
        console.error('Error fetching orders:', error);
        toast.error('Lỗi tải danh sách đơn hàng');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [filterStatus, searchQuery]);

  // Subscribe to realtime updates
  useEffect(() => {
    const handleOrderCreated = (order: Order) => {
      setOrders((prev) => [order, ...prev]);
      toast.success('✨ Có đơn hàng mới');
    };

    const handleOrderPaid = ({ orderId }: { orderId: string }) => {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: 'PAID' } : o
        )
      );
    };

    const handleOrderExpired = ({ orderId }: { orderId: string }) => {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: 'EXPIRED' } : o
        )
      );
    };

    on('order:created', handleOrderCreated);
    on('order:paid', handleOrderPaid);
    on('order:expired', handleOrderExpired);

    return () => {
      off('order:created', handleOrderCreated);
      off('order:paid', handleOrderPaid);
      off('order:expired', handleOrderExpired);
    };
  }, [on, off]);

  const statusColors: Record<string, string> = {
    PENDING_PAYMENT: 'bg-yellow-100 text-yellow-800',
    PAID: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    EXPIRED: 'bg-gray-100 text-gray-800',
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Quản lý đơn hàng</h1>

      {/* Filters */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Tìm kiếm theo mã đơn..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PENDING_PAYMENT">Chờ thanh toán</option>
            <option value="PAID">Đã thanh toán</option>
            <option value="CANCELLED">Đã hủy</option>
            <option value="EXPIRED">Hết hạn</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Đang tải...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Không có đơn hàng nào
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mã đơn
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tổng tiền
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thời gian
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {order.id.substring(0, 8)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {order.user?.email || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {order.total_amount.toLocaleString('vi-VN')}đ
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        statusColors[order.status] ||
                        'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {order.status === 'PENDING_PAYMENT'
                        ? 'Chờ thanh toán'
                        : order.status === 'PAID'
                        ? 'Đã thanh toán'
                        : order.status === 'CANCELLED'
                        ? 'Đã hủy'
                        : 'Hết hạn'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(order.created_at).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Chi tiết
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
