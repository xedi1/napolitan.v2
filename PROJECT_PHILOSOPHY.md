# Project Philosophy & Principles

## ۱. Backend مرکزی، نه یک پنل مدیریت
همه چیز (پنل ادمین، وب QR، اپ موبایل، ربات تلگرام، سیستم دلیوری) در آینده فقط از طریق API به Backend وصل می‌شوند.
**هیچ منطق کسب‌وکاری نباید در سمت کلاینت (Frontend) پیاده‌سازی شود.**

## ۲. Single Source of Truth
هر داده فقط یک‌بار در دیتابیس ذخیره می‌شود.
**هیچ Duplicate Data بین ماژول‌ها مجاز نیست.**

## ۳. API-First
پیش از پیاده‌سازی هر ماژول، Contract آن (مسیرها، ورودی/خروجی، مدل داده) باید مشخص و مستند (OpenAPI/Swagger) شود.

## ۴. Event-Driven Core
ماژول‌ها مستقیماً همدیگر را صدا نمی‌زنند. هر اتفاق مهم (مثل ثبت سفارش) یک Event منتشر می‌کند و ماژول‌های دیگر (انبار، گزارش، اعلان) به آن Event گوش می‌دهند و واکنش نشان می‌دهند.

## ۵. جدایی کامل REST / WebSocket / Webhook
- **REST API** → عملیات معمول CRUD
- **WebSocket** → اطلاعات Real-Time داخلی (بین سالن، آشپزخانه، صندوق، داشبورد)
- **Webhook** → فقط برای اتصال سیستم‌های خارجی (CRM، حسابداری، ...)

## ۶. ماژولار بودن مطلق
هر بخش (Auth، Orders، Kitchen، Inventory، ...) باید یک ماژول مستقل با مرز مشخص باشد تا در آینده بدون دست‌زدن به هسته سیستم، قابلیت جدید اضافه شود.

## ۷. آماده برای توسعه‌های آینده
از روز اول، حتی اگر آن قابلیت‌ها الان ساخته نشوند (QR Menu، اپ موبایل، ربات تلگرام، دلیوری).

---

## فازهای پروژه
- [x] فاز ۰: راه‌اندازی زیرساخت پروژه (✅ انجام شد)
- [x] فاز ۱: Authentication & Users Module (✅ انجام شد)
- [ ] فاز ۲: ...

---

# Phase 1: Authentication & Users Module

## Implemented Features

### Auth Module (`/api/v1/auth`)
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| POST | /auth/register | Register new user | No |
| POST | /auth/login | Login with credentials | No |
| POST | /auth/refresh | Refresh access token | No |
| POST | /auth/logout | Logout current user | Yes |

### Users Module (`/api/v1/users`)
| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| POST | /users | Create user | Yes | ADMIN |
| GET | /users | List all users | Yes | ADMIN, MANAGER |
| GET | /users/:id | Get user by ID | Yes | ADMIN, MANAGER |
| PUT | /users/:id | Update user | Yes | ADMIN |
| DELETE | /users/:id | Delete user (soft) | Yes | ADMIN |

### User Roles
- `ADMIN` - Full system access
- `MANAGER` - Manage staff and view reports
- `STAFF` - Regular staff member
- `KITCHEN` - Kitchen staff access

---

# Technical Stack

## Backend
- **Language:** Node.js + TypeScript
- **Framework:** NestJS (ساختار ماژولار داخلی)
- **ORM:** Prisma
- **Authentication:** JWT (Access Token + Refresh Token)

## Database & Cache
- **Database:** PostgreSQL
- **Cache & Message Queue:** Redis + BullMQ
- **Real-Time:** Socket.io (WebSocket Gateway در NestJS)

## Documentation & Containerization
- **API Documentation:** OpenAPI/Swagger (خودکار از دکوراتورهای NestJS)
- **Containerization:** Docker + Docker Compose

## Development Tools
- **Linting:** ESLint + Prettier
- **Git Hooks:** Husky + lint-staged
- **Validation:** Zod + class-validator

---

# Project Structure

```
napolitan.v2/
├── docker/
│   └── Dockerfile
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── src/
│   ├── common/
│   │   ├── dto/
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   └── interceptors/
│   │       └── success.interceptor.ts
│   ├── config/
│   │   └── configuration.ts
│   ├── modules/
│   │   ├── auth/
│   │   ├── health/
│   │   ├── inventory/
│   │   ├── kitchen/
│   │   ├── notifications/
│   │   ├── orders/
│   │   ├── reporting/
│   │   └── users/
│   ├── app.module.ts
│   └── main.ts
├── docker-compose.yml
├── .env
├── .env.example
└── package.json
```

---

# API Base URL
```
/api/v1
```

# Available Endpoints (Phase 0)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /docs | Swagger documentation |
