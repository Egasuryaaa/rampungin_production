// File: src/controllers/admin.controller.js
const prisma = require('../utils/prisma.util');
const { sendResponse } = require('../utils/response.util');
const fs = require('fs');
const path = require('path');

// ============================================
// A. DASHBOARD & USERS
// ============================================

// 1. GET DASHBOARD STATISTICS
exports.getDashboard = async (req, res) => {
  try {
    // Ambil statistik ringkas
    const [
      totalUsers,
      totalClient,
      totalTukang,
      totalAdmin,
      pendingTopup,
      pendingWithdrawal,
      unverifiedTukang,
      totalTransaksi,
      pendingTransaksi,
      completedTransaksi,
    ] = await Promise.all([
      prisma.users.count(),
      prisma.users.count({ where: { roles: { name: 'client' } } }),
      prisma.users.count({ where: { roles: { name: 'tukang' } } }),
      prisma.users.count({ where: { roles: { name: 'admin' } } }),
      prisma.topup.count({ where: { status: 'pending' } }),
      prisma.penarikan.count({ where: { status: 'pending' } }),
      prisma.users.count({ 
        where: { 
          roles: { name: 'tukang' },
          is_verified: false 
        } 
      }),
      prisma.transaksi.count(),
      prisma.transaksi.count({ where: { status: 'pending' } }),
      prisma.transaksi.count({ where: { status: 'selesai' } }),
    ]);

    const data = {
      users: {
        total: totalUsers,
        client: totalClient,
        tukang: totalTukang,
        admin: totalAdmin,
      },
      finance: {
        pending_topup: pendingTopup,
        pending_withdrawal: pendingWithdrawal,
      },
      verifications: {
        unverified_tukang: unverifiedTukang,
      },
      transactions: {
        total: totalTransaksi,
        pending: pendingTransaksi,
        completed: completedTransaksi,
      },
    };

    sendResponse(res, 200, 'success', 'Dashboard berhasil dimuat', data);
  } catch (error) {
    console.error('getDashboard error:', error);
    sendResponse(res, 500, 'error', 'Internal Server Error', error.message);
  }
};

// 2. GET ALL USERS (with filter)
exports.getAllUsers = async (req, res) => {
  try {
    const { role, is_active, is_verified, search, page = 1, limit = 20 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build filter
    const where = {};
    
    if (role) {
      where.roles = { name: role };
    }
    
    if (is_active !== undefined) {
      where.is_active = is_active === 'true';
    }
    
    if (is_verified !== undefined) {
      where.is_verified = is_verified === 'true';
    }
    
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { nama_lengkap: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.users.findMany({
        where,
        skip,
        take,
        include: {
          roles: true,
          profil_tukang: true,
        },
        orderBy: { created_at: 'desc' },
      }),
      prisma.users.count({ where }),
    ]);

    // Remove sensitive data
    const sanitizedUsers = users.map(user => {
      const { password_hash, ...userData } = user;
      return userData;
    });

    const data = {
      users: sanitizedUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        total_pages: Math.ceil(total / parseInt(limit)),
      },
    };

    sendResponse(res, 200, 'success', 'Data users berhasil dimuat', data);
  } catch (error) {
    console.error('getAllUsers error:', error);
    sendResponse(res, 500, 'error', 'Internal Server Error', error.message);
  }
};

// 3. UPDATE USER STATUS (Ban/Unban)
exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return sendResponse(res, 400, 'error', 'is_active harus berupa boolean (true/false)');
    }

    // Check if user exists
    const user = await prisma.users.findUnique({
      where: { id: parseInt(id) },
      include: { roles: true },
    });

    if (!user) {
      return sendResponse(res, 404, 'error', 'User tidak ditemukan');
    }

    // Prevent admin from banning themselves
    if (parseInt(id) === req.user.id) {
      return sendResponse(res, 400, 'error', 'Anda tidak dapat mengubah status akun sendiri');
    }

    // Prevent banning other admins
    if (user.roles.name === 'admin') {
      return sendResponse(res, 403, 'error', 'Tidak dapat mengubah status admin lain');
    }

    const updatedUser = await prisma.users.update({
      where: { id: parseInt(id) },
      data: { 
        is_active,
        updated_at: new Date(),
      },
      include: { roles: true },
    });

    const { password_hash, ...userData } = updatedUser;

    sendResponse(
      res, 
      200, 
      'success', 
      `User berhasil ${is_active ? 'diaktifkan' : 'dinonaktifkan'}`, 
      userData
    );
  } catch (error) {
    console.error('updateUserStatus error:', error);
    sendResponse(res, 500, 'error', 'Internal Server Error', error.message);
  }
};

