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
- [x] فاز ۲: Menu & Table Management (✅ انجام شد)
- [x] فاز ۳: Real-Time Order Management & Kitchen (✅ انجام شد)
- [x] فاز ۴: Cashier & Custom Receipt System (✅ انجام شد)
- [x] فاز ۵: Inventory & Employee Management (✅ انجام شد)
- [x] فاز ۶: Reports & Analytics (✅ انجام شد)
- [x] فاز ۷: Notifications & Event-Driven Architecture (✅ انجام شد)
- [x] فاز ۸: Automation & Integrations (✅ انجام شد)
- [ ] فاز ۹: ...

---

# Phase 8: Automation & Integrations

## API Key Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /integrations/api-keys | Create API Key |
| GET | /integrations/api-keys | List all keys |
| DELETE | /integrations/api-keys/:id | Revoke key |

## API Key Permissions
- READ: 100 requests/minute
- WRITE: 50 requests/minute
- ADMIN: 200 requests/minute

## Webhook Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /integrations/webhooks | Create Webhook |
| GET | /integrations/webhooks | List webhooks |
| GET | /integrations/webhooks/:id | Get webhook |
| PATCH | /integrations/webhooks/:id | Update webhook |
| DELETE | /integrations/webhooks/:id | Delete webhook |
| GET | /integrations/webhooks/:id/logs | Get delivery logs |

## Webhook Security
- HMAC-SHA256 Signature: `t=timestamp,v1=signature`
- Signature verification with timestamp tolerance (5 min)
- Retry with Exponential Backoff: 1s, 5s, 30s

