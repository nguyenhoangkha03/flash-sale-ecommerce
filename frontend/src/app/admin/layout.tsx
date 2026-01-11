'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const auth = useAuth();

  useEffect(() => {
    if (!auth.isAuthenticated) {
      router.push('/login');
      return;
    }

    if (auth.user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }
  }, [auth.isAuthenticated, auth.user?.role, router]);

  if (!auth.isAuthenticated || auth.user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white shadow-lg">
        <div className="p-6">
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-gray-400 text-sm mt-1">{auth.user?.email}</p>
        </div>

        <nav className="mt-8 space-y-2 px-4">
          <Link
            href="/admin/orders"
            className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            📦 Đơn hàng
          </Link>
          <Link
            href="/admin/reservations"
            className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            🔖 Giữ hàng
          </Link>
          <Link
            href="/admin/products"
            className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            🛍️ Sản phẩm
          </Link>
          <Link
            href="/admin/audit-logs"
            className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition"
          >
            📋 Nhật ký hệ thống
          </Link>
        </nav>

        <div className="mt-auto p-4 border-t border-gray-800">
          <Link
            href="/"
            className="block px-4 py-2 text-center bg-gray-800 rounded-lg hover:bg-gray-700 transition text-sm"
          >
            ← Quay lại
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