// ============================================
// B. MASTER DATA KATEGORI
// ============================================

// 4. GET ALL CATEGORIES
exports.getAllCategories = async (req, res) => {
  try {
    const { is_active, search } = req.query;
    
    const where = {};
    
    if (is_active !== undefined) {
      where.is_active = is_active === 'true';
    }
    
    if (search) {
      where.OR = [
        { nama: { contains: search, mode: 'insensitive' } },
        { deskripsi: { contains: search, mode: 'insensitive' } },
      ];
    }

    const categories = await prisma.kategori.findMany({
      where,
      orderBy: { nama: 'asc' },
    });

    sendResponse(res, 200, 'success', 'Data kategori berhasil dimuat', categories);
  } catch (error) {
    console.error('getAllCategories error:', error);
    sendResponse(res, 500, 'error', 'Internal Server Error', error.message);
  }
};

// 5. CREATE CATEGORY
exports.createCategory = async (req, res) => {
  try {
    const { nama, deskripsi } = req.body;

    if (!nama || nama.trim() === '') {
      return sendResponse(res, 400, 'error', 'Nama kategori wajib diisi');
    }

    // Check if category name already exists
    const existing = await prisma.kategori.findFirst({
      where: { nama: { equals: nama.trim(), mode: 'insensitive' } },
    });

    if (existing) {
      return sendResponse(res, 400, 'error', 'Kategori dengan nama tersebut sudah ada');
    }

    const category = await prisma.kategori.create({
      data: {
        nama: nama.trim(),
        deskripsi: deskripsi?.trim() || null,
        is_active: true,
      },
    });

    sendResponse(res, 201, 'success', 'Kategori berhasil dibuat', category);
  } catch (error) {
    console.error('createCategory error:', error);
    sendResponse(res, 500, 'error', 'Internal Server Error', error.message);
  }
};

// 6. UPDATE CATEGORY
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { nama, deskripsi, is_active } = req.body;

    // Check if category exists
    const category = await prisma.kategori.findUnique({
      where: { id: parseInt(id) },
    });

    if (!category) {
      return sendResponse(res, 404, 'error', 'Kategori tidak ditemukan');
    }

    // Check duplicate name (exclude current category)
    if (nama) {
      const existing = await prisma.kategori.findFirst({
        where: { 
          nama: { equals: nama.trim(), mode: 'insensitive' },
          NOT: { id: parseInt(id) },
        },
      });

      if (existing) {
        return sendResponse(res, 400, 'error', 'Kategori dengan nama tersebut sudah ada');
      }
    }

    const updateData = { updated_at: new Date() };
    
    if (nama !== undefined) updateData.nama = nama.trim();
    if (deskripsi !== undefined) updateData.deskripsi = deskripsi?.trim() || null;
    if (is_active !== undefined) updateData.is_active = is_active;

    const updatedCategory = await prisma.kategori.update({
      where: { id: parseInt(id) },
      data: updateData,
    });

    sendResponse(res, 200, 'success', 'Kategori berhasil diupdate', updatedCategory);
  } catch (error) {
    console.error('updateCategory error:', error);
    sendResponse(res, 500, 'error', 'Internal Server Error', error.message);
  }
};

// 7. DELETE CATEGORY (Soft Delete)
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const category = await prisma.kategori.findUnique({
      where: { id: parseInt(id) },
    });

    if (!category) {
      return sendResponse(res, 404, 'error', 'Kategori tidak ditemukan');
    }

    // Soft delete: set is_active to false
    const deletedCategory = await prisma.kategori.update({
      where: { id: parseInt(id) },
      data: { 
        is_active: false,
        updated_at: new Date(),
      },
    });

    sendResponse(res, 200, 'success', 'Kategori berhasil dihapus (soft delete)', deletedCategory);
  } catch (error) {
    console.error('deleteCategory error:', error);
    sendResponse(res, 500, 'error', 'Internal Server Error', error.message);
  }
};

// ============================================
// C. VERIFIKASI TUKANG
// ============================================

