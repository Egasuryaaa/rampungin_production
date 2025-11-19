// File: src/routes/index.js
const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const clientRoutes = require('./client.routes');
const tukangRoutes = require('./tukang.routes');
const adminRoutes = require('./admin.routes');

router.use('/auth', authRoutes);
router.use('/client', clientRoutes);
router.use('/tukang', tukangRoutes);
router.use('/admin', adminRoutes);

module.exports = router;