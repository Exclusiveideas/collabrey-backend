const express = require('express');
const { isAuthenticatedUser } = require('../middlewares/authMiddleware');
const { createMeeting, joinMeeting, getMyMeetings, endMeeting } = require('../controllers/meetingController');

const router = express.Router();

// Routes
router.post('/create', isAuthenticatedUser, createMeeting);           // create a meeting
router.post('/join', isAuthenticatedUser, joinMeeting);             // join a meeting
router.get('/:id/end', isAuthenticatedUser, endMeeting);             // List user’s meetings
router.get('/', isAuthenticatedUser, getMyMeetings);             // List user’s meetings

module.exports = router;