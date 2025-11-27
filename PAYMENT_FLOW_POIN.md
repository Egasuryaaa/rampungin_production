# 💰 Flow Pembayaran Menggunakan Poin - Lengkap

## 📋 Overview

Sistem pembayaran poin di aplikasi Rampungin memungkinkan client menggunakan saldo poin untuk membayar jasa tukang. Poin yang dipotong dari client akan ditransfer ke tukang **setelah client memberikan rating** sebagai konfirmasi kepuasan terhadap pekerjaan.

---

## 🔄 COMPLETE FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FLOW PEMBAYARAN POIN                             │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┐
│  1. CLIENT   │
│  Top-Up Poin │
└──────┬───────┘
       │
       ├──► Upload bukti transfer (QRIS/Bank)
       ├──► Admin verifikasi
       └──► Poin masuk ke saldo client
              │
              ▼
┌──────────────────────────┐
│  2. CLIENT               │
│  Create Booking          │
│  (metode: "poin")        │
└──────┬───────────────────┘
       │
       ├──► Cek saldo poin >= total_biaya ✅
       ├──► Potong poin client (-total_biaya)
       ├──► Status: "pending"
       └──► poin_terpotong: true
              │
              ▼
┌──────────────────────────┐
│  3. TUKANG               │
│  Terima Notifikasi       │
│  Order Baru              │
└──────┬───────────────────┘
       │
       ├──► Accept Order → Status: "diterima"
       ├──► Start Work → Status: "dalam_proses"
       └──► Complete Work → Status: "selesai"
              │
              ▼
┌──────────────────────────┐
│  4. CLIENT               │
│  Submit Rating           │
└──────┬───────────────────┘
       │
       └──► Rating diberikan
              │
              ▼
┌──────────────────────────────┐
│  5. TRANSFER POIN KE TUKANG  │
│  (Otomatis saat rating)      │
└──────┬───────────────────────┘
       │
       ├──► Poin ditransfer ke tukang (+total_biaya)
       ├──► Update profil_tukang statistics
       └──► Client & Tukang dapat notifikasi
              │
              ▼
┌──────────────────────────┐
│  6. TUKANG               │
│  Withdrawal Poin         │
└──────┬───────────────────┘
       │
       ├──► Request penarikan (min 50,000)
       ├──► Potong poin tukang (-jumlah)
       ├──► Biaya admin 2% (max 5,000)
       ├──► Admin proses & transfer ke bank
       └──► Status: "selesai"

┌─────────────────────────────────────────────────────────────────────────┐
│                         SPECIAL CASES                                    │
└─────────────────────────────────────────────────────────────────────────┘

JIKA CLIENT CANCEL (Status: pending/diterima):
├──► Poin dikembalikan ke client (+total_biaya)
└──► poin_terpotong: true → Refund

JIKA TUKANG REJECT (Status: pending):
├──► Poin dikembalikan ke client (+total_biaya)
└──► poin_terpotong: true → Refund
```

---

## 👤 SISI CLIENT - Detail Flow

### 1. Top-Up Poin Dulu

#### Endpoint: `POST /api/client/topup`

**Request:**

```
Content-Type: multipart/form-data

jumlah: 100000
bukti_pembayaran: [FILE]
```

**Response (201):**

```json
{
  "status": "success",
  "message": "Request top-up berhasil dibuat",
  "data": {
    "topup_id": 1,
    "jumlah": 100000,
    "status": "pending",
    "kadaluarsa_pada": "2025-11-28T10:00:00.000Z"
  }
}
```

**Backend Process:**

```javascript
// File: client.controller.js - requestTopup()

1. Validasi jumlah > 0
2. Validasi file bukti_pembayaran ada
3. Save bukti ke writable/topup/
4. Create record di tabel topup:
   - user_id: client ID
   - jumlah: jumlah top-up
   - metode_pembayaran: "qris"
   - bukti_pembayaran: path file
   - status: "pending"
   - kadaluarsa_pada: +24 jam
