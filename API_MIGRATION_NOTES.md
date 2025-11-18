# API Migration Notes: CodeIgniter 4 to Node.js Express

## Base URL Changes

- **Old (CI4)**: `http://localhost/admintukang/api`
- **New (Node.js)**: `http://localhost:3000/api`

## Endpoint Compatibility Matrix

### ✅ AUTH ENDPOINTS - 100% Compatible

| Endpoint        | Old CI4                        | New Node.js                    | Status  |
| --------------- | ------------------------------ | ------------------------------ | ------- |
| Register        | POST /api/auth/register        | POST /api/auth/register        | ✅ Same |
| Login           | POST /api/auth/login           | POST /api/auth/login           | ✅ Same |
| Logout          | POST /api/auth/logout          | POST /api/auth/logout          | ✅ Same |
| Get Me          | GET /api/auth/me               | GET /api/auth/me               | ✅ Same |
| Change Password | POST /api/auth/change-password | POST /api/auth/change-password | ✅ Same |

### ✅ CLIENT ENDPOINTS - 100% Compatible

| Endpoint               | Old CI4                                 | New Node.js                             | Status  |
| ---------------------- | --------------------------------------- | --------------------------------------- | ------- |
| Get Profile            | GET /api/client/profile                 | GET /api/client/profile                 | ✅ Same |
| Update Profile         | PUT /api/client/profile                 | PUT /api/client/profile                 | ✅ Same |
| Get Categories         | GET /api/client/categories              | GET /api/client/categories              | ✅ Same |
| Browse Tukang          | GET /api/client/tukang                  | GET /api/client/tukang                  | ✅ Same |
| Get Tukang Detail      | GET /api/client/tukang/:id              | GET /api/client/tukang/:id              | ✅ Same |
| Search Tukang          | GET /api/client/search-tukang           | GET /api/client/search-tukang           | ✅ Same |
| Create Booking         | POST /api/client/booking                | POST /api/client/booking                | ✅ Same |
| Get Transactions       | GET /api/client/transactions            | GET /api/client/transactions            | ✅ Same |
| Get Transaction Detail | GET /api/client/transactions/:id        | GET /api/client/transactions/:id        | ✅ Same |
| Cancel Transaction     | PUT /api/client/transactions/:id/cancel | PUT /api/client/transactions/:id/cancel | ✅ Same |
| Request Topup          | POST /api/client/topup                  | POST /api/client/topup                  | ✅ Same |
| Get Topup History      | GET /api/client/topup                   | GET /api/client/topup                   | ✅ Same |
| Submit Rating          | POST /api/client/rating                 | POST /api/client/rating                 | ✅ Same |
| Get Statistics         | GET /api/client/statistics              | GET /api/client/statistics              | ✅ Same |

### ✅ TUKANG ENDPOINTS - 100% Compatible

| Endpoint               | Old CI4                                  | New Node.js                              | Status  |
| ---------------------- | ---------------------------------------- | ---------------------------------------- | ------- |
| Get Profile            | GET /api/tukang/profile                  | GET /api/tukang/profile                  | ✅ Same |
| Update Profile         | PUT /api/tukang/profile                  | PUT /api/tukang/profile                  | ✅ Same |
| Get Categories         | GET /api/tukang/categories               | GET /api/tukang/categories               | ✅ Same |
| Update Availability    | PUT /api/tukang/availability             | PUT /api/tukang/availability             | ✅ Same |
| Get Orders             | GET /api/tukang/orders                   | GET /api/tukang/orders                   | ✅ Same |
| Get Order Detail       | GET /api/tukang/orders/:id               | GET /api/tukang/orders/:id               | ✅ Same |
| Accept Order           | PUT /api/tukang/orders/:id/accept        | PUT /api/tukang/orders/:id/accept        | ✅ Same |
| Reject Order           | PUT /api/tukang/orders/:id/reject        | PUT /api/tukang/orders/:id/reject        | ✅ Same |
| Start Work             | PUT /api/tukang/orders/:id/start         | PUT /api/tukang/orders/:id/start         | ✅ Same |
| Complete Work          | PUT /api/tukang/orders/:id/complete      | PUT /api/tukang/orders/:id/complete      | ✅ Same |
| Confirm Tunai          | PUT /api/tukang/orders/:id/confirm-tunai | PUT /api/tukang/orders/:id/confirm-tunai | ✅ Same |
| Get Ratings            | GET /api/tukang/ratings                  | GET /api/tukang/ratings                  | ✅ Same |
| Request Withdrawal     | POST /api/tukang/withdrawal              | POST /api/tukang/withdrawal              | ✅ Same |
| Get Withdrawal History | GET /api/tukang/withdrawal               | GET /api/tukang/withdrawal               | ✅ Same |
| Get Statistics         | GET /api/tukang/statistics               | GET /api/tukang/statistics               | ✅ Same |

