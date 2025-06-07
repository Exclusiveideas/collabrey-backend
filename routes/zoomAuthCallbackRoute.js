const express = require('express');
const { zoomAuthCallbackHandler } = require('../controllers/zoom/zoomAuthCallbackHandler');

const router = express.Router();

// Routes
router.get('/', zoomAuthCallbackHandler);      

module.exports = router;