// 8. GET UNVERIFIED TUKANG
exports.getUnverifiedTukang = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [tukangList, total] = await Promise.all([
      prisma.users.findMany({
        where: {
          roles: { name: 'tukang' },
          is_verified: false,
        },
        skip,
        take,
        include: {
          roles: true,
          profil_tukang: true,
          kategori_tukang: {
            include: { kategori: true },
          },
        },
        orderBy: { created_at: 'desc' },
      }),
      prisma.users.count({
        where: {
          roles: { name: 'tukang' },
          is_verified: false,
        },
      }),
    ]);

    // Remove sensitive data
    const sanitizedTukang = tukangList.map(tukang => {
      const { password_hash, ...tukangData } = tukang;
      return tukangData;
    });

    const data = {
      tukang: sanitizedTukang,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        total_pages: Math.ceil(total / parseInt(limit)),
      },
    };

    sendResponse(res, 200, 'success', 'Data tukang belum terverifikasi berhasil dimuat', data);
  } catch (error) {
    console.error('getUnverifiedTukang error:', error);
    sendResponse(res, 500, 'error', 'Internal Server Error', error.message);
  }
};

// 9. VERIFY TUKANG (Approve/Reject)
exports.verifyTukang = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return sendResponse(res, 400, 'error', 'Action harus "approve" atau "reject"');
    }

    // Check if user exists and is tukang
    const tukang = await prisma.users.findUnique({
      where: { id: parseInt(id) },
      include: { 
        roles: true,
        profil_tukang: true,
      },
    });

    if (!tukang) {
      return sendResponse(res, 404, 'error', 'User tidak ditemukan');
    }

    if (tukang.roles.name !== 'tukang') {
      return sendResponse(res, 400, 'error', 'User bukan tukang');
    }

    if (!tukang.profil_tukang) {
      return sendResponse(res, 400, 'error', 'Profil tukang belum lengkap');
    }

    if (tukang.is_verified) {
      return sendResponse(res, 400, 'error', 'Tukang sudah terverifikasi');
    }

    const is_verified = action === 'approve';

    const updatedTukang = await prisma.users.update({
      where: { id: parseInt(id) },
      data: { 
        is_verified,
        updated_at: new Date(),
      },
      include: { 
        roles: true,
        profil_tukang: true,
      },
    });

    const { password_hash, ...tukangData } = updatedTukang;

    sendResponse(
      res, 
      200, 
      'success', 
      `Tukang berhasil ${action === 'approve' ? 'disetujui' : 'ditolak'}`, 
      tukangData
    );
  } catch (error) {
    console.error('verifyTukang error:', error);
    sendResponse(res, 500, 'error', 'Internal Server Error', error.message);
  }
};

// ============================================
// D. KEUANGAN: TOP-UP
// ============================================

// 10. GET PENDING TOPUP
exports.getPendingTopup = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [topupList, total] = await Promise.all([
      prisma.topup.findMany({
        where: { status: 'pending' },
        skip,
        take,
        include: {
          users_topup_user_idTousers: {
            select: {
              id: true,
              username: true,
              email: true,
              nama_lengkap: true,
              poin: true,
            },
          },
        },
        orderBy: { created_at: 'asc' },
      }),
      prisma.topup.count({ where: { status: 'pending' } }),
    ]);

    const data = {
      topup: topupList,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        total_pages: Math.ceil(total / parseInt(limit)),
      },
    };

    sendResponse(res, 200, 'success', 'Data topup pending berhasil dimuat', data);
  } catch (error) {
    console.error('getPendingTopup error:', error);
    sendResponse(res, 500, 'error', 'Internal Server Error', error.message);
  }
};

// 11. VERIFY TOPUP (Approve/Reject)
exports.verifyTopup = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, alasan_penolakan } = req.body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return sendResponse(res, 400, 'error', 'Action harus "approve" atau "reject"');
    }

    if (action === 'reject' && (!alasan_penolakan || alasan_penolakan.trim() === '')) {
      return sendResponse(res, 400, 'error', 'Alasan penolakan wajib diisi untuk reject');
    }

    // Check if topup exists
    const topup = await prisma.topup.findUnique({
      where: { id: parseInt(id) },
      include: {
        users_topup_user_idTousers: true,
      },
    });

    if (!topup) {
      return sendResponse(res, 404, 'error', 'Topup tidak ditemukan');
    }

    if (topup.status !== 'pending') {
      return sendResponse(res, 400, 'error', `Topup sudah di-${topup.status}`);
    }

    const adminId = req.user.id;
    const now = new Date();

    // Use transaction for financial operations
    const result = await prisma.$transaction(async (tx) => {
      if (action === 'approve') {
        // 1. Update topup status
        const updatedTopup = await tx.topup.update({
          where: { id: parseInt(id) },
          data: {
            status: 'berhasil',
            diverifikasi_oleh: adminId,
            waktu_verifikasi: now,
            updated_at: now,
          },
          include: {
            users_topup_user_idTousers: {
              select: {
                id: true,
                username: true,
                email: true,
                nama_lengkap: true,
                poin: true,
              },
            },
          },
        });

        // 2. Add poin to user
        await tx.users.update({
          where: { id: topup.user_id },
          data: {
            poin: {
              increment: parseInt(topup.jumlah),
            },
            updated_at: now,
          },
        });

        return { topup: updatedTopup, action: 'approve' };
      } else {
        // Reject: only update topup status
        const updatedTopup = await tx.topup.update({
          where: { id: parseInt(id) },
          data: {
            status: 'ditolak',
            diverifikasi_oleh: adminId,
            waktu_verifikasi: now,
            alasan_penolakan: alasan_penolakan.trim(),
            updated_at: now,
          },
          include: {
            users_topup_user_idTousers: {
              select: {
                id: true,
                username: true,
                email: true,
                nama_lengkap: true,
                poin: true,
              },
            },
          },
        });

        return { topup: updatedTopup, action: 'reject' };
      }
    });

    sendResponse(
      res, 
      200, 
      'success', 
      `Topup berhasil ${result.action === 'approve' ? 'disetujui' : 'ditolak'}`, 
      result.topup
    );
  } catch (error) {
    console.error('verifyTopup error:', error);
    sendResponse(res, 500, 'error', 'Internal Server Error', error.message);
  }
};

