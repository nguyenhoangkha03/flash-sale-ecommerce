import { create } from "zustand";
import axiosInstance from "../lib/axios";

export interface User {
    id: string;
    email: string;
    role: "USER" | "ADMIN";
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name?: string) => Promise<void>;
    logout: () => void;
    loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,

    login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
            const response = await axiosInstance.post("/auth/login", {
                email,
                password,
            });

            const token = response.data.access_token;
            localStorage.setItem("accessToken", token);

            // Decode token
            const payload = JSON.parse(
                Buffer.from(token.split(".")[1], "base64").toString()
            );
            const user: User = {
                id: payload.sub,
                email: payload.email,
                role: payload.role,
            };

            localStorage.setItem("user", JSON.stringify(user));
            set({ user, token, isAuthenticated: true });
        } finally {
            set({ isLoading: false });
        }
    },

    register: async (email: string, password: string, name?: string) => {
        set({ isLoading: true });
        try {
            const response = await axiosInstance.post("/auth/register", {
                email,
                password,
                name,
            });

            const token = response.data.access_token;
            localStorage.setItem("accessToken", token);

            // Decode token
            const payload = JSON.parse(
                Buffer.from(token.split(".")[1], "base64").toString()
            );
            const user: User = {
                id: payload.sub,
                email: payload.email,
                role: payload.role,
            };

            localStorage.setItem("user", JSON.stringify(user));
            set({ user, token, isAuthenticated: true });
        } finally {
            set({ isLoading: false });
        }
    },

    logout: () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        set({ user: null, token: null, isAuthenticated: false });
    },

    loadUser: async () => {
        set({ isLoading: true });
        try {
            const token = localStorage.getItem("accessToken");
            const userStr = localStorage.getItem("user");

            if (token && userStr) {
                const user = JSON.parse(userStr);
                set({ user, token, isAuthenticated: true });
            }
        } catch (error) {
            console.error("Failed to load user:", error);
            localStorage.removeItem("accessToken");
            localStorage.removeItem("user");
        } finally {
            set({ isLoading: false });
        }
    },
}));
