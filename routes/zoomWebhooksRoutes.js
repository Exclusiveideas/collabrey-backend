const express = require('express');
const { zoomWebhookHandler } = require('../controllers/zoomWebhooksController');

const router = express.Router();

// Routes
router.post('/', zoomWebhookHandler);      

module.exports = router;