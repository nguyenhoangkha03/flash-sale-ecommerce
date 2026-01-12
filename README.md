# Flash Sale E-Commerce System

## 🎯 Tổng quan

Hệ thống bán hàng Flash Sale với tồn kho thấp, tránh oversell khi có nhiều người mua cùng lúc.

**Tech Stack:**

-   Frontend: Next.js 16 + TypeScript + Tailwind CSS
-   Backend: NestJS + TypeORM
-   Database: PostgreSQL 16+
-   Realtime: WebSocket (Socket.IO)

---

## 📋 Yêu cầu môi trường

### Bắt buộc

| Công cụ        | Phiên bản        | Lưu ý                             |
| -------------- | ---------------- | --------------------------------- |
| **Node.js**    | 18.0+ hoặc 20.0+ | Chạy `node --version` để kiểm tra |
| **npm**        | 9.0+ hoặc pnpm   | Đi kèm Node.js                    |
| **PostgreSQL** | 14+              | Cần chạy server hoặc Docker       |
| **Git**        | Latest           | Để clone repo                     |

### Kiểm tra môi trường

```bash
node --version      # v20.10.0+
npm --version       # 10.0.0+
psql --version      # psql (PostgreSQL) 16.0+
```

---

## 🚀 Cài đặt & Setup

### 1️⃣ Clone Repository

```bash
git clone https://github.com/nguyenhoangkha03/flash-sale-ecommerce.git flash-sale-ecommerce
cd flash-sale-ecommerce
```

### 2️⃣ Setup PostgreSQL

**Option A: PostgreSQL Local**

```bash
# macOS (Homebrew)
brew install postgresql@14
brew services start postgresql@14

# Windows (Download installer)
# https://www.postgresql.org/download/windows/

# Linux (Ubuntu/Debian)
sudo apt-get install postgresql postgresql-contrib
sudo service postgresql start
```

**Option B: Docker**

```bash
# Chạy PostgreSQL container
docker run --name postgres-flashsale \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=flashsale \
  -p 5432:5432 \
  -d postgres:14

# Kiểm tra kết nối
psql -h localhost -U postgres -d flashsale -c "SELECT 1"
```

### 3️⃣ Tạo Database

```bash
psql -U postgres

# Trong psql shell:
CREATE DATABASE flash_sale_db;
CREATE USER flashsale_user WITH PASSWORD 'password123';
GRANT ALL PRIVILEGES ON DATABASE flash_sale_db TO flashsale_user;
\q
```

### 4️⃣ Cài đặt Dependencies

#### Frontend

```bash
cd frontend
npm install
```

#### Backend

```bash
cd backend
npm install
```

### 5️⃣ Setup Environment Variables

#### Backend (.env)

```bash
cd backend
cp .env.example .env
```

**Nội dung .env:**

```env
# Database
DATABASE_URL=postgresql://flashsale_user:password123@localhost:5432/flash_sale_db

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=7d

# App Configuration
PORT=3001
FRONTEND_URL=http://localhost:3000
```

#### Frontend (.env.local)

```bash
cd frontend
cp .env.example .env.local
```

**Nội dung .env.local:**

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

---

## 🗄️ Database Migration & Seed

### 6️⃣ Chạy Migration

```bash
cd backend

# Tạo bảng + schema
npm run migration:run
```

### 7️⃣ Seed Data (10 sản phẩm + 2 users)

```bash
cd backend

# Seed sample data
npm run seed
```

**Data được tạo:**

-   **10 sản phẩm** với giá & tồn kho khác nhau
-   **3 users mẫu:**
    -   Admin: `nhoangkha03@gmail.com` / `123456`
    -   Regular User 1: `user1@example.com` / `123456`
    -   Regular User 2: `user2@example.com` / `123456`

---

## 💻 Chạy Local

### Terminal 1: Backend

```bash
cd backend
npm run start:dev

# Output:
# [9:05:14 am] Starting compilation in watch mode...
# [9:05:20 am] Found 0 errors. Watching for file changes.
# [Nest] 22088  - 12/01/2026, 9:05:23 am     LOG [NestFactory] Starting Nest application...
# [Nest] 22088  - 12/01/2026, 9:05:23 am     LOG [InstanceLoader] TypeOrmModule dependencies initialized+65ms
# [Nest] 22088  - 12/01/2026, 9:05:23 am     LOG [InstanceLoader] PassportModule dependencies initialized +0ms
# [Nest] 22088  - 12/01/2026, 9:05:23 am     LOG [InstanceLoader] ConfigHostModule dependencies # initialized +0ms
```

### Terminal 2: Frontend

```bash
cd frontend
npm run dev

# Output:
# > frontend@0.1.0 dev
# > next dev
# ▲ Next.js 16.1.1 (Turbopack)
# - Local:         http://localhost:3000
# - Network:       http://192.168.100.8:3000
# - Environments: .env.local
# ✓ Starting...
# ✓ Ready in 1944ms
```

### Truy cập

```
Backend:   http://localhost:3001
Frontend:  http://localhost:3000
```

---

## 🧪 Chạy Tests

Hệ thống bao gồm Unit Tests và các bài test E2E (End-to-End) quan trọng để chứng minh khả năng xử lý Concurrency (Chống Oversell) và Idempotency.

### Backend Tests

Vào thư mục backend:

```bash
cd backend
```

