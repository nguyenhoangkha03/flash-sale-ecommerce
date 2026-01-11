'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';
import axiosInstance from '@/lib/axios';
import toast from 'react-hot-toast';

interface Reservation {
  id: string;
  user_id: string;
  status: string;
  expires_at: string;
  created_at: string;
  items?: Array<{ id: string }>;
  user?: {
    email: string;
  };
}

export default function AdminReservationsPage() {
  const { on, off } = useSocket();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams();
        if (filterStatus) params.append('status', filterStatus);

        const response = await axiosInstance.get(
          `/admin/reservations?${params.toString()}`
        );
        setReservations(response.data);
      } catch (error) {
        console.error('Error fetching reservations:', error);
        toast.error('Lỗi tải danh sách giữ hàng');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReservations();
  }, [filterStatus]);

  useEffect(() => {
    const handleReservationCreated = (reservation: Reservation) => {
      setReservations((prev) => [reservation, ...prev]);
      toast.success('✨ Có đơn giữ hàng mới');
    };

    const handleReservationExpired = ({ reservationId }: { reservationId: string }) => {
      setReservations((prev) =>
        prev.map((r) =>
          r.id === reservationId ? { ...r, status: 'EXPIRED' } : r
        )
      );
    };

    on('reservation:created', handleReservationCreated);
    on('reservation:expired', handleReservationExpired);

    return () => {
      off('reservation:created', handleReservationCreated);
      off('reservation:expired', handleReservationExpired);
    };
  }, [on, off]);

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800',
    EXPIRED: 'bg-red-100 text-red-800',
    CONVERTED: 'bg-blue-100 text-blue-800',
    CANCELLED: 'bg-gray-100 text-gray-800',
  };

  const handleExpireNow = async (reservationId: string) => {
    try {
      await axiosInstance.post(`/reservations/${reservationId}/expire`);
      setReservations((prev) =>
        prev.map((r) =>
          r.id === reservationId ? { ...r, status: 'EXPIRED' } : r
        )
      );
      toast.success('Đã hết hạn giữ hàng');
    } catch (error) {
      toast.error('Lỗi hết hạn giữ hàng');
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Quản lý giữ hàng</h1>

      {/* Filters */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang hoạt động</option>
          <option value="EXPIRED">Hết hạn</option>
          <option value="CONVERTED">Đã chuyển đơn</option>
          <option value="CANCELLED">Đã hủy</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Đang tải...</p>
          </div>
        ) : reservations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Không có đơn giữ hàng nào
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Mã giữ hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Số mặt hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Hết hạn lúc
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reservations.map((res) => (
                <tr key={res.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">
                    {res.id.substring(0, 8)}...
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {res.user?.email || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {res.items?.length || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        statusColors[res.status] || 'bg-gray-100'
                      }`}
                    >
                      {res.status === 'ACTIVE'
                        ? 'Đang hoạt động'
                        : res.status === 'EXPIRED'
                        ? 'Hết hạn'
                        : res.status === 'CONVERTED'
                        ? 'Đã chuyển'
                        : 'Đã hủy'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(res.expires_at).toLocaleString('vi-VN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {res.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleExpireNow(res.id)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Hết hạn ngay
                      </button>
                    )}
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