// ============================================
// E. KEUANGAN: WITHDRAWAL
// ============================================

// 12. GET PENDING WITHDRAWAL
exports.getPendingWithdrawal = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const [withdrawalList, total] = await Promise.all([
      prisma.penarikan.findMany({
        where: { status: 'pending' },
        skip,
        take,
        include: {
          users_penarikan_tukang_idTousers: {
            select: {
              id: true,
              username: true,
              email: true,
              nama_lengkap: true,
              poin: true,
            },
          },
        },
        orderBy: { created_at: 'asc' },
      }),
      prisma.penarikan.count({ where: { status: 'pending' } }),
    ]);

    const data = {
      withdrawal: withdrawalList,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        total_pages: Math.ceil(total / parseInt(limit)),
      },
    };

    sendResponse(res, 200, 'success', 'Data withdrawal pending berhasil dimuat', data);
  } catch (error) {
    console.error('getPendingWithdrawal error:', error);
    sendResponse(res, 500, 'error', 'Internal Server Error', error.message);
  }
};

// 13. CONFIRM WITHDRAWAL (Approve with proof)
exports.confirmWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if file is uploaded
    if (!req.file) {
      return sendResponse(res, 400, 'error', 'Bukti transfer wajib diupload');
    }

    // Check if withdrawal exists
    const withdrawal = await prisma.penarikan.findUnique({
      where: { id: parseInt(id) },
      include: {
        users_penarikan_tukang_idTousers: true,
      },
    });

    if (!withdrawal) {
      return sendResponse(res, 404, 'error', 'Withdrawal tidak ditemukan');
    }

    if (withdrawal.status !== 'pending') {
      return sendResponse(res, 400, 'error', `Withdrawal sudah di-${withdrawal.status}`);
    }

    const adminId = req.user.id;
    const now = new Date();
    const buktiPath = `uploads/withdrawal/${req.file.filename}`;

    // Use transaction
    const updatedWithdrawal = await prisma.penarikan.update({
      where: { id: parseInt(id) },
      data: {
        status: 'selesai',
        diproses_oleh: adminId,
        waktu_diproses: now,
        bukti_transfer: buktiPath,
        updated_at: now,
      },
      include: {
        users_penarikan_tukang_idTousers: {
          select: {
            id: true,
            username: true,
            email: true,
            nama_lengkap: true,
            poin: true,
          },
        },
        users_penarikan_diproses_olehTousers: {
          select: {
            id: true,
            username: true,
            nama_lengkap: true,
          },
        },
      },
    });

    sendResponse(res, 200, 'success', 'Withdrawal berhasil dikonfirmasi', updatedWithdrawal);
  } catch (error) {
    console.error('confirmWithdrawal error:', error);
    sendResponse(res, 500, 'error', 'Internal Server Error', error.message);
  }
};