Chạy các lệnh test cơ bản:

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Test Coverage
npm run test:cov
```

### 🛡️ Proof of Concept: Concurrency & Idempotency

Đây là phần quan trọng nhất để chứng minh hệ thống đáp ứng yêu cầu:

1. **Chống Oversell**: Giả lập nhiều request đồng thời mua cùng 1 sản phẩm để đảm bảo không bán quá tồn kho.
2. **Idempotency**: Đảm bảo an toàn khi client gửi trùng request (retry) mà không tạo đơn hàng duplicate.

Chạy kịch bản kiểm thử (Test Script):

```bash
# Chạy file test E2E chứng minh logic
npm run test:e2e -- test/concurrency/oversell.e2e-spec.ts
```

**Kết quả mong đợi (Expected Output):**

```
 PASS  test/concurrency/oversell.e2e-spec.ts
  Concurrency Control Tests
    Test Case 1: No Oversell with Concurrent Requests
      √ should not oversell when 10 users reserve 1 item each from stock of 5 (607 ms)
    Test Case 2: Idempotency Key Handling
      √ should return same reservation when using duplicate idempotency key (187 ms)

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
Snapshots:   0 total
Time:        4.577 s
```

### ⏳ Proof of Concept: Expiration (Tùy chọn)

Kiểm tra logic tự động trả hàng khi hết hạn (TTL):

```bash
npm run test:e2e -- test/expiration/reservation-expiration.e2e-spec.ts
```

**Kết quả mong đợi (Expected Output):**

```
 PASS  test/expiration/reservation-expiration.e2e-spec.ts
  Reservation Expiration (e2e)
    Test Case 1: Reservation Expiration
      √ should expire reservation after TTL expires (1981 ms)
    Test Case 2: Manual Expiration Endpoint
      √ should manually expire reservation via POST /reservations/:id/expire (467 ms)

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
Snapshots:   0 total
Time:        5.309 s, estimated 6 s
```

---

## 📊 Cấu trúc Project

```
flash-sale-ecommerce/
├── backend/
│   ├── src/
│   │   ├── auth/                 # Authentication & Authorization
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── decorators/       # @Roles decorator
│   │   │   ├── guards/           # JwtAuthGuard, RolesGuard
│   │   │   ├── strategies/       # JWT strategy
│   │   │   └── dto/              # LoginDto, RegisterDto
│   │   │
│   │   ├── products/             # Product Catalog
│   │   │   ├── products.service.ts
│   │   │   ├── products.controller.ts
│   │   │   ├── entities/
│   │   │   └── dto/
│   │   │
│   │   ├── reservations/         # Reservation (Giữ hàng - Pessimistic Lock + TTL)
│   │   │   ├── reservations.service.ts (Pessimistic Lock: FOR UPDATE)
│   │   │   ├── reservations.controller.ts
│   │   │   ├── reservation-expiration.service.ts (TTL: 10min)
│   │   │   ├── entities/
│   │   │   └── dto/
│   │   │
│   │   ├── orders/               # Orders & Checkout (Idempotent + Payment TTL)
│   │   │   ├── orders.service.ts
│   │   │   ├── orders.controller.ts
│   │   │   ├── order-expiration.service.ts (Payment TTL: 5min)
│   │   │   ├── entities/
│   │   │   └── dto/
│   │   │
│   │   ├── admin/                # Admin Endpoints
│   │   │   ├── admin.service.ts
│   │   │   ├── admin.controller.ts
│   │   │   └── admin.module.ts
│   │   │
│   │   ├── audit/                # Audit Logging
│   │   │   ├── audit-log.service.ts
│   │   │   ├── audit.module.ts
│   │   │   └── entities/audit-log.entity.ts
│   │   │
│   │   ├── events/               # WebSocket & Realtime (Socket.IO)
│   │   │   ├── events.gateway.ts
│   │   │   ├── events.service.ts
│   │   │   └── events.module.ts
│   │   │
│   │   ├── users/                # User Management
│   │   │   ├── users.service.ts
│   │   │   ├── entities/user.entity.ts
│   │   │   └── users.module.ts
│   │   │
│   │   ├── common/               # Shared (decorators, middlewares)
│   │   ├── database/             # Config & migrations
│   │   │   ├── data-source.ts
│   │   │   ├── migrations/
│   │   │   └── seeds/
│   │   │
│   │   ├── app.module.ts
│   │   └── main.ts
│   │
│   ├── test/                     # E2E Tests
│   │   ├── concurrency/
│   │   │   └── oversell.e2e-spec.ts    # ✅ Concurrency proof
│   │   ├── expiration/
│   │   │   └── reservation-expiration.e2e-spec.ts  # ✅ TTL proof
│   │   └── app.e2e-spec.ts
│   │
│   ├── package.json
│   ├── .env.example
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   ├── (main)/
│   │   │   │   ├── page.tsx      (Products list)
│   │   │   │   ├── products/[id]/
│   │   │   │   ├── cart/
│   │   │   │   ├── checkout/
│   │   │   │   ├── payment/
│   │   │   │   └── orders/
│   │   │   ├── admin/
│   │   │   │   ├── page.tsx      (Dashboard)
│   │   │   │   ├── orders/
│   │   │   │   ├── reservations/
│   │   │   │   ├── products/
│   │   │   │   ├── audit-logs/
│   │   │   │   └── layout.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   ├── auth/
│   │   │   ├── products/
│   │   │   ├── cart/
│   │   │   └── ui/
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useSocket.ts
│   │   │   └── useProducts.ts
│   │   │
│   │   ├── lib/
│   │   │   ├── axios.ts
│   │   │   ├── socket.ts
│   │   │   └── currency.ts
│   │   │
│   │   └── store/
│   │       ├── authStore.ts
│   │       └── cartStore.ts
│   │
│   ├── package.json
│   ├── .env.example
│   └── next.config.ts
│
├── DESIGN.md                     # 📋 Architecture & Technical Decisions
├── README.md                     # This file
```

## 📄 License

MIT

---

**Last Updated:** 2026-01-12  
**Version:** 1.0.0
