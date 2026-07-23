# Delivery App Contract API

## Overview

Delivery App enables customers to place delivery orders through a website or mobile app. Orders are created using the same `POST /orders` endpoint with `type: delivery` flag.

## Authentication

### Customer Authentication
- JWT token required for authenticated customers
- Customer account created on first order or via explicit registration

### API Key Authentication
- Delivery App backend uses its own API Key (see Phase 8)
- Required scopes: `READ`, `WRITE`

---

## Customer Flow

```
1. Customer Login/Register
   └── POST /auth/login OR POST /auth/register

2. Browse Menu (Public)
   └── GET /menu, GET /categories

3. Create Delivery Order
   └── POST /orders (type: delivery)

4. Payment
   └── POST /receipts (payment.success event triggered)

5. Track Order
   └── WebSocket subscription OR polling GET /orders/{id}
```

---

## Endpoints

### POST /api/v1/auth/register

Register a new customer account.

**Request**
```json
{
  "email": "customer@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "token": "jwt-token",
    "user": {
      "id": "uuid",
      "email": "customer@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "CUSTOMER"
    }
  }
}
```

---

### POST /api/v1/auth/login

Authenticate customer.

**Request**
```json
{
  "email": "customer@example.com",
  "password": "securePassword123"
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "token": "jwt-token",
    "user": { ... }
  }
}
```

---

### POST /api/v1/orders

Create a delivery order.

**Request**
```json
{
  "type": "delivery",
  "items": [
    {
      "menuItemId": "uuid",
      "quantity": 2,
      "notes": "Extra cheese"
    },
    {
      "menuItemId": "uuid",
      "quantity": 1
    }
  ],
  "deliveryAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "instructions": "Ring doorbell twice"
  },
  "contactPhone": "+1234567890",
  "notes": "Please include napkins"
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "orderNumber": "ORD-2024-001",
    "type": "delivery",
    "status": "PENDING",
    "items": [...],
    "totalAmount": 45.99,
    "estimatedDeliveryTime": "30-45 minutes",
    "createdAt": "2024-01-15T12:00:00Z"
  }
}
```

---

### GET /api/v1/orders/{id}

Track order status.

**Response**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "orderNumber": "ORD-2024-001",
    "status": "PREPARING",
    "statusHistory": [
      { "status": "PENDING", "timestamp": "..." },
      { "status": "CONFIRMED", "timestamp": "..." },
      { "status": "PREPARING", "timestamp": "..." }
    ],
    "estimatedDeliveryTime": "30-45 minutes",
    "items": [...],
    "totalAmount": 45.99
  }
}
```

---

### GET /api/v1/orders

List customer orders.

**Query Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| status | string | No | Filter by status |
| limit | number | No | Max results (default: 20) |
| offset | number | No | Pagination offset |

**Response**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "orderNumber": "ORD-2024-001",
      "type": "delivery",
      "status": "DELIVERED",
      "totalAmount": 45.99,
      "createdAt": "2024-01-15T12:00:00Z"
    }
  ],
  "meta": {
    "total": 15,
    "limit": 20,
    "offset": 0
  }
}
```

---

### POST /api/v1/receipts

Process payment for delivery order.

**Request**
```json
{
  "orderId": "uuid",
  "paymentMethod": "CARD"
}
```

**Response**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "receiptNumber": "RCP-2024-001",
    "orderId": "uuid",
    "totalAmount": 45.99,
    "paymentMethod": "CARD",
    "paidAt": "2024-01-15T12:05:00Z"
  }
}
```

---

## WebSocket Events

Subscribe to order updates:

```javascript
socket.emit('subscribe', { orderId: 'uuid' });
socket.on('order:status_changed', (data) => {
  // { orderId, status, estimatedTime }
});
```

### Order Status Flow
```
PENDING → CONFIRMED → PREPARING → READY → OUT_FOR_DELIVERY → DELIVERED
                    ↘ CANCELLED
```

---

## Error Responses

| Status | Message | Action |
|--------|---------|--------|
| 400 | Invalid items | Show validation errors |
| 401 | Unauthorized | Redirect to login |
| 402 | Payment failed | Retry or use different method |
| 409 | Order already paid | Fetch existing receipt |
| 422 | Item unavailable | Suggest alternatives |
| 503 | Kitchen busy | Suggest later time |

---

## Webhook Events

Configure webhooks for delivery app:

| Event | Payload | Use Case |
|-------|---------|----------|
| `order.status_changed` | orderId, status | Update tracking UI |
| `order.created` | orderId, total | Log order |
| `receipt.issued` | receiptId, amount | Confirm payment |

---

## Future Extensions

### Potential Enhancements
1. **Driver Assignment**: Add driver tracking endpoint
2. **Real-time Location**: WebSocket GPS updates for driver
3. **Order Modifications**: Allow edits before preparation
4. **Reorder**: One-click reorder from history
5. **Scheduled Orders**: Future delivery scheduling
6. **Split Bills**: Multiple payment methods
7. **Tips**: Add tip amount to payment
