import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axios";

export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    image_url: string;
    available_stock: number;
    reserved_stock: number;
    sold_stock: number;
    created_at: string;
    updated_at: string;
}

interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    pages: number;
}

export const useProducts = (page = 1, limit = 10) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [meta, setMeta] = useState<PaginationMeta | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchProducts = async (pageNum = 1) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await axiosInstance.get("/products", {
                params: { page: pageNum, limit },
            });
            setProducts(response.data.data);
            setMeta(response.data.meta);
        } catch (err: any) {
            setError(err.message || "Không thể load sản phẩm!");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts(page);
    }, [page, limit]);

    return { products, meta, isLoading, error, refetch: fetchProducts };
};
