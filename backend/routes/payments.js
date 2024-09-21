const express = require('express');
const router = express.Router();

const { processPayment } = require('../controllers/payments');
const { auth, isStudent } = require('../middleware/auth');

router.post('/processPayment', auth, isStudent, processPayment);

module.exports = router;