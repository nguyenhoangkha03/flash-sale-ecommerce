'use client';

import { useEffect, useState } from 'react';
import axiosInstance from '@/lib/axios';
import toast from 'react-hot-toast';

interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, any>;
  ip_address?: string;
  created_at: string;
  user?: {
    email: string;
  };
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setIsLoading(true);
        const params = new URLSearchParams();
        if (filterAction) params.append('action', filterAction);

        const response = await axiosInstance.get(
          `/admin/audit-logs?${params.toString()}`
        );
        setLogs(response.data);
      } catch (error) {
        console.error('Error fetching logs:', error);
        toast.error('Lỗi tải nhật ký');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, [filterAction]);

  const actionColors: Record<string, string> = {
    RESERVATION_CREATED: 'bg-green-100 text-green-800',
    ORDER_CREATED: 'bg-blue-100 text-blue-800',
    ORDER_PAID: 'bg-green-100 text-green-800',
    PRODUCT_UPDATED: 'bg-yellow-100 text-yellow-800',
    DEFAULT: 'bg-gray-100 text-gray-800',
  };

  const getActionLabel = (action: string): string => {
    const labels: Record<string, string> = {
      RESERVATION_CREATED: 'Tạo giữ hàng',
      RESERVATION_EXPIRED: 'Giữ hàng hết hạn',
      ORDER_CREATED: 'Tạo đơn hàng',
      ORDER_PAID: 'Thanh toán đơn',
      PRODUCT_UPDATED: 'Cập nhật sản phẩm',
      STOCK_CHANGED: 'Thay đổi tồn kho',
    };
    return labels[action] || action;
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Nhật ký hệ thống</h1>

      {/* Filters */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tất cả hành động</option>
          <option value="RESERVATION_CREATED">Tạo giữ hàng</option>
          <option value="ORDER_CREATED">Tạo đơn hàng</option>
          <option value="ORDER_PAID">Thanh toán</option>
          <option value="PRODUCT_UPDATED">Cập nhật sản phẩm</option>
        </select>
      </div>

      {/* Table */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Đang tải...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500 bg-white rounded-lg">
            Không có nhật ký nào
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="bg-white rounded-lg shadow">
              <button
                onClick={() =>
                  setExpandedLogId(
                    expandedLogId === log.id ? null : log.id
                  )
                }
                className="w-full p-4 text-left hover:bg-gray-50 transition"
              >
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                  <div>
                    <p className="text-xs text-gray-500">Thời gian</p>
                    <p className="text-sm font-medium">
                      {new Date(log.created_at).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Hành động</p>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        actionColors[log.action] || actionColors.DEFAULT
                      }`}
                    >
                      {getActionLabel(log.action)}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Người dùng</p>
                    <p className="text-sm">{log.user?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Entity</p>
                    <p className="text-sm">
                      {log.entity_type}: {log.entity_id.substring(0, 8)}...
                    </p>
                  </div>
                  <div className="text-right">
                    {expandedLogId === log.id ? '▼' : '▶'}
                  </div>
                </div>
              </button>

              {expandedLogId === log.id && (
                <div className="px-4 pb-4 border-t pt-4 bg-gray-50">
                  <p className="text-xs font-medium text-gray-700 mb-2">
                    Chi tiết:
                  </p>
                  <pre className="bg-white p-3 rounded border border-gray-200 text-xs overflow-x-auto">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
