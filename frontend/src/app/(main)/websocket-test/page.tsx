"use client";

import { useEffect, useState } from "react";
import { useSocket } from "@/hooks/useSocket";

interface EventLog {
    event: string;
    data: any;
    timestamp: Date;
}

export default function WebSocketTestPage() {
    const { socket, on, off, isConnected } = useSocket();
    const [logs, setLogs] = useState<EventLog[]>([]);

    useEffect(() => {
        // Listen for various events
        on("connected", (data) => {
            addLog("connected", data);
        });

        on("stock:changed", (data) => {
            addLog("stock:changed", data);
        });

        on("reservation:created", (data) => {
            addLog("reservation:created", data);
        });

        on("reservation:expired", (data) => {
            addLog("reservation:expired", data);
        });

        on("order:created", (data) => {
            addLog("order:created", data);
        });

        on("order:paid", (data) => {
            addLog("order:paid", data);
        });

        on("order:expired", (data) => {
            addLog("order:expired", data);
        });

        return () => {
            off("connected");
            off("stock:changed");
            off("reservation:created");
            off("reservation:expired");
            off("order:created");
            off("order:paid");
            off("order:expired");
        };
    }, [on, off]);

    const addLog = (event: string, data: any) => {
        setLogs((prevLogs) => [
            {
                event,
                data,
                timestamp: new Date(),
            },
            ...prevLogs,
        ]);
    };

    const clearLogs = () => {
        setLogs([]);
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">
                    WebSocket Test
                </h1>

                {/* Connection Status */}
                <div className="mb-6 p-4 rounded-lg bg-white shadow">
                    <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold text-gray-900">
                            Trạng thái kết nối:
                        </span>
                        <div className="flex items-center gap-2">
                            <div
                                className={`w-4 h-4 rounded-full ${
                                    isConnected ? "bg-green-500" : "bg-red-500"
                                }`}
                            ></div>
                            <span
                                className={
                                    isConnected
                                        ? "text-green-600"
                                        : "text-red-600"
                                }
                            >
                                {isConnected ? "✓ Đã kết nối" : "✗ Mất kết nối"}
                            </span>
                        </div>
                    </div>
                    {socket?.id && (
                        <p className="text-sm text-gray-500 mt-2">
                            Socket ID: {socket.id}
                        </p>
                    )}
                </div>

                {/* Event Logs */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Nhật ký sự kiện ({logs.length})
                        </h2>
                        <button
                            onClick={clearLogs}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                        >
                            Xóa nhật ký
                        </button>
                    </div>

                    {logs.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">
                            Chưa có sự kiện nào. Đợi WebSocket phát sóng...
                        </p>
                    ) : (
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                            {logs.map((log, index) => (
                                <div
                                    key={index}
                                    className="p-4 bg-gray-50 rounded border border-gray-200"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-semibold text-blue-600">
                                            {log.event}
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {log.timestamp.toLocaleTimeString(
                                                "vi-VN"
                                            )}
                                        </span>
                                    </div>
                                    <pre className="text-xs text-gray-700 bg-white p-2 rounded overflow-x-auto">
                                        {JSON.stringify(log.data, null, 2)}
                                    </pre>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Test Instructions */}
                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-4">
                        Hướng dẫn test:
                    </h3>
                    <ol className="list-decimal list-inside space-y-2 text-blue-800">
                        <li>Đảm bảo bạn đã đăng nhập</li>
                        <li>Trang này sẽ tự động kết nối WebSocket</li>
                        <li>
                            Khi bạn thực hiện các hành động (tạo reservation,
                            thanh toán, etc.), sự kiện sẽ xuất hiện ở đây
                        </li>
                        <li>Kiểm tra console browser nếu có lỗi</li>
                    </ol>
                </div>

                {/* Navigation */}
                <div className="mt-8 flex gap-4">
                    <a
                        href="/"
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Quay lại sản phẩm
                    </a>
                    <a
                        href="/orders"
                        className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                        Xem đơn hàng
                    </a>
                </div>
            </div>
        </div>
    );
}