5. Return response
```

**Admin Verifikasi:**

- Admin cek bukti pembayaran
- Jika valid → Approve:
  - Update topup.status = "disetujui"
  - **Transfer poin ke client: `client.poin += jumlah`**
  - Client bisa pakai poin untuk booking
- Jika invalid → Reject:
  - Update topup.status = "ditolak"
  - Poin tidak ditambahkan

---

### 2. Create Booking dengan Poin

#### Endpoint: `POST /api/client/booking`

**Request:**

```json
{
  "tukang_id": 7,
  "kategori_id": 1,
  "judul_layanan": "Servis AC",
  "lokasi_kerja": "Jl. Sudirman No. 123, Jakarta",
  "tanggal_jadwal": "2025-11-28",
  "waktu_jadwal": "10:00",
  "harga_dasar": 150000,
  "biaya_tambahan": 0,
  "metode_pembayaran": "poin", // ⬅️ KUNCI: pilih poin
  "catatan_client": "AC tidak dingin"
}
```

**Response (201):**

```json
{
  "status": "success",
  "message": "Booking berhasil dibuat",
  "data": {
    "transaksi_id": 15,
    "nomor_pesanan": "TRX-1732697234567",
    "status": "pending",
    "total_biaya": 150000,
    "metode_pembayaran": "poin",
    "poin_terpotong": true // ⬅️ Flag bahwa poin sudah dipotong
  }
}
```

**Backend Process (Transaction):**

```javascript
// File: client.controller.js - createBooking()

await prisma.$transaction(async (tx) => {
  // STEP 1: Validasi tukang_id
  const profilTukang = await tx.profil_tukang.findUnique({
    where: { id: tukangId },
  });
  if (!profilTukang) throw new Error("Tukang tidak ditemukan");

  // STEP 2: Jika metode "poin" → CEK & POTONG SALDO
  if (metode_pembayaran === "poin") {
    // 2a. Cek saldo client
    const client = await tx.users.findUnique({
      where: { id: clientId },
      select: { poin: true },
    });

    // 2b. Validasi saldo cukup
    if (client.poin < total_biaya) {
      throw new Error("Saldo poin tidak mencukupi");
    }

    // 2c. POTONG POIN CLIENT ⬅️ PENTING!
    await tx.users.update({
      where: { id: clientId },
      data: { poin: { decrement: total_biaya } },
    });
  }

  // STEP 3: Buat record transaksi
  const newTransaksi = await tx.transaksi.create({
    data: {
      client_id: clientId,
      tukang_id: tukangId,
      kategori_id: kategori_id,
      nomor_pesanan: `TRX-${Date.now()}`,
      judul_layanan: judul_layanan,
      lokasi_kerja: lokasi_kerja,
      tanggal_jadwal: tanggal_jadwal,
      waktu_jadwal: waktu_jadwal,
      harga_dasar: harga_dasar,
      biaya_tambahan: biaya_tambahan || 0,
      total_biaya: total_biaya,
      metode_pembayaran: "poin",
      status: "pending",
      catatan_client: catatan_client,
      poin_terpotong: true, // ⬅️ Flag untuk tracking
    },
  });

  return newTransaksi;
});
```

**⚠️ Error jika Saldo Tidak Cukup:**

```json
{
  "status": "error",
  "message": "Saldo poin tidak mencukupi",
  "data": null
}
```

---

### 3. Cancel Booking (Poin Dikembalikan)

#### Endpoint: `POST /api/client/cancel-transaction/:transaksi_id`

**Request:**

```json
{
  "alasan_pembatalan": "Tidak jadi butuh jasa"
}
```

**Backend Process:**

```javascript
// File: client.controller.js - cancelTransaction()

