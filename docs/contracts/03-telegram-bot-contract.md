# Telegram Bot Contract API

## Overview

Telegram Bot provides an alternative channel for customers to interact with the restaurant through the popular messaging platform. The bot acts as a thin client that translates user commands to API calls.

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Telegram  │────▶│   Bot API   │────▶│   Napolitan │
│   User      │◀────│   Server    │◀────│   Backend   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   API Key   │
                    │  (Telegram) │
                    └─────────────┘
```

## Authentication

The Telegram Bot uses a dedicated API Key with specific permissions:

- **API Key Name**: `telegram-bot`
- **Permissions**: `READ` (menu browsing), `WRITE` (order creation)

### Bot Configuration

```env
TELEGRAM_BOT_TOKEN=123456:ABC-DEF
NAPOLITAN_API_URL=https://api.napolitan.com
NAPOLITAN_API_KEY=nk_xxxxxxxxxxxx
```

---

## Bot Commands

### User Commands

| Command | Description | API Call |
|---------|-------------|----------|
| `/start` | Start conversation | - |
| `/menu` | Show main menu | GET /menu |
| `/order` | Start new order | POST /orders |
| `/status` | Track current order | GET /orders?status=pending |
| `/help` | Show help | - |

### Admin Commands (Manager/Admin only)

| Command | Description | API Call |
|---------|-------------|----------|
| `/admin orders` | View active orders | GET /orders |
| `/admin stats` | Today's statistics | GET /analytics/dashboard |

---

## API Integration

### 1. Browse Menu

```
Bot Action: User sends "/menu" or clicks "📋 Menu" button
```

```javascript
// Bot Server → Napolitan API
GET /api/v1/menu?available=true

// Response Processing
const menuMessage = categories.map(cat => `
🍕 ${cat.name}

${cat.items.map(item => `
${item.name}
💰 $${item.price.toFixed(2)}
${item.description}
`).join('\n')}
`).join('\n\n');
```

**Telegram Response Format**
```
🍕 Pizza

Margherita Pizza
💰 $12.99
Classic tomato, mozzarella, basil

Pepperoni Pizza
💰 $14.99
Tomato sauce, mozzarella, pepperoni
```

---

### 2. Place Order

```
Bot Action: User sends "/order" → Selects items → Confirms
```

```javascript
// Bot Server → Napolitan API
POST /api/v1/orders
{
  "type": "delivery",
  "items": [
    { "menuItemId": "uuid", "quantity": 2 }
  ],
  "contactPhone": "+1234567890",
  "notes": "Extra napkins"
}
```

**Inline Keyboard Response**
```
Order Summary:
1x Margherita Pizza - $12.99
2x Pepsi - $6.00
─────────────────
Total: $18.99

[✅ Confirm] [❌ Cancel]
```

---

### 3. Order Status

```
Bot Action: User sends "/status" or clicks "📦 My Order"
```

```javascript
// Bot Server → Napolitan API
GET /api/v1/orders?status=PENDING,CONFIRMED,PREPARING

// Filter by user's phone number (stored in bot context)
```

**Status Response**
```
📦 Your Order #ORD-2024-001

Status: 🔥 Preparing

Items:
1x Margherita Pizza
2x Pepsi

Estimated: 15-20 mins
```

---

## Webhook Events

Configure bot to receive events:

### order.status_changed

```javascript
// Napolitan Backend → Bot Server (Webhook)
{
  "event": "order.status_changed",
  "data": {
    "orderId": "uuid",
    "previousStatus": "PREPARING",
    "newStatus": "READY",
    "tableNumber": null,
    "type": "delivery"
  }
}
```

**Bot Action**: Send Telegram message to customer

```
🍕 Your order is ready!

Order #ORD-2024-001 is ready for pickup/delivery.

[Track Order](https://t.me/napolitanbot?start=order_uuid)
```

---

### payment.success

```javascript
// Napolitan Backend → Bot Server (Webhook)
{
  "event": "payment.success",
  "data": {
    "receiptId": "uuid",
    "receiptNumber": "RCP-2024-001",
    "orderId": "uuid",
    "amount": 18.99,
    "paymentMethod": "CARD"
  }
}
```

---

## Security

### Telegram Verification

Verify requests from Telegram:

```javascript
function verifyTelegramRequest(initData) {
  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(BOT_TOKEN)
    .digest();
  
  const hash = crypto
    .createHmac('sha256', secretKey)
    .update(initData)
    .digest('hex');
  
  return hash === initData.hash;
}
```

### API Key Rotation

- Store API Key securely (Environment variable)
- Rotate every 90 days
- Monitor usage for anomalies

---

## Error Handling

| API Error | Telegram Response |
|-----------|------------------|
| Item unavailable | "Sorry, this item is currently unavailable. Choose another?" |
| Invalid order | "There was an error processing your order. Please try again." |
| Payment failed | "Payment could not be processed. Please try again or use cash." |

---

## Menu Formatting

### Text Format (Simple)

```
🍕 {Category Name}

• {Item Name}
  💰 ${price}
  {description}

─────────────────
```

### Inline Keyboard (Ordering)

```javascript
const keyboard = {
  inline_keyboard: [
    [{ text: '🍕 Pizza', callback_data: `cat_${categoryId}` }],
    [{ text: '🥤 Drinks', callback_data: `cat_${categoryId}` }],
    [{ text: '🛒 View Cart', callback_data: 'cart' }],
    [{ text: '📦 Checkout', callback_data: 'checkout' }]
  ]
};
```

---

## Future Extensions

### Potential Enhancements
1. **Mini App**: Telegram Mini App for full menu experience
2. **Payment**: Telegram Stars or payment integration
3. **Location**: Send restaurant/delivery location
4. **Reviews**: Post-delivery rating request
5. **Loyalty**: Points tracking via bot
6. **Notifications**: Order reminders, special offers
7. **Multilingual**: Language selection command
