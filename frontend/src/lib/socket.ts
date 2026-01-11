import io, { Socket } from "socket.io-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function getToken(): string | null {
    if (typeof window !== "undefined") {
        return localStorage.getItem("accessToken");
    }
    return null;
}

const socket: Socket = io(API_URL + "/events", {
    autoConnect: false,
    auth: {
        token: getToken(),
    },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
});

export default socket;
