export default function FullScreenLoader() {
    return (
        <div className="fixed inset-0 z-9999 bg-background-light dark:bg-background-dark flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                {/* Spinner */}
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-slate-200 dark:border-slate-700"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin"></div>
                </div>

                {/* Text */}
                <div className="text-center">
                    <p className="text-slate-900 dark:text-white font-semibold">
                        Đang tải...
                    </p>
                    <p className="text-slate-500 dark:text-text-secondary-dark text-sm mt-1">
                        Vui lòng chờ một chút
                    </p>
                </div>

                {/* Animated Dots */}
                <div className="flex gap-1">
                    <div
                        className="w-2 h-2 rounded-full bg-primary animate-bounce"
                        style={{ animationDelay: "0s" }}
                    ></div>
                    <div
                        className="w-2 h-2 rounded-full bg-primary animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                    ></div>
                    <div
                        className="w-2 h-2 rounded-full bg-primary animate-bounce"
                        style={{ animationDelay: "0.4s" }}
                    ></div>
                </div>
            </div>
        </div>
    );
}
