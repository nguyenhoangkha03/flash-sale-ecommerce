# Flash Sale E-commerce System

## Overview

Hệ thống bán hàng Flash Sale (High Concurrency) được xây dựng để đảm bảo tính toàn vẹn dữ liệu khi có nhiều người mua cùng lúc.

## Tech Stack

-   **Frontend:** Next.js (TypeScript, Tailwind CSS)
-   **Backend:** NestJS (PostgreSQL, TypeORM)
-   **Realtime:** WebSocket (Socket.IO)
-   **Database:** PostgreSQL

## Key Features

1. No Oversell (Chống bán vượt tồn kho)
2. Reservation System (Giữ hàng có thời hạn - TTL)
3. Realtime Updates (Cập nhật tồn kho tức thời)
4. Order State Machine (Quản lý trạng thái đơn hàng chặt chẽ)
