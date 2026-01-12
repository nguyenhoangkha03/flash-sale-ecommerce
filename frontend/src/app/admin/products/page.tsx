"use client";

import { useEffect, useState, useCallback } from "react";
import { useSocket } from "@/hooks/useSocket";
import axiosInstance from "@/lib/axios";
import toast from "react-hot-toast";
import { formatVND } from "@/lib/currency";

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
  const { on, off, isConnected } = useSocket();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStock: 0,
    reservedStock: 0,
    soldStock: 0,
  });

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);

      const response = await axiosInstance.get(
        `/admin/products?${params.toString()}`
      );
      setProducts(response.data);

      // Calculate stats
      const totalAvailable = response.data.reduce(
        (sum: number, p: Product) => sum + p.available_stock,
        0
      );
      const totalReserved = response.data.reduce(
        (sum: number, p: Product) => sum + p.reserved_stock,
        0
      );
      const totalSold = response.data.reduce(
        (sum: number, p: Product) => sum + p.sold_stock,
        0
      );

      setStats({
        totalProducts: response.data.length,
        totalStock: totalAvailable,
        reservedStock: totalReserved,
        soldStock: totalSold,
      });
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Lỗi tải danh sách sản phẩm");
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const handleStockChanged = (data: any) => {
      setProducts((prev) => {
        const updated = prev.map((p) =>
          p.id === data.productId
            ? {
                ...p,
                available_stock: data.availableStock,
                reserved_stock: data.reservedStock,
                sold_stock: data.soldStock,
              }
            : p
        );

        // Recalculate stats
        const totalAvailable = updated.reduce(
          (sum: number, p: Product) => sum + p.available_stock,
          0
        );
        const totalReserved = updated.reduce(
          (sum: number, p: Product) => sum + p.reserved_stock,
          0
        );
        const totalSold = updated.reduce(
          (sum: number, p: Product) => sum + p.sold_stock,
          0
        );

        setStats((prev) => ({
          ...prev,
          totalStock: totalAvailable,
          reservedStock: totalReserved,
          soldStock: totalSold,
        }));

        return updated;
      });
    };

    on("stock:changed", handleStockChanged);

    return () => {
      off("stock:changed", handleStockChanged);
    };
  }, [on, off]);

  const totalStockOfProduct = (product: Product) =>
    product.available_stock + product.reserved_stock + product.sold_stock;

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (index: number) => {
    const colors = [
      "bg-indigo-500/20 text-indigo-400",
      "bg-emerald-500/20 text-emerald-400",
      "bg-pink-500/20 text-pink-400",
      "bg-blue-500/20 text-blue-400",
      "bg-orange-500/20 text-orange-400",
      "bg-cyan-500/20 text-cyan-400",
    ];
    return colors[index % colors.length];
  };

  return (
    <>
      {/* Header */}
      <header className="flex-shrink-0 px-8 py-6 border-b border-border-dark/50 flex justify-between items-start bg-background-dark/50 backdrop-blur-sm z-10">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-black tracking-tight text-white">
            Quản lý Sản phẩm
          </h2>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                  isConnected ? "bg-green-400" : "bg-red-400"
                } opacity-75`}
              ></span>
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isConnected ? "bg-green-500" : "bg-red-500"
                }`}
              ></span>
            </span>
            <p className="text-text-secondary text-sm font-medium">
              {isConnected
                ? "WebSocket Kết nối • Chế độ lưu lượng cao"
                : "Đang kết nối..."}
            </p>
          </div>
        </div>
      </header>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="px-8 py-6 flex flex-col gap-6 max-w-[1400px] mx-auto">
          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1 p-5 rounded-xl border border-border-dark bg-surface-dark relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-6xl text-primary">
                  inventory_2
                </span>
              </div>
              <p className="text-text-secondary text-sm font-medium">
                Tổng sản phẩm
              </p>
              <div className="flex items-end gap-2">
                <p className="text-white text-3xl font-bold tracking-tight">
                  {stats.totalProducts}
                </p>
                <span className="text-blue-500 text-sm font-medium mb-1">
                  SKU
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1 p-5 rounded-xl border border-border-dark bg-surface-dark relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-6xl text-green-400">
                  storehouse
                </span>
              </div>
              <p className="text-text-secondary text-sm font-medium">
                Tồn kho sẵn
              </p>
              <div className="flex items-end gap-2">
                <p className="text-white text-3xl font-bold tracking-tight">
                  {stats.totalStock}
                </p>
                <span className="text-green-500 text-sm font-medium mb-1 flex items-center">
                  <span className="material-symbols-outlined text-[16px]">
                    trending_up
                  </span>
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1 p-5 rounded-xl border border-border-dark bg-surface-dark relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-6xl text-yellow-400">
                  schedule
                </span>
              </div>
              <p className="text-text-secondary text-sm font-medium">
                Đang giữ
              </p>
              <div className="flex items-end gap-2">
                <p className="text-white text-3xl font-bold tracking-tight">
                  {stats.reservedStock}
                </p>
                <span className="text-yellow-500 text-sm font-medium mb-1">
                  Pending
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1 p-5 rounded-xl border border-border-dark bg-surface-dark relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-6xl text-blue-400">
                  check_circle
                </span>
              </div>
              <p className="text-text-secondary text-sm font-medium">
                Đã bán
              </p>
              <div className="flex items-end gap-2">
                <p className="text-white text-3xl font-bold tracking-tight">
                  {stats.soldStock}
                </p>
                <span className="text-blue-500 text-sm font-medium mb-1 flex items-center">
                  <span className="material-symbols-outlined text-[16px]">
                    trending_up
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 py-2">
            <div className="relative w-full max-w-md">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-text-secondary pointer-events-none">
                <span className="material-symbols-outlined">
                  search
                </span>
              </span>
              <input
                className="w-full pl-10 pr-4 py-2.5 bg-surface-dark border border-border-dark rounded-lg text-white placeholder-text-secondary focus:ring-1 focus:ring-primary focus:border-primary text-sm transition-colors"
                placeholder="Tìm theo tên sản phẩm..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Data Table */}
          <div className="rounded-xl border border-border-dark overflow-hidden bg-surface-dark/50">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-dark bg-surface-dark text-xs uppercase tracking-wider text-text-secondary">
                    <th className="px-6 py-4 font-semibold">
                      Tên sản phẩm
                    </th>
                    <th className="px-6 py-4 font-semibold">
                      Giá bán
                    </th>
                    <th className="px-6 py-4 font-semibold text-center">
                      Tồn kho
                    </th>
                    <th className="px-6 py-4 font-semibold text-center">
                      Đang giữ
                    </th>
                    <th className="px-6 py-4 font-semibold text-center">
                      Đã bán
                    </th>
                    <th className="px-6 py-4 font-semibold text-center">
                      Tổng cộng
                    </th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-border-dark">
                  {isLoading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-8 text-center"
                      >
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <p className="mt-4 text-text-secondary">
                          Đang tải...
                        </p>
                      </td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-8 text-center text-text-secondary"
                      >
                        Không có sản phẩm nào
                      </td>
                    </tr>
                  ) : (
                    products.map((product, index) => (
                      <tr
                        key={product.id}
                        className="group hover:bg-surface-dark transition-colors"
                      >
                        <td className="px-6 py-4 text-white">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${getAvatarColor(
                                index
                              )}`}
                            >
                              {getInitials(product.name)}
                            </div>
                            <span className="font-medium">
                              {product.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-primary font-semibold">
                          {formatVND(product.price)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20">
                            {product.available_stock}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                            {product.reserved_stock}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {product.sold_stock}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center text-white font-bold">
                          {totalStockOfProduct(product)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {!isLoading && products.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border-dark bg-surface-dark">
                <span className="text-sm text-text-secondary">
                  Hiển thị
                  <span className="text-white font-medium">
                    {" "}
                    {products.length}
                  </span>
                  sản phẩm
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
