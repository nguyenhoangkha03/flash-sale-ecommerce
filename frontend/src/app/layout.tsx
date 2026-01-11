import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { HydrationProvider } from "@/components/HydrationProvider";
import { Toaster } from "react-hot-toast";

const inter = Inter({
    variable: "--font-display",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Flash Sale Product Catalog",
    description: "Flash Sale với tồn kho giới hạn",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark">
            <head>
                <meta charSet="utf-8" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1.0"
                />
                {/* Material Icons */}
                <link
                    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
                    rel="stylesheet"
                />
                {/* Tailwind CSS */}
                <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
                {/* Tailwind Config */}
                <script id="tailwind-config">
                    {`tailwind.config = {
                        darkMode: "class",
                        theme: {
                            extend: {
                                colors: {
                                    primary: "#f27f0d",
                                    "primary-hover": "#d96e0a",
                                    "background-light": "#f8f7f5",
                                    "background-dark": "#221910",
                                    "card-dark": "#2e2115",
                                    "card-light": "#ffffff",
                                    "accent-brown": "#493622",
                                    "accent-brown-light": "#e8dfd6",
                                    "text-secondary-dark": "#cbad90",
                                    "text-secondary-light": "#6b5c4d",
                                },
                                fontFamily: {
                                    display: ["Inter", "sans-serif"],
                                },
                                borderRadius: {
                                    DEFAULT: "0.25rem",
                                    lg: "0.5rem",
                                    xl: "0.75rem",
                                    full: "9999px",
                                },
                            },
                        },
                    };`}
                </script>
            </head>
            <body
                className={`${inter.variable} antialiased dark bg-background-dark min-h-screen flex flex-col`}
            >
                <HydrationProvider>
                    {children}
                    <Toaster position="bottom-right" />
                </HydrationProvider>
            </body>
        </html>
    );
}
