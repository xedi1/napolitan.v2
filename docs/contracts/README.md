# Future-Ready Extensions - API Contracts

This directory contains API contracts for future extensions. Each contract documents the endpoints, authentication requirements, and integration patterns for that extension.

## Contracts Index

| Contract | Description | Auth Required | Extension |
|----------|-------------|---------------|-----------|
| [01-qr-menu-contract.md](./01-qr-menu-contract.md) | Customer-facing menu page | No | QR Menu |
| [02-delivery-app-contract.md](./02-delivery-app-contract.md) | Delivery ordering system | Yes (Customer) | Delivery App |
| [03-telegram-bot-contract.md](./03-telegram-bot-contract.md) | Telegram bot integration | Yes (API Key) | Telegram Bot |
| [04-mobile-app-contract.md](./04-mobile-app-contract.md) | iOS/Android native app | Yes (Customer) | Mobile App |

---

## Quick Reference

### Extension → Contract Mapping

```
┌─────────────────┐     ┌──────────────────────────────────────┐
│    Extension    │────▶│              Contract                │
├─────────────────┤     ├──────────────────────────────────────┤
│  QR Menu        │────▶│  01-qr-menu-contract.md               │
│                 │     │  Endpoints: GET /menu, GET /categories│
├─────────────────┤     ├──────────────────────────────────────┤
│  Delivery App   │────▶│  02-delivery-app-contract.md         │
│                 │     │  Endpoints: POST /orders (type=...)  │
├─────────────────┤     ├──────────────────────────────────────┤
│  Telegram Bot   │────▶│  03-telegram-bot-contract.md         │
│                 │     │  Endpoints: All, via API Key         │
├─────────────────┤     ├──────────────────────────────────────┤
│  Mobile App     │────▶│  04-mobile-app-contract.md           │
│                 │     │  Endpoints: All, native client       │
└─────────────────┘     └──────────────────────────────────────┘
```

### Common Endpoints Used

| Endpoint | QR Menu | Delivery | Telegram | Mobile |
|----------|---------|----------|----------|--------|
| GET /categories | ✅ | ✅ | ✅ | ✅ |
| GET /menu | ✅ | ✅ | ✅ | ✅ |
| POST /orders | ❌ | ✅ | ✅ | ✅ |
| GET /orders | ❌ | ✅ | ✅ | ✅ |
| POST /receipts | ❌ | ✅ | ❌ | ✅ |
| GET /notifications | ❌ | ❌ | ❌ | ✅ |
| WebSocket events | ❌ | ✅ | ✅ | ✅ |

---

## Implementation Checklist

### Before Starting Any Extension

1. ✅ System core is complete (Phases 0-9)
2. ✅ API Key system is in place (Phase 8)
3. ✅ WebSocket infrastructure ready (Phase 3)
4. ✅ All business logic in backend (no mobile/web-specific code in apps)

### Extension Readiness

| Extension | Prerequisites | Ready to Start |
|-----------|---------------|-----------------|
| QR Menu | Public menu API | ✅ Ready |
| Delivery App | Customer auth, WebSocket | ✅ Ready |
| Telegram Bot | API Key (Phase 8) | ✅ Ready |
| Mobile App | Full API access | ✅ Ready |

---

## Design Principles

1. **No Core Changes**: Extensions consume existing APIs
2. **Backward Compatible**: New features extend, don't modify
3. **Consistent Auth**: JWT for users, API Key for services
4. **Real-time Ready**: WebSocket support built-in
5. **Secure**: All endpoints follow same security patterns

---

## Next Steps

When ready to implement any extension:

1. Read the corresponding contract document
2. Create API Key if needed (via Admin Panel)
3. Implement client following contract specifications
4. Test against staging environment
5. Deploy and monitor
