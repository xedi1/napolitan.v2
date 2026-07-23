# Mobile App Contract API

## Overview

Mobile App provides a native experience for customers on iOS and Android devices. It consumes the same REST API as all other clients without any mobile-specific business logic.

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  iOS App    │────▶│   REST API  │────▶│   Database  │
│  Android    │     │   Gateway   │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  WebSocket │
                    │  Gateway   │
                    └─────────────┘
```

## Key Principle

> **The Mobile App is a consumer of existing APIs. No new endpoints are required for mobile-specific functionality.**

---

## Authentication Flow

### 1. Email/Password Login

```swift
// Swift (iOS)
let response = try await api.post("/auth/login", body: [
  "email": email,
  "password": password
])
let token = response["data"]["token"]
```

```kotlin
// Kotlin (Android)
val response = api.post("/auth/login") {
  body = mapOf("email" to email, "password" to password)
}
val token = response["data"]["token"]
```

### 2. Token Storage

```swift
// iOS - Keychain
KeychainHelper.save(token, forKey: "auth_token")

// Android - EncryptedSharedPreferences
val encryptedPrefs = EncryptedSharedPreferences.create(...)
encryptedPrefs.edit().putString("token", token).apply()
```

### 3. Token Refresh

```swift
// iOS - Automatic refresh via interceptor
AuthInterceptor.shared.tryRefresh { newToken in
  KeychainHelper.save(newToken, forKey: "auth_token")
}
```

---

## API Endpoints by Feature

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/register | Register new customer |
| POST | /auth/login | Login |
| POST | /auth/refresh | Refresh token |
| GET | /auth/me | Get current user |

### Menu (Public - No Auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /categories | List categories |
| GET | /menu | List menu items |
| GET | /menu/{id} | Get item details |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /orders | Create order |
| GET | /orders | List orders |
| GET | /orders/{id} | Get order details |
| PATCH | /orders/{id}/status | Update status |
| DELETE | /orders/{id} | Cancel order |

### Tables
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /tables | List tables |
| GET | /tables/{id} | Get table details |
| POST | /tables/{id}/reserve | Reserve table |
| POST | /tables/{id}/release | Release table |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /receipts | Create payment |
| GET | /receipts | List receipts |
| GET | /receipts/{id} | Get receipt |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /notifications | List notifications |
| PATCH | /notifications/{id}/read | Mark as read |

---

## Real-time Updates

### WebSocket Connection

```swift
// iOS
class WebSocketManager {
  func connect(token: String) {
    let socket = WebSocket("wss://api.napolitan.com/socket.io")
    socket.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
    socket.onText = { [weak self] text in
      self?.handleMessage(text)
    }
  }
}
```

```kotlin
// Android
class WebSocketClient {
  fun connect(token: String) {
    val client = OkHttpClient()
    val request = Request.Builder()
      .url("wss://api.napolitan.com/socket.io")
      .addHeader("Authorization", "Bearer $token")
      .build()
    client.newWebSocket(request, WebSocketListener())
  }
}
```

### Events to Subscribe

| Event | Payload | App Action |
|-------|---------|------------|
| `order.created` | orderId, items | Add to active orders |
| `order.updated` | orderId, status | Update order card |
| `notification:new` | notification | Show push notification |
| `dashboard.update` | metrics | Update badge counts |

---

## Push Notifications

### Backend Events → FCM/APNS

```javascript
// Notification Service
async function sendPushNotification(userId, event, data) {
  const user = await getUser(userId);
  
  if (event === 'order.status_changed') {
    await fcm.send({
      token: user.fcmToken,
      notification: {
        title: 'Order Update 🍕',
        body: `Your order is now ${data.newStatus}`,
      },
      data: { orderId: data.orderId }
    });
  }
}
```

### Mobile Registration

```swift
// iOS - AppDelegate
func application(_ application: UIApplication, 
                 didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
  let token = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
  api.post("/users/push-token", body: ["token": token, "platform": "ios"])
}
```

```kotlin
// Android - FirebaseMessagingService
override fun onNewToken(token: String) {
  api.post("/users/push-token") {
    body = mapOf("token" to token, "platform" to "android")
  }
}
```

---

## Offline Support

### Local Caching

```swift
// iOS - Cache menu locally
class MenuCache {
  func saveMenu(_ items: [MenuItem]) {
    UserDefaults.standard.set(try? JSONEncoder().encode(items), forKey: "cached_menu")
  }
  
  func getCachedMenu() -> [MenuItem]? {
    guard let data = UserDefaults.standard.data(forKey: "cached_menu") else { return nil }
    return try? JSONDecoder().decode([MenuItem].self, from: data)
  }
}
```

```kotlin
// Android - Room Database
@Entity
class CachedMenuItem {
  @PrimaryKey val id: String
  val name: String
  val price: Double
  val cachedAt: Long
}
```

### Sync Strategy

1. On app launch: Show cached data immediately
2. Fetch fresh data in background
3. Update UI when fresh data arrives
4. Handle conflict with server as source of truth

---

## Deep Linking

### URL Scheme

```
napolitan://order/{orderId}
napolitan://menu
napolitan://tables
```

### Universal Links (iOS) / App Links (Android)

```
https://napolitan.com/order/{orderId}
https://napolitan.com/menu
```

---

## Security

### Certificate Pinning

```swift
// iOS - URLSession
let session = URLSession(configuration: .default, delegate: SSLPinningDelegate(), delegateQueue: nil)
```

```kotlin
// Android - OkHttp
val certificatePinner = CertificatePinner.Builder()
  .add("api.napolitan.com", "sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=")
  .build()
```

### Biometric Authentication

```swift
// iOS - Face ID / Touch ID for payments
let context = LAContext()
context.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, ...) { success, error in
  // Verify and proceed with sensitive operation
}
```

```kotlin
// Android - BiometricPrompt
val executor = ContextCompat.getMainExecutor(this)
val biometricPrompt = BiometricPrompt(this, executor, callback)
biometricPrompt.authenticate(promptInfo)
```

---

## Performance

### Image Optimization

```swift
// iOS - SDWebImage
imageView.sd_setImage(with: URL(string: item.imageUrl), 
                      placeholderImage: UIImage(named: "placeholder"))
```

```kotlin
// Android - Coil
imageView.load(item.imageUrl) {
  placeholder(R.drawable.placeholder)
  crossfade(true)
}
```

### API Response Caching

```
Cache-Control: public, max-age=300, stale-while-revalidate=600
```

---

## Future Extensions

### Potential Enhancements
1. **Apple Pay / Google Pay**: Native payment integration
2. **Wallet**: Store loyalty points, gift cards
3. **Social Login**: Apple Sign-in, Google Sign-in
4. **Widget**: Home screen order status widget
5. **Watch App**: Order tracking on Apple Watch
6. **Siri Shortcuts**: "Hey Siri, order my usual"
7. **Augmented Reality**: AR menu preview
