const express = require('express');
const { isAuthenticatedUser } = require('../middlewares/authMiddleware');
const { handleGenerateZoomSignature, handleGenerateZAKToken } = require('../controllers/zoomController');

const router = express.Router();

// Routes
router.post('/signature', isAuthenticatedUser, handleGenerateZoomSignature);      
router.get('/zak-token', isAuthenticatedUser, handleGenerateZAKToken);      

module.exports = router;