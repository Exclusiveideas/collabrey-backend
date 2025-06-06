const express = require('express');
const { zoomWebhookHandler } = require('../controllers/webhooksController');

const router = express.Router();

// Routes
router.post('/', zoomWebhookHandler);      

module.exports = router;