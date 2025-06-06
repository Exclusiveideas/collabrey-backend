const express = require('express');
const { isAuthenticatedUser } = require('../middlewares/authMiddleware');
const { createTeam, addToTeam } = require('../controllers/teamController');

const router = express.Router();

// Routes
router.post('/create', isAuthenticatedUser, createTeam);           // create a team
router.post('/addToTeam', isAuthenticatedUser, addToTeam);             // add a user to a team
// router.get('/send-request', isAuthenticatedUser, sendRequest);             // send a request to admin to join a team

module.exports = router;