# Rampungin API - Node.js Express + Prisma + PostgreSQL

Backend API untuk aplikasi Rampungin (Platform Booking Tukang Online) - Migrasi dari CodeIgniter 4 ke Node.js.

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
- PostgreSQL 14+
- npm atau yarn

### Installation

1. Clone repository

```bash
git clone <repository-url>
cd rampungin_production
```

2. Install dependencies

```bash
npm install
```

3. Setup environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/rampungin
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRES_IN=30d
PORT=3000
NODE_ENV=development
```

4. Generate Prisma Client

```bash
npm run prisma:generate
```

5. Run database migrations

```bash
npm run prisma:migrate
```

6. (Optional) Open Prisma Studio

```bash
npm run prisma:studio
```

### Running the Server

**Development mode (with auto-reload):**

```bash
npm run dev
```

**Production mode:**

```bash
npm start
```

Server akan berjalan di: `http://localhost:3000`

---

## 📁 Project Structure

```
rampungin_production/
├── src/
│   ├── controllers/
│   │   ├── auth.controller.js      # Auth endpoints
│   │   ├── client.controller.js    # Client endpoints
│   │   ├── tukang.controller.js    # Tukang endpoints
│   │   └── admin.controller.js     # Admin endpoints (NEW)
│   ├── middleware/
│   │   ├── auth.middleware.js      # JWT verification
│   │   └── upload.middleware.js    # Multer file upload
│   ├── routes/
│   │   ├── auth.routes.js          # Auth routes
│   │   ├── client.routes.js        # Client routes
│   │   ├── tukang.routes.js        # Tukang routes
│   │   ├── admin.routes.js         # Admin routes (NEW)
│   │   └── index.js                # Main router
│   ├── utils/
│   │   ├── prisma.util.js          # Prisma client singleton
│   │   └── response.util.js        # Standard response helper
│   ├── generated/                  # Prisma generated client
│   └── index.js                    # App entry point
├── prisma/
│   └── schema.prisma               # Database schema
├── writable/
│   ├── profiles/                   # User profile photos
│   └── topup/                      # Topup payment proofs
├── package.json
├── .env
├── listapiproduction.txt           # Full API documentation
├── API_ADMIN_DOCUMENTATION.md      # Admin API documentation (NEW)
├── API_MIGRATION_NOTES.md          # Migration guide
└── ENDPOINTS_SUMMARY.md            # Quick reference
```

---

## 📚 Documentation

### 1. Full API Documentation

Lihat file: `listapiproduction.txt`

- 34 endpoints lengkap dengan contoh request/response
- Contoh cURL untuk testing
- Penjelasan flow bisnis

### 2. Admin API Documentation

Lihat file: `API_ADMIN_DOCUMENTATION.md`

- 16 admin endpoints
- Dashboard & user management
- Financial operations (topup, withdrawal)
- Verification systems
- Transaction monitoring

### 3. Migration Notes

Lihat file: `API_MIGRATION_NOTES.md`

- Compatibility matrix CI4 vs Node.js
- Flutter migration guide
- Testing checklist

### 4. Quick Reference

Lihat file: `ENDPOINTS_SUMMARY.md`

- Ringkasan semua endpoint
- Quick test commands
- Common patterns

---

## 🔑 API Endpoints Overview

### Base URL

```
http://localhost:3000/api
```

### Authentication (5 endpoints)

- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login & get JWT token
- `POST /api/auth/logout` - Logout & blacklist token
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password

### Client Endpoints (14 endpoints)

- Profile management
- Browse & search tukang
- Booking & transactions
- Top-up POIN
- Rating & statistics

### Tukang Endpoints (15 endpoints)

- Profile management
- Order management
- Ratings
- Withdrawal
- Statistics

### Admin Endpoints (16 endpoints) 🆕

- Dashboard & statistics
- User management (list, ban/unban)
- Category CRUD
- Tukang verification
- Topup verification
- Withdrawal verification (with proof upload)
- Transaction monitoring

**Total: 50 endpoints (34 public + 16 admin)**

---

## 🧪 Testing

### Using cURL

**1. Register & Login:**

```bash
# Register client
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"pass123","nama_lengkap":"Test User","no_telp":"08123456789","role":"client","kota":"Jakarta"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"pass123"}'

# Save the token from response
```

**2. Test Protected Endpoint:**

