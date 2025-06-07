const express = require('express');
const { attendeeTranscriptHandler } = require('../controllers/attendeeWebhooksController');

const router = express.Router();

// Routes
router.post('/transcript', attendeeTranscriptHandler);      

module.exports = router;