// 14. REJECT WITHDRAWAL (Refund poin)
exports.rejectWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;
    const { alasan_penolakan } = req.body;

    if (!alasan_penolakan || alasan_penolakan.trim() === '') {
      return sendResponse(res, 400, 'error', 'Alasan penolakan wajib diisi');
    }

    // Check if withdrawal exists
    const withdrawal = await prisma.penarikan.findUnique({
      where: { id: parseInt(id) },
      include: {
        users_penarikan_tukang_idTousers: true,
      },
    });

    if (!withdrawal) {
      return sendResponse(res, 404, 'error', 'Withdrawal tidak ditemukan');
    }

    if (withdrawal.status !== 'pending') {
      return sendResponse(res, 400, 'error', `Withdrawal sudah di-${withdrawal.status}`);
    }

    const adminId = req.user.id;
    const now = new Date();

    // Use transaction for financial operations
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update withdrawal status
      const updatedWithdrawal = await tx.penarikan.update({
        where: { id: parseInt(id) },
        data: {
          status: 'ditolak',
          diproses_oleh: adminId,
          waktu_diproses: now,
          alasan_penolakan: alasan_penolakan.trim(),
          updated_at: now,
        },
        include: {
          users_penarikan_tukang_idTousers: {
            select: {
              id: true,
              username: true,
              email: true,
              nama_lengkap: true,
              poin: true,
            },
          },
          users_penarikan_diproses_olehTousers: {
            select: {
              id: true,
              username: true,
              nama_lengkap: true,
            },
          },
        },
      });

      // 2. Refund poin to tukang (return the deducted amount)
      await tx.users.update({
        where: { id: withdrawal.tukang_id },
        data: {
          poin: {
            increment: parseInt(withdrawal.jumlah), // Return the original amount (before fee)
          },
          updated_at: now,
        },
      });

      return updatedWithdrawal;
    });

    sendResponse(res, 200, 'success', 'Withdrawal ditolak dan poin dikembalikan', result);
  } catch (error) {
    console.error('rejectWithdrawal error:', error);
    sendResponse(res, 500, 'error', 'Internal Server Error', error.message);
  }
};

// ============================================
// F. MONITORING TRANSAKSI
// ============================================

// 15. GET ALL TRANSACTIONS
exports.getAllTransactions = async (req, res) => {
  try {
    const { 
      status, 
      metode_pembayaran, 
      search, 
      start_date, 
      end_date,
      page = 1, 
      limit = 20 
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Build filter
    const where = {};
    
    if (status) {
      where.status = status;
    }
    
    if (metode_pembayaran) {
      where.metode_pembayaran = metode_pembayaran;
    }
    
    if (search) {
      where.OR = [
        { nomor_pesanan: { contains: search, mode: 'insensitive' } },
        { judul_layanan: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (start_date || end_date) {
      where.created_at = {};
      if (start_date) where.created_at.gte = new Date(start_date);
      if (end_date) where.created_at.lte = new Date(end_date);
    }

    const [transactions, total] = await Promise.all([
      prisma.transaksi.findMany({
        where,
        skip,
        take,
        include: {
          users_transaksi_client_idTousers: {
            select: {
              id: true,
              username: true,
              nama_lengkap: true,
            },
          },
          users_transaksi_tukang_idTousers: {
            select: {
              id: true,
              username: true,
              nama_lengkap: true,
            },
          },
          kategori: true,
          rating: true,
        },
        orderBy: { created_at: 'desc' },
      }),
      prisma.transaksi.count({ where }),
    ]);

    const data = {
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        total_pages: Math.ceil(total / parseInt(limit)),
      },
    };

    sendResponse(res, 200, 'success', 'Data transaksi berhasil dimuat', data);
  } catch (error) {
    console.error('getAllTransactions error:', error);
    sendResponse(res, 500, 'error', 'Internal Server Error', error.message);
  }
};

// 16. GET TRANSACTION DETAIL
exports.getTransactionDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await prisma.transaksi.findUnique({
      where: { id: parseInt(id) },
      include: {
        users_transaksi_client_idTousers: {
          select: {
            id: true,
            username: true,
            email: true,
            nama_lengkap: true,
            no_telp: true,
          },
        },
        users_transaksi_tukang_idTousers: {
          select: {
            id: true,
            username: true,
            email: true,
            nama_lengkap: true,
            no_telp: true,
            profil_tukang: true,
          },
        },
        kategori: true,
        rating: true,
        riwayat_status_transaksi: {
          include: {
            users: {
              select: {
                id: true,
                username: true,
                nama_lengkap: true,
              },
            },
          },
          orderBy: { created_at: 'asc' },
        },
      },
    });

    if (!transaction) {
      return sendResponse(res, 404, 'error', 'Transaksi tidak ditemukan');
    }

    sendResponse(res, 200, 'success', 'Detail transaksi berhasil dimuat', transaction);
  } catch (error) {
    console.error('getTransactionDetail error:', error);
    sendResponse(res, 500, 'error', 'Internal Server Error', error.message);
  }
};