```bash
# Get profile (replace TOKEN)
curl -X GET http://localhost:3000/api/client/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Using Postman

1. Import collection dari `listapiproduction.txt`
2. Set base URL: `http://localhost:3000`
3. Set Authorization dengan Bearer Token

---

## 🔒 Security Features

- ✅ JWT Authentication
- ✅ Password hashing (bcrypt)
- ✅ Token blacklist on logout
- ✅ Role-based access control (client/tukang)
- ✅ Input validation
- ✅ SQL injection protection (Prisma ORM)
- ✅ CORS enabled

---

## 💾 Database Schema

Menggunakan PostgreSQL dengan schema:

- `auth` schema: users, roles, jwt_blacklist, profil_tukang
- `transaksi` schema: transaksi, kategori, rating, topup, penarikan

Lihat detail di: `prisma/schema.prisma`

---

## 🔧 Available Scripts

```bash
# Development
npm run dev                 # Start with nodemon (auto-reload)

# Production
npm start                   # Start production server

# Prisma Commands
npm run prisma:generate     # Generate Prisma Client
npm run prisma:migrate      # Run migrations
npm run prisma:studio       # Open Prisma Studio (DB GUI)
npm run prisma:pull         # Pull schema from existing DB
```

---

## 🌐 Environment Variables

| Variable         | Description                  | Example                                    |
| ---------------- | ---------------------------- | ------------------------------------------ |
| `DATABASE_URL`   | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/db` |
| `JWT_SECRET`     | Secret key untuk JWT         | `your-secret-key-here`                     |
| `JWT_EXPIRES_IN` | Token expiration time        | `30d`                                      |
| `PORT`           | Server port                  | `3000`                                     |
| `NODE_ENV`       | Environment                  | `development` / `production`               |

---

## 📊 Response Format

### Success Response

```json
{
  "status": "success",
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response

```json
{
  "status": "error",
  "message": "Error description",
  "data": null
}
```

---

## 🔄 Migration from CodeIgniter 4

### What Changed?

- ✅ Same endpoints, same paths
- ✅ Same request/response format
- ✅ Same authentication method
- ✅ Better performance

### What to Update in Flutter?

1. Change base URL from `http://localhost/admintukang` to `http://localhost:3000`
2. That's it! Everything else is compatible.

### Bug Fixes in Node.js Version:

1. ✅ Fixed duplicate `kategori_tukang` field in getTukangDetail
2. ✅ Improved error handling
3. ✅ Better validation

---

## 🎯 Key Features

### Dual Payment System

1. **POIN (Digital QRIS)**

   - Client top-up → Admin verify → Balance updated
   - Auto-deduct on booking
   - Auto-transfer to tukang after work complete
   - Tukang can withdraw (min 50k, fee 2%)

2. **TUNAI (Cash)**
   - No top-up needed
   - Book directly
   - Pay cash on-site
   - Tukang confirms payment

### Transaction Flow

```
pending → diterima → dalam_proses → selesai
   ↓         ↓            ↓
ditolak  dibatalkan   dibatalkan
```

### Rating System

- Only for completed transactions
- 1-5 stars with optional review
- Updates tukang's average rating
- Displayed in tukang profile

---

## 🐛 Troubleshooting

### Port already in use

```bash
# Find process
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Database connection error

```bash
# Check PostgreSQL is running
pg_isready

# Check DATABASE_URL in .env
echo $DATABASE_URL
```

### Prisma Client error

```bash
# Regenerate client
npm run prisma:generate

# Reset database
npx prisma migrate reset
```

---

## 📝 License

MIT License

---

## 👥 Contributors

- Backend Developer: [Your Name]
- Frontend Developer: [Flutter Team]

---

## 🆘 Support

Jika ada pertanyaan atau issue:

1. Cek dokumentasi di `listapiproduction.txt`
2. Cek migration notes di `API_MIGRATION_NOTES.md`
3. Lihat contoh di `ENDPOINTS_SUMMARY.md`
4. Open GitHub issue

---

## 📅 Version History

### v1.0.0 (November 18, 2025)

- ✅ Complete migration from CI4 to Node.js
- ✅ 34 endpoints fully functional
- ✅ 100% backward compatible with Flutter app
- ✅ Fixed kategori_tukang duplicate bug
- ✅ Added comprehensive documentation
- ✅ Added cURL examples

---

**Happy Coding! 🚀**
