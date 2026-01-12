"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";

export function LoginForm() {
    const router = useRouter();
    const { login, isLoading } = useAuthStore();
    const [formData, setFormData] = useState({ email: "", password: "" });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        try {
            await login(formData.email, formData.password);
            toast.success("Đăng nhập thành công!");
            router.push("/");
        } catch (error: any) {
            const message = error.response?.data?.message || error.message;
            toast.error(message);
            setErrors({ submit: message });
        }
    };

    return (
        <div className="relative min-h-screen bg-background-light dark:bg-background-dark">
            {/* Background blur effects */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-5%] w-125 h-125 bg-primary/10 rounded-full blur-[100px] opacity-60"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-150 h-150 bg-primary/5 rounded-full blur-[120px] opacity-40"></div>
            </div>

            {/* Main content */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 min-h-screen">
                <div className="w-full max-w-110 flex flex-col gap-6">
                    <div className="bg-white dark:bg-[#2a2016] border border-gray-200 dark:border-accent-brown rounded-xl shadow-2xl p-6 sm:p-10 flex flex-col gap-5 relative overflow-hidden">
                        {/* Top gradient line */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-primary/80 to-primary"></div>

                        {/* Header */}
                        <div className="text-center space-y-2 mb-1">
                            <h1 className="text-gray-900 dark:text-white tracking-tight text-3xl font-bold">
                                Đăng Nhập để Mua Hàng
                            </h1>
                            <p className="text-gray-500 dark:text-text-secondary-dark text-sm">
                                Nhập thông tin đăng nhập để truy cập các khuyến
                                mãi.
                            </p>
                        </div>

                        {/* Form */}
                        <form
                            className="flex flex-col gap-5"
                            onSubmit={handleSubmit}
                            autoComplete="off"
                        >
                            {/* Email Field */}
                            <div className="flex flex-col gap-2">
                                <label
                                    className="text-gray-700 dark:text-gray-200 text-sm font-semibold"
                                    htmlFor="email"
                                >
                                    Địa Chỉ Email
                                </label>
                                <div className="relative group/input">
                                    <span className="absolute left-3.5 top-3 text-gray-400 dark:text-[#8a7055] group-focus-within/input:text-primary transition-colors pointer-events-none">
                                        <span className="material-symbols-outlined text-[20px]">
                                            mail
                                        </span>
                                    </span>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        autoFocus
                                        autoComplete="off"
                                        className="flex w-full rounded-lg text-gray-900 dark:text-white border border-gray-300 dark:border-[#684d31] bg-gray-50 dark:bg-[#342618] focus:border-primary focus:ring-1 focus:ring-primary h-12 pl-11 pr-4 placeholder:text-gray-400 dark:placeholder:text-[#cbad90]/50 text-base font-normal transition-all"
                                        placeholder="nhap@email.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                    <label
                                        className="text-gray-700 dark:text-gray-200 text-sm font-semibold"
                                        htmlFor="password"
                                    >
                                        Mật Khẩu
                                    </label>
                                    <Link
                                        href="#"
                                        tabIndex={-1}
                                        className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                                    >
                                        Quên Mật Khẩu?
                                    </Link>
                                </div>
                                <div className="relative group/input">
                                    <span className="absolute left-3.5 top-3 text-gray-400 dark:text-[#8a7055] group-focus-within/input:text-primary transition-colors pointer-events-none">
                                        <span className="material-symbols-outlined text-[20px]">
                                            lock
                                        </span>
                                    </span>
                                    <input
                                        id="password"
                                        name="password"
                                        type={
                                            showPassword ? "text" : "password"
                                        }
                                        required
                                        autoComplete="off"
                                        className="flex w-full rounded-lg text-gray-900 dark:text-white border border-gray-300 dark:border-[#684d31] bg-gray-50 dark:bg-[#342618] focus:border-primary focus:ring-1 focus:ring-primary h-12 pl-11 pr-11 placeholder:text-gray-400 dark:placeholder:text-[#cbad90]/50 text-base font-normal transition-all"
                                        placeholder="•••••••••"
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                        className="absolute right-3.5 top-3 text-gray-400 dark:text-[#8a7055] hover:text-gray-600 dark:hover:text-[#cbad90] transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">
                                            {showPassword
                                                ? "visibility"
                                                : "visibility_off"}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* Remember Me Checkbox */}
                            <div className="flex items-center mt-1">
                                <label className="flex items-center gap-3 cursor-pointer group/check">
                                    <div className="relative flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={rememberMe}
                                            onChange={(e) =>
                                                setRememberMe(e.target.checked)
                                            }
                                            className="peer h-5 w-5 rounded border-gray-300 dark:border-[#684d31] bg-white dark:bg-[#342618] text-primary focus:ring-primary/20 focus:ring-offset-0 transition-colors cursor-pointer"
                                        />
                                    </div>
                                    <span className="text-gray-600 dark:text-gray-300 text-sm group-hover/check:text-gray-900 dark:group-hover/check:text-white transition-colors">
                                        Giữ tôi đăng nhập trong 30 ngày
                                    </span>
                                </label>
                            </div>

                            {/* Error Message */}
                            {errors.submit && (
                                <div className="rounded-lg bg-red-500/10 p-4 border border-red-500/20">
                                    <p className="text-sm font-medium text-red-400">
                                        {errors.submit}
                                    </p>
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-12 bg-primary hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white text-base font-semibold rounded-lg shadow-lg shadow-primary/20 flex items-center justify-center gap-2 transition-all mt-1"
                            >
                                <span>
                                    {isLoading
                                        ? "Đang Đăng Nhập..."
                                        : "Đăng Nhập vào FlashMarket"}
                                </span>
                                {!isLoading && (
                                    <span className="material-symbols-outlined text-[20px]">
                                        arrow_forward
                                    </span>
                                )}
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="relative flex py-1 items-center justify-center">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200 dark:border-accent-brown"></div>
                            </div>
                            <span className="relative bg-white dark:bg-[#2a2016] px-3 text-xs text-gray-400 dark:text-[#8a7055] uppercase tracking-wider font-medium">
                                Hoặc tiếp tục với
                            </span>
                        </div>

                        {/* Social Login Buttons */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                className="flex items-center justify-center gap-2 h-11 bg-white hover:bg-gray-50 dark:bg-[#342618] dark:hover:bg-[#3d2c1f] text-gray-700 dark:text-white border border-gray-200 dark:border-[#493622] rounded-lg transition-all active:scale-[0.98] shadow-sm hover:shadow"
                            >
                                <svg
                                    className="w-5 h-5"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        fill="#4285F4"
                                    ></path>
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"
                                    ></path>
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                        fill="#FBBC05"
                                    ></path>
                                    <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="#EA4335"
                                    ></path>
                                </svg>
                                <span className="text-sm font-semibold">
                                    Google
                                </span>
                            </button>
                            <button
                                type="button"
                                className="flex items-center justify-center gap-2 h-11 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-lg transition-all active:scale-[0.98] shadow-sm hover:shadow-md"
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 2.848-5.978 5.817-5.978.956 0 1.957.067 2.311.116v3.68h-1.587c-1.995 0-2.387 1.15-2.387 2.358v1.404h4.144l-.66 3.667h-3.484v7.979h-4.153z"></path>
                                </svg>
                                <span className="text-sm font-semibold">
                                    Facebook
                                </span>
                            </button>
                        </div>

                        {/* Sign Up Link */}
                        <div className="relative flex py-1 items-center mt-2">
                            <div className="grow border-t border-gray-200 dark:border-accent-brown"></div>
                            <span className="shrink mx-4 text-gray-400 dark:text-[#8a7055] text-xs uppercase tracking-wider font-semibold">
                                Người Dùng Mới?
                            </span>
                            <div className="grow border-t border-gray-200 dark:border-accent-brown"></div>
                        </div>

                        <div className="text-center">
                            <Link
                                href="/register"
                                className="inline-flex items-center justify-center gap-1.5 text-gray-900 dark:text-white hover:text-primary dark:hover:text-primary font-medium transition-colors text-sm"
                            >
                                Tạo tài khoản để bắt đầu mua sắm
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
