# QR Menu Contract API

## Overview

QR Menu is a customer-facing menu page that allows customers to browse the restaurant menu without requiring authentication. It provides read-only access to menu items and table information.

## Authentication

**Not required** - QR Menu is public and does not require authentication.

## Rate Limiting

- Public endpoint: No rate limit (consider caching)
- Recommended: Cache responses for 5 minutes

---

## Endpoints

### GET /api/v1/categories

Retrieve all active menu categories.

**Response**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Appetizers",
      "description": "Start your meal right",
      "sortOrder": 1,
      "isActive": true
    }
  ]
}
```

---

### GET /api/v1/menu

Retrieve all available menu items. Optionally filter by category.

**Query Parameters**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| categoryId | string | No | Filter by category ID |
| available | boolean | No | Filter by availability (default: true) |

**Response**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Margherita Pizza",
      "description": "Classic tomato, mozzarella, basil",
      "price": 12.99,
      "categoryId": "uuid",
      "category": {
        "id": "uuid",
        "name": "Pizza"
      },
      "isAvailable": true,
      "image": "https://..."
    }
  ]
}
```

---

### GET /api/v1/tables/{id}

Retrieve specific table information (for table-specific QR codes).

**Response**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tableNumber": 5,
    "capacity": 4,
    "status": "AVAILABLE"
  }
}
```

---

## Implementation Notes

### Table-Specific QR Codes

Each table can have its own QR code that links to:
```
https://app.napolitan.com/menu?tableId={tableId}
```

The `tableId` parameter allows:
- Pre-selecting the table for ordering
- Tracking which table placed orders
- Table-specific promotions

### Caching Strategy

```javascript
// Recommended caching headers
Cache-Control: public, max-age=300 // 5 minutes
ETag: "hash-of-content"
```

### Mobile Optimization

- Use responsive images with srcset
- Implement lazy loading for images
- Optimize for touch interactions
- Consider offline-first with service workers

---

## Error Responses

```json
{
  "success": false,
  "message": "Category not found",
  "statusCode": 404
}
```

---

## Future Extensions

### Potential Enhancements
1. **Multi-language support**: Add `Accept-Language` header handling
2. **Dietary filters**: Add query params for vegetarian, gluten-free
3. ** allergen information**: Extend menu item model
4. **Nutritional info**: Add calorie count, macros
5. **Reviews/Ratings**: Add customer ratings endpoint
