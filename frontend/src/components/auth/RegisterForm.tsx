"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";

export function RegisterForm() {
    const router = useRouter();
    const { register, isLoading } = useAuthStore();
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        name: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        if (formData.password !== formData.confirmPassword) {
            toast.error("Mật khẩu không khớp!");
            return;
        }

        try {
            await register(formData.email, formData.password, formData.name);
            toast.success("Đăng ký thành công!");
            router.push("/products");
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
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] opacity-60"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] opacity-40"></div>
            </div>

            {/* Main Layout */}
            <div className="relative z-10 flex flex-col lg:flex-row min-h-screen overflow-y-auto">
                {/* Left Side: Form */}
                <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-4 lg:p-6 min-h-screen lg:min-h-auto">
                    <div className="w-full max-w-[420px] flex flex-col gap-4">
                        {/* Header */}
                        <div className="text-center space-y-1 mb-1">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                Tạo Tài Khoản
                            </h1>
                            <p className="text-gray-500 dark:text-text-secondary-dark text-sm">
                                Tạo tài khoản để truy cập các khuyến mãi flash
                                sale độc quyền.
                            </p>
                        </div>

                        {/* Early Access Notice */}
                        <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20 flex gap-2 items-start animate-pulse">
                            <span className="material-symbols-outlined text-primary mt-0.5">
                                timer
                            </span>
                            <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                                    Nhận truy cập sớm 30 phút
                                </p>
                                <p className="text-xs text-gray-600 dark:text-text-secondary-dark">
                                    Đăng ký ngay để xem các deal trước công
                                    chúng.
                                </p>
                            </div>
                        </div>

                        {/* Form */}
                        <form
                            className="flex flex-col gap-5"
                            onSubmit={handleSubmit}
                            autoComplete="off"
                        >
                            {/* Full Name */}
                            <label className="flex flex-col w-full">
                                <p className="text-base font-medium leading-normal pb-2 text-gray-900 dark:text-white">
                                    Họ Và Tên
                                </p>
                                <input
                                    name="name"
                                    type="text"
                                    className="flex w-full rounded-lg text-gray-900 dark:text-white border border-gray-300 dark:border-[#684d31] bg-gray-50 dark:bg-[#342618] focus:border-primary focus:ring-1 focus:ring-primary h-12 md:h-14 px-4 placeholder:text-gray-400 dark:placeholder:text-[#cbad90]/50 text-base font-normal transition-all"
                                    placeholder="Nhập tên của bạn"
                                    value={formData.name}
                                    onChange={handleChange}
                                    autoComplete="off"
                                />
                            </label>

                            {/* Email */}
                            <label className="flex flex-col w-full">
                                <p className="text-base font-medium leading-normal pb-2 text-gray-900 dark:text-white">
                                    Địa Chỉ Email
                                </p>
                                <input
                                    name="email"
                                    type="email"
                                    required
                                    className="flex w-full rounded-lg text-gray-900 dark:text-white border border-gray-300 dark:border-[#684d31] bg-gray-50 dark:bg-[#342618] focus:border-primary focus:ring-1 focus:ring-primary h-12 md:h-14 px-4 placeholder:text-gray-400 dark:placeholder:text-[#cbad90]/50 text-base font-normal transition-all"
                                    placeholder="name@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    autoComplete="off"
                                />
                            </label>

                            {/* Password Group */}
                            <div className="flex flex-col md:flex-row gap-4">
                                <label className="flex flex-col w-full">
                                    <p className="text-base font-medium leading-normal pb-2 text-gray-900 dark:text-white">
                                        Mật Khẩu
                                    </p>
                                    <div className="relative">
                                        <input
                                            name="password"
                                            type={
                                                showPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            required
                                            className="flex w-full rounded-lg text-gray-900 dark:text-white border border-gray-300 dark:border-[#684d31] bg-gray-50 dark:bg-[#342618] focus:border-primary focus:ring-1 focus:ring-primary h-12 md:h-14 pr-10 px-4 placeholder:text-gray-400 dark:placeholder:text-[#cbad90]/50 text-base font-normal transition-all"
                                            placeholder="Tạo mật khẩu"
                                            value={formData.password}
                                            onChange={handleChange}
                                            autoComplete="off"
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowPassword(!showPassword)
                                            }
                                            className="absolute right-3 top-4.5! md:top-4 text-gray-400 dark:text-[#cbad90] hover:text-primary transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">
                                                {showPassword
                                                    ? "visibility"
                                                    : "visibility_off"}
                                            </span>
                                        </button>
                                    </div>
                                </label>

                                <label className="flex flex-col w-full">
                                    <p className="text-base font-medium leading-normal pb-2 text-gray-900 dark:text-white">
                                        Xác Nhận Mật Khẩu
                                    </p>
                                    <div className="relative">
                                        <input
                                            name="confirmPassword"
                                            type={
                                                showConfirmPassword
                                                    ? "text"
                                                    : "password"
                                            }
                                            required
                                            className="flex w-full rounded-lg text-gray-900 dark:text-white border border-gray-300 dark:border-[#684d31] bg-gray-50 dark:bg-[#342618] focus:border-primary focus:ring-1 focus:ring-primary h-12 md:h-14 pr-10 px-4 placeholder:text-gray-400 dark:placeholder:text-[#cbad90]/50 text-base font-normal transition-all"
                                            placeholder="Nhập lại mật khẩu"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            autoComplete="off"
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowConfirmPassword(
                                                    !showConfirmPassword
                                                )
                                            }
                                            className="absolute right-3 top-4.5! md:top-4 text-gray-400 dark:text-[#cbad90] hover:text-primary transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">
                                                {showConfirmPassword
                                                    ? "visibility"
                                                    : "visibility_off"}
                                            </span>
                                        </button>
                                    </div>
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
                                className="mt-4 flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 md:h-14 px-4 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-background-dark text-base font-bold leading-normal tracking-wider active:scale-[0.98] shadow-[0_4px_20px_rgba(242,127,13,0.3)] hover:shadow-[0_6px_30px_rgba(242,127,13,0.4)] transition-all"
                            >
                                <span className="truncate">
                                    {isLoading
                                        ? "Đang Tạo Tài Khoản..."
                                        : "Tạo Tài Khoản"}
                                </span>
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="relative flex py-4 items-center">
                            <div className="flex-grow border-t border-gray-200 dark:border-accent-brown"></div>
                            <span className="flex-shrink-0 mx-4 text-gray-400 dark:text-[#684d31] text-xs font-medium uppercase tracking-wider">
                                Hoặc tiếp tục với
                            </span>
                            <div className="flex-grow border-t border-gray-200 dark:border-accent-brown"></div>
                        </div>

                        {/* Social Sign Up */}
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                className="flex items-center justify-center gap-2 h-12 rounded-lg border border-gray-200 dark:border-accent-brown bg-white dark:bg-[#342618] hover:bg-gray-50 dark:hover:bg-accent-brown transition-colors"
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
                                <span className="text-sm font-medium text-gray-700 dark:text-white">
                                    Google
                                </span>
                            </button>
                            <button
                                type="button"
                                className="flex items-center justify-center gap-2 h-12 rounded-lg bg-[#1877F2] hover:bg-[#166fe5] text-white transition-colors"
                            >
                                <svg
                                    className="w-5 h-5"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 2.848-5.978 5.817-5.978.956 0 1.957.067 2.311.116v3.68h-1.587c-1.995 0-2.387 1.15-2.387 2.358v1.404h4.144l-.66 3.667h-3.484v7.979h-4.153z"></path>
                                </svg>
                                <span className="text-sm font-medium text-white">
                                    Facebook
                                </span>
                            </button>
                        </div>

                        {/* Login Link */}
                        <div className="text-center mt-2">
                            <span className="text-gray-500 dark:text-text-secondary-dark text-sm">
                                Đã có tài khoản?{" "}
                            </span>
                            <Link
                                href="/login"
                                className="text-primary font-bold text-sm hover:underline"
                            >
                                Đăng nhập
                            </Link>
                        </div>

                        {/* Terms */}
                        <p className="text-center text-xs text-gray-400 dark:text-[#684d31] mt-6 mb-4">
                            Bằng cách đăng ký, bạn đồng ý với Điều Khoản Dịch Vụ
                            và Chính Sách Bảo Mật.
                        </p>
                    </div>
                </div>

                {/* Right Side: Visual (Hidden on mobile) */}
                <div className="hidden lg:flex lg:w-5/12 relative bg-[#1a120b] items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 z-0 select-none pointer-events-none">
                        <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/80 to-transparent"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-background-dark via-transparent to-transparent"></div>
                    </div>

                    <div className="relative z-10 flex flex-col items-center text-center p-12 max-w-2xl">
                        <div className="inline-flex items-center justify-center p-4 bg-primary/20 backdrop-blur-md border border-primary/40 rounded-2xl mb-8 shadow-[0_0_40px_rgba(242,127,13,0.2)]">
                            <span className="material-symbols-outlined text-primary text-5xl">
                                rocket_launch
                            </span>
                        </div>

                        <h2 className="text-5xl lg:text-6xl font-black text-white mb-6 tracking-tight drop-shadow-xl">
                            Đừng Bỏ Lỡ <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#ffb366]">
                                Khuyến Mãi Tiếp Theo
                            </span>
                        </h2>

                        <p className="text-xl text-text-secondary-dark max-w-md mx-auto leading-relaxed">
                            Tham gia hơn 50.000 người mua sắm nhận được quyền
                            truy cập độc quyền vào các deal giảm 90% mỗi tuần.
                        </p>

                        {/* Timer Display */}
                        <div className="mt-12 flex gap-4">
                            <div className="flex flex-col items-center justify-center p-4 bg-[#342618]/80 backdrop-blur-sm rounded-xl border border-accent-brown min-w-[80px] h-24">
                                <span className="text-2xl font-bold text-white">
                                    04
                                </span>
                                <span className="text-[10px] uppercase text-text-secondary-dark tracking-wider mt-1 font-bold">
                                    Giờ
                                </span>
                            </div>
                            <div className="flex flex-col items-center justify-center p-4 bg-[#342618]/80 backdrop-blur-sm rounded-xl border border-accent-brown min-w-[80px] h-24">
                                <span className="text-2xl font-bold text-white">
                                    23
                                </span>
                                <span className="text-[10px] uppercase text-text-secondary-dark tracking-wider mt-1 font-bold">
                                    Phút
                                </span>
                            </div>
                            <div className="flex flex-col items-center justify-center p-4 bg-[#342618]/80 backdrop-blur-sm rounded-xl border border-accent-brown min-w-[80px] h-24 shadow-[0_0_15px_rgba(242,127,13,0.15)]">
                                <span className="text-2xl font-bold text-primary">
                                    17
                                </span>
                                <span className="text-[10px] uppercase text-text-secondary-dark tracking-wider mt-1 font-bold">
                                    Giây
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