## Rate Limiting
- Per API Key rate limiting
- Configurable limits per permission level
- Rate limit headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`

## API Versioning
- All endpoints under `/api/v1/*`
- OpenAPI/Swagger documentation auto-generated

---

# Phase 7: Notifications & Event-Driven Architecture

## Event Catalog

### Order Events
| Event | Payload | Listeners |
|-------|---------|-----------|
| `order.created` | orderId, tableNumber, items, createdBy | Kitchen, Analytics, Notifications, AuditLog |
| `order.status_changed` | orderId, previousStatus, newStatus, tableNumber | Kitchen, Notifications, AuditLog |

### Payment Events
| Event | Payload | Listeners |
|-------|---------|-----------|
| `payment.success` | receiptId, receiptNumber, orderId, totalAmount, paymentMethod | Dashboard, Analytics, Notifications, AuditLog |
| `receipt.issued` | receiptId, receiptNumber, totalAmount | Notifications, AuditLog |

### Inventory Events
| Event | Payload | Listeners |
|-------|---------|-----------|
| `inventory.low_stock` | items[], timestamp | Dashboard, Notifications, AuditLog |

### Dashboard Events
| Event | Payload | Listeners |
|-------|---------|-----------|
| `dashboard.update` | type, data | Dashboard WebSocket |

## Notification Types
- ORDER_NEW, ORDER_STATUS_CHANGED, PAYMENT_SUCCESS
- INVENTORY_LOW_STOCK, RECEIPT_ISSUED, SYSTEM_ALERT

## Notification Recipients
- ALL, KITCHEN, CASHIER, MANAGER, ADMIN

## Audit Log Actions
- CREATE, UPDATE, DELETE, LOGIN, LOGOUT, PAYMENT
- ORDER_CREATE, ORDER_UPDATE

## Endpoints
### Notifications (`/api/v1/notifications`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /notifications | List all |
| GET | /notifications/unread | Unread only |
| GET | /notifications/unread/count | Unread count |
| PATCH | /notifications/:id/read | Mark as read |
| PATCH | /notifications/read-all | Mark all as read |

### Audit Logs (`/api/v1/logs`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /logs | List with filters |
| GET | /logs/recent | Recent logs |
| GET | /logs/entity/:type/:id | Entity history |
| GET | /logs/user/:userId | User activity |

## Acceptance Criteria
- ✅ All modules communicate through Event Bus
- ✅ All key events are recorded in Audit Log
- ✅ BullMQ integration ready for Redis

---

# Phase 6: Reports & Analytics

## Reports Module (`/api/v1/reports`)
| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | /reports/sales | Sales report | ADMIN, MANAGER |
| GET | /reports/top-items | Top/bottom selling items | ADMIN, MANAGER |
| GET | /reports/peak-hours | Peak hours analysis | ADMIN, MANAGER |

## Analytics Module (`/api/v1/analytics`)
| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | /analytics/dashboard | Real-time dashboard data | ADMIN, MANAGER |

## Dashboard Data
- todayRevenue, todayOrders, avgOrderValue
- activeOrders, tablesOccupied, occupancyRate
- lowStockItems count
- Revenue comparison: vsYesterday, vsLastWeek
- recentOrders, topSellingItems

## Event-Driven Updates
- `order.created` → Recalculates dashboard
- `payment.success` → Recalculates dashboard
- `dashboard.update` → Broadcasts to dashboard room

## Analytics Cache Models
- **DailyAnalytics:** date, totalOrders, totalRevenue, totalItemsSold, avgOrderValue
- **MenuItemSales:** menuItemId, date, quantitySold, revenue

## Acceptance Criteria
- ✅ Sales report works with date range filters
- ✅ Dashboard updates in real-time without refresh

---

# Phase 5: Inventory & Employee Management

## Inventory Models
- **InventoryItem:** name, unit (KG/GRAM/LITER/ML/PIECE/CUP/SPOON), currentStock, alertLevel, isActive
- **Recipe:** Links menu items to ingredients
- **RecipeItem:** inventoryItemId, quantity consumed per order

## Employee Model
- **Fields:** firstName, lastName, email, phone, role, position, hourlyRate, isActive, hireDate, shiftStatus
- **ShiftStatus:** OFF, ON_DUTY, BREAK

## Inventory Module (`/api/v1/inventory`)
| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | /inventory | List all items | ADMIN, MANAGER |
| GET | /inventory/low-stock | Low stock items | ADMIN, MANAGER |
| GET | /inventory/:id | Get by ID | ADMIN, MANAGER |
| POST | /inventory | Create item | ADMIN, MANAGER |
| PATCH | /inventory/:id | Update item | ADMIN, MANAGER |
| POST | /inventory/:id/add-stock | Add stock | ADMIN, MANAGER |
| GET | /inventory/recipes | List recipes | ADMIN, MANAGER |
| POST | /inventory/recipes | Create recipe | ADMIN, MANAGER |
| PATCH | /inventory/recipes/:id | Update recipe | ADMIN, MANAGER |

## Employee Module (`/api/v1/employees`)
| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | /employees | List all | ADMIN, MANAGER |
| GET | /employees/on-duty | On duty only | ADMIN, MANAGER, STAFF |
| GET | /employees/:id | Get by ID | ADMIN, MANAGER |
| POST | /employees | Create | ADMIN |
| PATCH | /employees/:id | Update | ADMIN, MANAGER |
| PATCH | /employees/:id/shift | Update shift | ADMIN, MANAGER |

## Event-Driven Inventory
- `order.created` → Automatic inventory consumption based on Recipe
- `inventory.low_stock` → Emitted when stock falls below alert level

## Acceptance Criteria
- ✅ Order creation automatically deducts inventory based on Recipe
- ✅ Low stock triggers inventory.low_stock event

---

# Phase 4: Cashier & Custom Receipt System

## Receipt Model
- **Format:** `NP-YYYY-NNNNN` (e.g., `NP-2026-00001251`)
- **Fields:** receiptNumber, orderId, totalAmount, paymentMethod, paidAt, receiptUrl, qrCodeData

## Payment Methods
- `CASH` - Cash payment
- `CARD` - Card payment
- `ONLINE` - Online payment

## Receipts Module (`/api/v1/receipts`)
| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| POST | /receipts | Create receipt for served order | ADMIN, MANAGER, STAFF |
| GET | /receipts | List all receipts | ADMIN, MANAGER, STAFF |
| GET | /receipts/by-number/:receiptNumber | Get by receipt number | ADMIN, MANAGER, STAFF |
| GET | /receipts/:id | Get receipt by ID | ADMIN, MANAGER, STAFF |
| GET | /receipts/:id/pdf | Download receipt PDF | ADMIN, MANAGER, STAFF |
| GET | /receipts/:id/qr | Get QR code | ADMIN, MANAGER, STAFF |

## Services
- **ReceiptNumberService:** Generates unique sequential IDs with `FOR UPDATE` locking
- **PdfGeneratorService:** Generates printable PDF receipts
- **QrGeneratorService:** Generates QR codes linking to online receipts

## Event Bus Events
- `payment.success` - Broadcasts to cashier and dashboard on successful payment

## Acceptance Criteria
- ✅ Each receipt has a unique, non-repeating ID
- ✅ Old receipts can be reprinted using their ID
- ✅ QR code points to correct online link

---

# Phase 3: Real-Time Order Management & Kitchen

## Order State Machine
```
pending → confirmed → preparing → ready → served → paid
                ↘ cancelled
```

## Orders Module (`/api/v1/orders`)
| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | /orders | List all orders | ADMIN, MANAGER, STAFF, KITCHEN |
| GET | /orders/:id | Get order by ID | ADMIN, MANAGER, STAFF, KITCHEN |
| POST | /orders | Create new order | ADMIN, MANAGER, STAFF |
| PATCH | /orders/:id | Update order notes | ADMIN, MANAGER, STAFF |
| PATCH | /orders/:id/status | Update order status | ADMIN, MANAGER, STAFF, KITCHEN |
| DELETE | /orders/:id | Delete order | ADMIN |

## Kitchen Module (`/api/v1/kitchen`)
| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | /kitchen/orders | Get active kitchen orders | ADMIN, MANAGER, KITCHEN |
| PATCH | /kitchen/orders/:id/confirm | Confirm pending order | ADMIN, MANAGER, KITCHEN |
| PATCH | /kitchen/orders/:id/start | Start preparing | ADMIN, MANAGER, KITCHEN |
| PATCH | /kitchen/orders/:id/ready | Mark as ready | ADMIN, MANAGER, KITCHEN |
| PATCH | /kitchen/orders/:id/cancel | Cancel order | ADMIN, MANAGER, KITCHEN |

## WebSocket Gateway (`/orders`)
### Rooms: `kitchen`, `cashier`, `dashboard`

### Events:
| Event | Room | Description |
|-------|------|-------------|
| `order:new` | kitchen, cashier, dashboard | New order created |
| `order:status_changed` | kitchen | Order confirmed/preparing/ready/cancelled |
| `order:status_changed` | cashier | Order ready/served/paid/cancelled |
| `order:status_changed` | dashboard | All status changes |

### Client Events:
- `joinRoom` - Join a room (kitchen/cashier/dashboard)
- `leaveRoom` - Leave a room

## Event Bus Events
- `order.created` - Internal event when order is created
- `order.status_changed` - Internal event when order status changes

## Acceptance Criteria
- ✅ New order appears on kitchen display without refresh
- ✅ Status change by kitchen is immediately visible at cashier
- ✅ Latency between event and client receive is under 1 second

---

# Phase 2: Menu & Table Management

## Implemented Features

### Categories Module (`/api/v1/categories`)
| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | /categories | List all categories | Yes | ADMIN, MANAGER, STAFF |
| GET | /categories/:id | Get category by ID | Yes | ADMIN, MANAGER, STAFF |
| POST | /categories | Create category | Yes | ADMIN, MANAGER |
| PATCH | /categories/:id | Update category | Yes | ADMIN, MANAGER |
| DELETE | /categories/:id | Delete category (soft) | Yes | ADMIN |

### Menu Module (`/api/v1/menu`)
| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | /menu | List all menu items | Yes | All roles |
| GET | /menu/:id | Get menu item by ID | Yes | All roles |
| POST | /menu | Create menu item | Yes | ADMIN, MANAGER |
| PATCH | /menu/:id | Update menu item | Yes | ADMIN, MANAGER |
| DELETE | /menu/:id | Delete menu item (soft) | Yes | ADMIN |

### Tables Module (`/api/v1/tables`)
| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | /tables | List all tables | Yes | ADMIN, MANAGER, STAFF |
| GET | /tables/:id | Get table by ID | Yes | ADMIN, MANAGER, STAFF |
| POST | /tables | Create table | Yes | ADMIN, MANAGER |
| PATCH | /tables/:id | Update table | Yes | ADMIN, MANAGER |
| PATCH | /tables/:id/status | Update table status | Yes | ADMIN, MANAGER, STAFF |
| DELETE | /tables/:id | Delete table | Yes | ADMIN |

### Data Models

**Category**
- id, name, description, displayOrder, isActive

**MenuItem**
- id, name, description, price, imageUrl, isAvailable, isActive
- Belongs to Category

**Table**
- id, tableNumber, capacity, status
- Status: EMPTY, RESERVED, OCCUPIED

### Acceptance Criteria
- ✅ Menu item availability change reflects immediately in API response
- ✅ Table status can be changed via API

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
| PATCH | /users/:id | Update user | Yes | ADMIN |
| DELETE | /users/:id | Delete user (soft) | Yes | ADMIN |

### Roles Module (`/api/v1/roles`)
| Method | Endpoint | Description | Auth Required | Roles |
|--------|----------|-------------|---------------|-------|
| GET | /roles | Get all roles | Yes | ADMIN, MANAGER |

### User Roles
- `ADMIN` - Full system access
- `MANAGER` - Manage staff and view reports
- `STAFF` - Regular staff member
- `KITCHEN` - Kitchen staff access

### Security Features
- JWT Access Token (15 minutes)
- JWT Refresh Token (7 days)
- Password hashing with bcrypt
- Role-Based Access Control (RBAC)
- Rate Limiting:
  - Login: 5 attempts/minute
  - Register: 3 attempts/minute
  - Other endpoints: 100 requests/minute

### Unit Tests
- 12 unit tests for Auth module (all passing)
  - AuthService: login, register, refreshToken
  - AuthController: login, register, refresh, logout

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
