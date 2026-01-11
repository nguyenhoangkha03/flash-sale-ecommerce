export function Footer() {
    return (
        <footer className="mt-auto border-t border-gray-200 dark:border-accent-brown bg-white dark:bg-background-dark py-8">
            <div className="max-w-360 mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="text-primary">
                            <span className="material-symbols-outlined text-2xl">
                                bolt
                            </span>
                        </div>
                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                            FlashMarket
                        </span>
                    </div>
                    <div className="flex gap-6 text-sm text-gray-500 dark:text-text-secondary-dark">
                        <a
                            className="hover:text-primary transition-colors"
                            href="#"
                        >
                            Hỗ Trợ
                        </a>
                        <a
                            className="hover:text-primary transition-colors"
                            href="#"
                        >
                            Điều Khoản & Điều Kiện
                        </a>
                        <a
                            className="hover:text-primary transition-colors"
                            href="#"
                        >
                            Chính Sách Vận Chuyển
                        </a>
                    </div>
                    <div className="text-xs text-gray-400">
                        © 2026 FlashMarket Inc.
                    </div>
                </div>
            </div>
        </footer>
    );
}
