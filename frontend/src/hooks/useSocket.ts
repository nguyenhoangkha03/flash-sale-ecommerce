import { useEffect, useCallback, useRef } from "react";
import socket from "@/lib/socket";
import { useAuth } from "./useAuth";

interface SocketEventListener {
    event: string;
    callback: (data: any) => void;
}

export const useSocket = () => {
    const auth = useAuth();
    const listenersRef = useRef<SocketEventListener[]>([]);

    // Connect socket when user is authenticated
    useEffect(() => {
        if (auth.isAuthenticated && !socket.connected) {
            // Update auth token if changed
            socket.auth = {
                token:
                    typeof window !== "undefined"
                        ? localStorage.getItem("accessToken")
                        : null,
            };
            socket.connect();
        }

        return () => {
            // Keep connection alive, don't disconnect
            // socket.disconnect();
        };
    }, [auth.isAuthenticated]);

    // Add event listener
    const on = useCallback((event: string, callback: (data: any) => void) => {
        socket.on(event, callback);
        listenersRef.current.push({ event, callback });
    }, []);

    // Remove event listener
    const off = useCallback((event: string, callback?: (data: any) => void) => {
        if (callback) {
            socket.off(event, callback);
        } else {
            socket.off(event);
        }

        if (callback) {
            listenersRef.current = listenersRef.current.filter(
                (listener) =>
                    !(
                        listener.event === event &&
                        listener.callback === callback
                    )
            );
        } else {
            listenersRef.current = listenersRef.current.filter(
                (listener) => listener.event !== event
            );
        }
    }, []);

    // Emit event
    const emit = useCallback((event: string, data: any) => {
        if (socket.connected) {
            socket.emit(event, data);
        } else {
            console.warn(
                `Kết nối socket chưa được thiết lập, không thể gửi sự kiện ${event}`
            );
        }
    }, []);

    // Get connection status
    const isConnected = socket.connected;

    return {
        socket,
        on,
        off,
        emit,
        isConnected,
    };
};
