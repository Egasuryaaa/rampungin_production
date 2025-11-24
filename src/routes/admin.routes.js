// File: src/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { verifyToken, isAdmin } = require('../middleware/auth.middleware');
const { uploadWithdrawal } = require('../middleware/upload.middleware');

// Semua route admin harus authenticated dan role admin
router.use(verifyToken);
router.use(isAdmin);

// ============================================
// A. DASHBOARD & USERS
// ============================================

// Dashboard statistics
router.get('/dashboard', adminController.getDashboard);

// User management
router.get('/users', adminController.getAllUsers);
router.put('/users/:id/status', adminController.updateUserStatus);

// ============================================
// B. MASTER DATA KATEGORI
// ============================================

router.get('/categories', adminController.getAllCategories);
router.post('/categories', adminController.createCategory);
router.put('/categories/:id', adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);

// ============================================
// C. VERIFIKASI TUKANG
// ============================================

router.get('/verifications/tukang', adminController.getUnverifiedTukang);
router.put('/verifications/tukang/:id', adminController.verifyTukang);

// ============================================
// D. KEUANGAN: TOP-UP
// ============================================

router.get('/finance/topup', adminController.getTopupHistory);
router.get('/finance/topup/:id', adminController.getTopupDetail);
router.put('/finance/topup/:id', adminController.verifyTopup);

// ============================================
// E. KEUANGAN: WITHDRAWAL
// ============================================

router.get('/finance/withdrawal', adminController.getWithdrawalHistory);
router.get('/finance/withdrawal/:id', adminController.getWithdrawalDetail);
router.put(
  '/finance/withdrawal/:id/confirm', 
  uploadWithdrawal.single('bukti_transfer'),
  adminController.confirmWithdrawal
);
router.put('/finance/withdrawal/:id/reject', adminController.rejectWithdrawal);

// ============================================
// F. MONITORING TRANSAKSI
// ============================================

router.get('/transactions', adminController.getAllTransactions);
router.get('/transactions/:id', adminController.getTransactionDetail);

module.exports = router;
