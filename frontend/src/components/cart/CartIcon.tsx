"use client";

import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import { ShoppingCartIcon } from "@heroicons/react/16/solid";

export function CartIcon() {
    const totalItems = useCartStore((state) => state.getTotalItems());

    return (
        <Link href="/cart" className="relative flex items-center">
            <ShoppingCartIcon className="w-6 h-6 text-gray-700 hover:text-blue-600" />
            {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                    {totalItems}
                </span>
            )}
        </Link>
    );
}
