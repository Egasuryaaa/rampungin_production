// File: src/utils/prisma.util.js
const { PrismaClient } = require('../generated/client'); // <-- Ganti ke path lokal
const prisma = new PrismaClient();
module.exports = prisma;