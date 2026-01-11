'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';
import axiosInstance from '@/lib/axios';
import toast from 'react-hot-toast';

interface Product {
  id: string;
  name: string;
  price: number;
  available_stock: number;
  reserved_stock: number;
  sold_stock: number;
  created_at: string;
}

export default function AdminProductsPage() {
  const { on, off } = useSocket();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const response = await axiosInstance.get('/admin/products');
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error('Lỗi tải danh sách sản phẩm');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const handleStockChanged = (data: any) => {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === data.productId
            ? {
                ...p,
                available_stock: data.availableStock,
                reserved_stock: data.reservedStock,
                sold_stock: data.soldStock,
              }
            : p
        )
      );
    };

    on('stock:changed', handleStockChanged);

    return () => {
      off('stock:changed', handleStockChanged);
    };
  }, [on, off]);

  const totalStock = (product: Product) =>
    product.available_stock + product.reserved_stock + product.sold_stock;

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Quản lý sản phẩm</h1>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Đang tải...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Không có sản phẩm nào
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tên sản phẩm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Giá
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tồn kho
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Đã giữ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Đã bán
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tổng
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {product.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {product.price.toLocaleString('vi-VN')}đ
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      {product.available_stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                      {product.reserved_stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {product.sold_stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {totalStock(product)}
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
