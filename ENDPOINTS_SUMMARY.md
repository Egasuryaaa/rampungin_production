# RAMPUNGIN API - Quick Reference

## Base URL

```
http://localhost:3000/api
```

## Authentication

All protected endpoints require JWT token in header:

```
Authorization: Bearer {your_token_here}
```

---

## 🔓 PUBLIC ENDPOINTS (No Auth)

### 1. Register

```
POST /api/auth/register
```

**Body (JSON):**

```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "nama_lengkap": "John Doe",
  "no_telp": "08123456789",
  "role": "client", // or "tukang"
  "kota": "Jakarta"
}
```

### 2. Login

```
POST /api/auth/login
```

**Body (JSON):**

```json
{
  "username": "johndoe", // or use "email"
  "password": "password123"
}
```

---

## 🔐 AUTH ENDPOINTS (Protected)

### 3. Get Current User

```
GET /api/auth/me
```

### 4. Logout

```
POST /api/auth/logout
```

### 5. Change Password

```
POST /api/auth/change-password
```

**Body:**

```json
{
  "old_password": "old123",
  "new_password": "new123",
  "confirm_password": "new123"
}
```

---

## 👤 CLIENT ENDPOINTS (Role: client)

### Profile

```
GET    /api/client/profile
PUT    /api/client/profile
```

### Categories

```
GET    /api/client/categories
```

### Browse & Search Tukang

```
GET    /api/client/tukang?kategori_id=1&kota=Jakarta
GET    /api/client/tukang/:tukang_id
GET    /api/client/search-tukang?keyword=listrik
```

### Booking & Transactions

```
POST   /api/client/booking
GET    /api/client/transactions
GET    /api/client/transactions/:transaksi_id
PUT    /api/client/transactions/:transaksi_id/cancel
```

### Top-up

```
POST   /api/client/topup          (multipart: jumlah, bukti_pembayaran)
GET    /api/client/topup
```

### Rating & Stats

```
POST   /api/client/rating
GET    /api/client/statistics
```

---

## 🔨 TUKANG ENDPOINTS (Role: tukang)

### Profile

```
GET    /api/tukang/profile
PUT    /api/tukang/profile
GET    /api/tukang/categories
PUT    /api/tukang/availability
```

### Orders

```
GET    /api/tukang/orders
GET    /api/tukang/orders/:transaksi_id
PUT    /api/tukang/orders/:transaksi_id/accept
PUT    /api/tukang/orders/:transaksi_id/reject
PUT    /api/tukang/orders/:transaksi_id/start
PUT    /api/tukang/orders/:transaksi_id/complete
PUT    /api/tukang/orders/:transaksi_id/confirm-tunai
```

### Ratings & Withdrawal

```
GET    /api/tukang/ratings
POST   /api/tukang/withdrawal
GET    /api/tukang/withdrawal
GET    /api/tukang/statistics
```

---

## 📊 Common Query Parameters

### Pagination

```
?limit=10&offset=0
```

### Filter by Status

```
?status=pending|diterima|dalam_proses|selesai|dibatalkan|ditolak
```

### Filter by Payment

```
?metode_pembayaran=poin|tunai
```

### Sort

```
?order_by=rata_rata_rating&order_dir=DESC
```

---

## 💾 Standard Response Format

### Success

```json
{
  "status": "success",
  "message": "Operation successful",
  "data": { ... }
}
```

### Error

```json
{
  "status": "error",
  "message": "Error description",
  "data": null
}
```

---

## 🚀 Quick Test Commands

### Register Client

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testclient","email":"test@client.com","password":"pass123","nama_lengkap":"Test Client","no_telp":"08123456789","role":"client","kota":"Jakarta"}'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testclient","password":"pass123"}'
```

### Get Profile (with token)

```bash
curl -X GET http://localhost:3000/api/client/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Browse Tukang

```bash
curl -X GET "http://localhost:3000/api/client/tukang?kota=Jakarta&limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Create Booking

```bash
curl -X POST http://localhost:3000/api/client/booking \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "tukang_id":7,
    "kategori_id":1,
    "judul_layanan":"Perbaikan Listrik",
    "lokasi_kerja":"Jakarta",
    "tanggal_jadwal":"2025-12-01",
    "waktu_jadwal":"10:00",
    "harga_dasar":100000,
    "metode_pembayaran":"tunai"
  }'
```

---

## 📁 File Upload Endpoints

### Upload Photo Profile

```
POST /api/auth/register              (foto_profil)
PUT  /api/client/profile             (foto_profil)
PUT  /api/tukang/profile             (foto_profil)
```

### Upload Payment Proof

```
POST /api/client/topup               (bukti_pembayaran)
```

**Format**: multipart/form-data
**Max Size**: 2MB
**Types**: JPG, JPEG, PNG, PDF

---

## 🎯 Transaction Status Flow

```
pending → diterima → dalam_proses → selesai
           ↓           ↓              ↓
        ditolak    dibatalkan    dibatalkan
```

---

## 💰 Payment Methods

### POIN (Digital)

1. Client top-up via `/api/client/topup`
2. Admin verifies
3. Booking with `metode_pembayaran: "poin"`
4. Auto-deduct from client
5. Auto-transfer to tukang after complete
6. Tukang withdrawal via `/api/tukang/withdrawal`

### TUNAI (Cash)

1. Booking with `metode_pembayaran: "tunai"`
2. No deduction needed
3. Pay cash at location
4. Tukang confirms via `/api/tukang/orders/:id/confirm-tunai`

---

## ⚠️ Important Notes

1. **Tukang Verification**: Tukang must be verified by admin before login
2. **Client Auto-Verified**: Client accounts are auto-verified on registration
3. **Rating**: Only available for completed transactions
4. **Cancellation**: Only possible for pending/diterima status
5. **Token Expiry**: Set in JWT_EXPIRES_IN env variable

---

## 📞 Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Server Error