await prisma.$transaction(async (tx) => {
  // 1. Get transaksi
  const transaction = await tx.transaksi.findFirst({
    where: { id: transaksi_id, client_id: clientId },
  });

  // 2. Cek status (hanya pending/diterima yang bisa cancel)
  if (!["pending", "diterima"].includes(transaction.status)) {
    throw new Error("Transaksi tidak dapat dibatalkan");
  }

  // 3. Update status
  await tx.transaksi.update({
    where: { id: transaction.id },
    data: {
      status: "dibatalkan",
      alasan_pembatalan: alasan_pembatalan,
      dibatalkan_oleh: clientId,
      waktu_dibatalkan: new Date(),
    },
  });

  // 4. KEMBALIKAN POIN jika poin_terpotong = true ⬅️ PENTING!
  let poinDikembalikan = 0;
  if (transaction.poin_terpotong) {
    poinDikembalikan = parseFloat(transaction.total_biaya);

    await tx.users.update({
      where: { id: clientId },
      data: { poin: { increment: poinDikembalikan } },
    });
  }

  return { poinDikembalikan };
});
```

**Response:**

```json
{
  "status": "success",
  "message": "Transaksi berhasil dibatalkan",
  "data": {
    "poinDikembalikan": 150000
  }
}
```

---

## 🔧 SISI TUKANG - Detail Flow

### 1. Terima Order Baru (Notifikasi)

#### Endpoint: `GET /api/tukang/orders`

**Response:**

```json
{
  "status": "success",
  "message": "Data pesanan berhasil diambil",
  "data": [
    {
      "id": 15,
      "nomor_pesanan": "TRX-1732697234567",
      "client_id": 2,
      "tukang_id": 7,
      "judul_layanan": "Servis AC",
      "lokasi_kerja": "Jl. Sudirman No. 123, Jakarta",
      "tanggal_jadwal": "2025-11-28",
      "waktu_jadwal": "10:00:00",
      "total_biaya": 150000,
      "metode_pembayaran": "poin", // ⬅️ Tukang tahu ini bayar poin
      "status": "pending",
      "poin_terpotong": true,
      "nama_client": "John Doe",
      "foto_client": "uploads/profiles/john.jpg",
      "no_telp_client": "081234567890"
    }
  ]
}
```

---

### 2. Accept Order

#### Endpoint: `POST /api/tukang/orders/:transaksi_id/accept`

**Backend Process:**

```javascript
// File: tukang.controller.js - acceptOrder()

// Update status dari "pending" → "diterima"
const updated = await prisma.transaksi.updateMany({
  where: {
    id: parseInt(transaksi_id),
    tukang_id: req.user.id,
    status: "pending",
  },
  data: {
    status: "diterima",
    waktu_diterima: new Date(),
  },
});
```

**Response:**

```json
{
  "status": "success",
  "message": "Pesanan berhasil diterima"
}
```

---

### 3. Start Work

#### Endpoint: `POST /api/tukang/orders/:transaksi_id/start`

**Backend Process:**

```javascript
// Update status dari "diterima" → "dalam_proses"
const updated = await prisma.transaksi.updateMany({
  where: {
    id: parseInt(transaksi_id),
    tukang_id: req.user.id,
    status: "diterima",
  },
  data: {
    status: "dalam_proses",
    waktu_mulai: new Date(),
  },
});
```

---

### 4. Complete Work (POIN DITRANSFER KE TUKANG)

#### Endpoint: `POST /api/tukang/orders/:transaksi_id/complete`

**Request:**

```json
{
  "catatan_tukang": "AC sudah dingin kembali. Freon sudah diisi."
}
```

**Backend Process (Transaction):**

```javascript
// File: tukang.controller.js - completeWork()

await prisma.$transaction(async (tx) => {
  // 1. Get transaksi
  const transaction = await tx.transaksi.findFirst({
    where: { id: transaksi_id, tukang_id: tukangId },
  });

  // 2. Validasi status harus "dalam_proses"
  if (transaction.status !== "dalam_proses") {
    throw new Error("Hanya pesanan dalam proses yang bisa diselesaikan");
  }

  // 3. Update status transaksi
  await tx.transaksi.update({
    where: { id: transaction.id },
    data: {
      status: "selesai",
      catatan_tukang: catatan_tukang,
      waktu_selesai: new Date(),
    },
  });

  // Poin TIDAK ditransfer di sini
  // Poin akan ditransfer setelah client memberikan rating
});
```

**Response:**

```json
{
  "status": "success",
  "message": "Pekerjaan berhasil diselesaikan. Poin akan ditransfer setelah client memberikan rating."
}
```

**✅ Yang Terjadi di Database:**

```sql
-- Transaksi diupdate ke status selesai
UPDATE transaksi
SET status = 'selesai',
    waktu_selesai = NOW()
WHERE id = 15;

-- Poin BELUM ditransfer ke tukang
-- Menunggu client memberikan rating
```

---

### 5. Submit Rating (Client)

#### Endpoint: `POST /api/client/rating`

**Request:**

```json
{
  "transaksi_id": 15,
  "rating": 5,
  "ulasan": "Sangat puas dengan hasilnya"
}
```

**Backend Process (Transaction):**

```javascript
// File: client.controller.js - submitRating()