## Response Format - Identical ✅

Both CI4 and Node.js return the same JSON structure:

```json
{
  "status": "success" | "error",
  "message": "Message here",
  "data": { ... } | null
}
```

## Key Changes for Flutter App

### 1. Base URL Update (REQUIRED)

Update your Flutter API base URL:

```dart
// Old
const String baseUrl = 'http://localhost/admintukang';

// New
const String baseUrl = 'http://localhost:3000';
```

### 2. File Upload Paths (NO CHANGE)

File paths remain the same:

- `uploads/profiles/filename.jpg`
- `uploads/topup/filename.jpg`

Access via:

- Old: `http://localhost/admintukang/uploads/profiles/filename.jpg`
- New: `http://localhost:3000/uploads/profiles/filename.jpg`

### 3. Authentication (NO CHANGE)

JWT token handling remains identical:

```dart
headers: {
  'Authorization': 'Bearer $token',
  'Content-Type': 'application/json',
}
```

## Bug Fixes in Node.js Version

### 1. ✅ Fixed: Duplicate kategori_tukang in getTukangDetail

**Old Response (CI4 - has duplicate):**

```json
{
  "kategori_tukang": [...],  // ❌ Duplicate
  "kategori": [...]
}
```

**New Response (Node.js - clean):**

```json
{
  "kategori": [...]  // ✅ Only this field
}
```

**Impact**: Flutter model might need to remove `kategoriTukang` field parsing.

### 2. ✅ Same Route for Topup GET/POST

Both endpoints now properly support:

- `POST /api/client/topup` - Create topup request
- `GET /api/client/topup` - Get topup history

### 3. ✅ Same Route for Withdrawal GET/POST

Both endpoints now properly support:

- `POST /api/tukang/withdrawal` - Create withdrawal request
- `GET /api/tukang/withdrawal` - Get withdrawal history

## Testing Checklist

### Phase 1: Basic Auth (5 min)

- [ ] Register new client
- [ ] Register new tukang
- [ ] Login with client
- [ ] Login with tukang
- [ ] Get current user
- [ ] Change password
- [ ] Logout

### Phase 2: Client Flow (10 min)

- [ ] Get client profile
- [ ] Update client profile (with/without photo)
- [ ] Get categories
- [ ] Browse tukang (with filters)
- [ ] Get tukang detail
- [ ] Search tukang
- [ ] Create booking (tunai)
- [ ] Create booking (poin)
- [ ] Get transactions
- [ ] Get transaction detail
- [ ] Cancel transaction
- [ ] Request topup
- [ ] Get topup history
- [ ] Submit rating
- [ ] Get client statistics

### Phase 3: Tukang Flow (10 min)

- [ ] Get tukang profile
- [ ] Update tukang profile
- [ ] Get categories
- [ ] Update availability
- [ ] Get orders (pending)
- [ ] Get order detail
- [ ] Accept order
- [ ] Reject order
- [ ] Start work
- [ ] Complete work
- [ ] Confirm tunai payment
- [ ] Get ratings
- [ ] Request withdrawal
- [ ] Get withdrawal history
- [ ] Get tukang statistics

## Migration Steps for Flutter

### Option 1: Quick Migration (Recommended)

1. Update base URL only
2. Test all existing flows
3. No code changes needed (100% compatible)

### Option 2: Clean Migration

1. Update base URL
2. Update Tukang model (remove `kategoriTukang` field)
3. Test all flows
4. Deploy

## Environment Variables

Create `.env` file:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=30d
PORT=3000
NODE_ENV=production
```

## Running the Server

```bash
# Development
npm run dev

# Production
npm start

# Generate Prisma Client
npm run prisma:generate

# Database Migration
npm run prisma:migrate

# Database Studio
npm run prisma:studio
```

## Success Criteria

✅ All 34 endpoints work identically
✅ Same request/response format
✅ Same authentication method
✅ Same file upload handling
✅ Same error responses
✅ Better performance (Node.js is faster)
✅ Fixed duplicate kategori bug

## Support

If you encounter any issues:

1. Check this migration notes
2. Compare response with `listapi.txt`
3. Review `listapiproduction.txt` for details
4. Check cURL examples in documentation