await prisma.$transaction(async (tx) => {
  // 1. Get transaksi
  const transaction = await tx.transaksi.findFirst({
    where: { id: transaksi_id, client_id: clientId },
  });

  // 2. Validasi status harus "selesai"
  if (transaction.status !== "selesai") {
    throw new Error("Hanya transaksi yang selesai yang bisa diberi rating");
  }

  // 3. Buat rating
  const newRating = await tx.rating.create({
    data: {
      transaksi_id: transaction.id,
      client_id: clientId,
      tukang_id: transaction.tukang_id,
      rating: parseInt(rating),
      ulasan: ulasan,
    },
  });

  // 4. Update statistik tukang
  const stats = await tx.rating.aggregate({
    where: { tukang_id: transaction.tukang_id },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await tx.profil_tukang.update({
    where: { user_id: transaction.tukang_id },
    data: {
      rata_rata_rating: stats._avg.rating,
      total_rating: stats._count.rating,
      total_pekerjaan_selesai: { increment: 1 },
    },
  });

  // 5. TRANSFER POIN KE TUKANG jika metode "poin" ⬅️ PENTING!
  let poinDitransfer = 0;
  if (transaction.metode_pembayaran === "poin" && transaction.poin_terpotong) {
    poinDitransfer = parseFloat(transaction.total_biaya);

    // Ambil user_id tukang dari profil_tukang
    const profilTukang = await tx.profil_tukang.findUnique({
      where: { id: transaction.tukang_id },
      select: { user_id: true },
    });

    if (profilTukang) {
      // TRANSFER POIN
      await tx.users.update({
        where: { id: profilTukang.user_id },
        data: { poin: { increment: poinDitransfer } },
      });
    }
  }

  return { ...newRating, poinDitransfer };
});
```

**Response:**

```json
{
  "status": "success",
  "message": "Rating berhasil diberikan. 150000 poin telah ditransfer ke tukang.",
  "data": {
    "rating_id": 8,
    "transaksi_id": 15,
    "rating": 5,
    "poin_ditransfer": 150000 // ⬅️ Tukang dapat 150,000 poin
  }
}
```

**✅ Yang Terjadi di Database:**

```sql
-- Client (saldo tidak berubah, sudah dipotong saat booking)

-- Tukang (dapat poin setelah rating)
UPDATE users
SET poin = poin + 150000
WHERE id = [tukang_user_id];

-- Rating dibuat
INSERT INTO rating (transaksi_id, client_id, tukang_id, rating, ulasan)
VALUES (15, 12, 7, 5, 'Sangat puas dengan hasilnya');

-- Statistik tukang diupdate
UPDATE profil_tukang
SET rata_rata_rating = 4.8,
    total_rating = 10,
    total_pekerjaan_selesai = total_pekerjaan_selesai + 1
WHERE user_id = 7;
```

---

### 6. Withdraw Poin ke Bank

#### Endpoint: `POST /api/tukang/withdrawal`

**Request:**

```json
{
  "jumlah": 150000,
  "nama_bank": "BCA",
  "nomor_rekening": "1234567890",
  "nama_pemilik_rekening": "Agus Prakoso"
}
```

**Backend Process:**

```javascript
// File: tukang.controller.js - requestWithdrawal()

await prisma.$transaction(async (tx) => {
  // 1. Validasi minimum 50,000
  if (jumlah < 50000) {
    throw new Error("Minimum penarikan adalah 50,000");
  }

  // 2. Cek saldo tukang
  const tukang = await tx.users.findUnique({
    where: { id: tukangId },
    select: { poin: true },
  });

  if (tukang.poin < jumlah) {
    throw new Error("Saldo poin tidak mencukupi");
  }

  // 3. Hitung biaya admin (2%, max 5,000)
  let biaya_admin = jumlah * 0.02;
  if (biaya_admin > 5000) biaya_admin = 5000;

  const jumlah_bersih = jumlah - biaya_admin;

  // 4. POTONG SALDO TUKANG ⬅️ LANGSUNG DIPOTONG!
  await tx.users.update({
    where: { id: tukangId },
    data: { poin: { decrement: jumlah } },
  });

  // 5. Buat record withdrawal
  const withdrawal = await tx.penarikan.create({
    data: {
      tukang_id: tukangId,
      jumlah: jumlah,
      biaya_admin: biaya_admin,
      jumlah_bersih: jumlah_bersih,
      nama_bank: nama_bank,
      nomor_rekening: nomor_rekening,
      nama_pemilik_rekening: nama_pemilik_rekening,
      status: "pending",
    },
  });

  return withdrawal;
});
```

**Response:**

```json
{
  "status": "success",
  "message": "Request penarikan berhasil dibuat",
  "data": {
    "withdrawal_id": 5,
    "jumlah": 150000,
    "biaya_admin": 3000,
    "jumlah_bersih": 147000,
    "status": "pending"
  }
}
```

**Admin Proses Withdrawal:**

- Admin transfer Rp 147,000 ke rekening tukang
- Update `penarikan.status = "selesai"`
- Tukang dapat notifikasi
- Jika ditolak → Update status "ditolak" → Poin dikembalikan ke tukang

---

## 📊 TRACKING SALDO POIN

### Client - Cek Saldo

#### Endpoint: `GET /api/client/profile`

**Response:**

```json
{
  "status": "success",
  "data": {
    "id": 2,
    "username": "johndoe",
    "nama_lengkap": "John Doe",
    "poin": 50000,  // ⬅️ Saldo poin client saat ini
    ...
  }
}
```

### Tukang - Cek Saldo & Statistik

#### Endpoint: `GET /api/tukang/statistics`

**Response:**

```json
{
  "status": "success",
  "data": {
    "saldo_poin": 150000, // ⬅️ Saldo poin tukang saat ini
    "total_pekerjaan_selesai": 10,
    "rata_rata_rating": 4.8,
    "transaksi": {
      "total": 15,
      "pending": 2,
      "diterima": 1,
      "dalam_proses": 1,
      "selesai": 10,
      "total_pendapatan": 1500000 // ⬅️ Total dari poin yang diterima
    },
    "penarikan": {
      "total": 3,
      "pending": 1,
      "selesai": 2,
      "total_ditarik": 300000 // ⬅️ Total poin yang sudah ditarik
    }
  }
}
```

---

## 🎯 SUMMARY - POINT TRACKING

### Alur Poin Lengkap:

```
CLIENT TOPUP
├─ Client upload bukti → Admin approve
└─ Client.poin += jumlah_topup

CLIENT BOOKING (POIN)
├─ Client.poin >= total_biaya? ✅
├─ Client.poin -= total_biaya  ⬅️ DIPOTONG LANGSUNG!
└─ transaksi.poin_terpotong = true

TUKANG COMPLETE WORK
├─ transaksi.status = 'selesai'
├─ IF metode_pembayaran = 'poin':
│  └─ Tukang.poin += total_biaya  ⬅️ DITRANSFER!
└─ Client TIDAK bisa cancel lagi

TUKANG WITHDRAWAL
├─ Tukang.poin >= jumlah? ✅
├─ Tukang.poin -= jumlah  ⬅️ DIPOTONG LANGSUNG!
├─ biaya_admin = 2% (max 5,000)
├─ jumlah_bersih = jumlah - biaya_admin
└─ Admin transfer ke bank tukang

CANCEL/REJECT (REFUND)
├─ IF transaksi.poin_terpotong = true:
│  └─ Client.poin += total_biaya  ⬅️ DIKEMBALIKAN!
└─ Status: 'dibatalkan' atau 'ditolak'
```

---

## 🔄 STATE MACHINE - Status Transaksi

```
BOOKING (POIN)
   ├─ Client create booking dengan metode "poin"
   ├─ Client.poin -= total_biaya ✅
   └─ Status: "pending", poin_terpotong: true
      │
      ├─── [Tukang ACCEPT] ────► Status: "diterima"
      │                              │
      │                              ├─── [Tukang START] ────► Status: "dalam_proses"
      │                              │                             │
      │                              │                             └─── [Tukang COMPLETE] ────► Status: "selesai"
      │                              │                                                            ├─ Menunggu rating dari client
      │                              │                                                            └─── [Client SUBMIT RATING] ────► Rating dibuat
      │                              │                                                                                               ├─ Tukang.poin += total_biaya ✅
      │                              │                                                                                               └─ Transaksi selesai
      │                              │
      │                              └─── [Client CANCEL] ────► Status: "dibatalkan"
      │                                                           └─ Client.poin += total_biaya ✅ (REFUND)
      │
      ├─── [Tukang REJECT] ────► Status: "ditolak"
      │                           └─ Client.poin += total_biaya ✅ (REFUND)
      │
      └─── [Client CANCEL] ────► Status: "dibatalkan"
                                  └─ Client.poin += total_biaya ✅ (REFUND)
```

---

## ⚠️ IMPORTANT NOTES

### 1. **Poin Dipotong Saat Booking (Bukan Saat Selesai)**

- ✅ Client poin langsung dipotong saat create booking
- ✅ Ini untuk lock poin dan mencegah double spending
- ✅ Flag `poin_terpotong = true` untuk tracking refund

### 2. **Poin Ditransfer Saat Client Submit Rating (Bukan Saat Complete)**

- ✅ Tukang dapat poin HANYA setelah client memberikan rating
- ❌ Tidak dapat poin saat complete work
- ✅ Ini memastikan client puas dengan hasil pekerjaan
- ✅ Memberikan leverage kepada client untuk quality control

### 3. **Refund Otomatis Jika Cancel/Reject**

- ✅ Cek flag `poin_terpotong = true`
- ✅ Jika true → Kembalikan poin ke client
- ✅ Jika false (tunai) → Tidak ada refund poin

### 4. **Withdrawal Potong Langsung**

- ✅ Saldo tukang langsung dipotong saat request
- ✅ Jika ditolak admin → Poin dikembalikan
- ✅ Biaya admin 2% (max 5,000)

### 5. **Database Transaction**

- ✅ Semua operasi poin menggunakan `prisma.$transaction`
- ✅ Ini memastikan atomicity (all or nothing)
- ✅ Mencegah race condition dan data inconsistency

---

## 🧪 TESTING SCENARIOS

### Test Case 1: Happy Path (Poin)

```
1. Client topup 200,000 → saldo: 200,000
2. Client booking 150,000 (poin) → saldo: 50,000
3. Tukang accept → Status: "diterima"
4. Tukang start → Status: "dalam_proses"
5. Tukang complete → Status: "selesai"
   - Tukang saldo: BELUM berubah (menunggu rating)
6. Client submit rating (5 bintang)
   - Tukang saldo: +150,000
7. Tukang withdrawal 150,000
   - Biaya admin: 3,000
   - Jumlah bersih: 147,000
   - Tukang saldo: 0
8. Admin transfer 147,000 ke bank tukang
```

### Test Case 2: Client Cancel (Refund)

```
1. Client booking 150,000 (poin) → saldo: 50,000
2. Status: "pending"
3. Client cancel → poin refund +150,000
4. Client saldo: 200,000 ✅
```

### Test Case 3: Tukang Reject (Refund)

```
1. Client booking 150,000 (poin) → saldo: 50,000
2. Status: "pending"
3. Tukang reject → poin refund +150,000
4. Client saldo: 200,000 ✅
```

### Test Case 4: Insufficient Balance

```
1. Client saldo: 50,000
2. Client booking 150,000 (poin)
3. Error: "Saldo poin tidak mencukupi" ❌
4. Client saldo: 50,000 (tidak berubah)
```

---

## 📱 IMPLEMENTASI UI/UX SUGGESTION

### Client App:

1. **Tampilkan saldo poin** di dashboard utama
2. **Saat booking**: Tampilkan opsi metode pembayaran (Poin/Tunai)
3. **Jika pilih Poin**: Validasi saldo cukup sebelum submit
4. **Konfirmasi dialog**: "Anda akan memotong 150,000 poin. Lanjutkan?"
5. **Setelah booking**: Tampilkan badge "Dibayar dengan Poin"
6. **History transaksi**: Filter by metode_pembayaran

### Tukang App:

1. **Tampilkan saldo poin** di dashboard utama
2. **List orders**: Badge "Poin" vs "Tunai" untuk setiap order
3. **Setelah complete**: Notifikasi "Anda menerima 150,000 poin"
4. **Withdrawal**: Form dengan kalkulasi biaya admin otomatis
5. **History withdrawal**: Status (pending/selesai/ditolak)

---

## 🔐 SECURITY CONSIDERATIONS

1. **Validasi Saldo Selalu di Backend**

   - Jangan percaya frontend validation
   - Selalu cek saldo di database

2. **Database Transaction**

   - Gunakan `$transaction` untuk semua operasi poin
   - Mencegah race condition

3. **Audit Trail**

   - Log semua operasi poin (topup, potong, refund, transfer)
   - Simpan timestamp dan user_id

4. **Rate Limiting**

   - Batasi request booking per user per hari
   - Mencegah spam atau abuse

5. **Minimum Withdrawal**
   - Set minimum 50,000 untuk withdrawal
   - Mencegah terlalu banyak transaksi kecil

---

📌 **Dokumentasi ini menjelaskan complete flow pembayaran poin dari client topup sampai tukang withdrawal ke bank!**
