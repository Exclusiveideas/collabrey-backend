const express = require('express');
const { isAuthenticatedUser } = require('../middlewares/authMiddleware');
const { createMeeting, joinMeeting, endMeeting, getUserMeetings } = require('../controllers/meetingController');

const router = express.Router();

// Routes
router.post('/create', isAuthenticatedUser, createMeeting);           // create a meeting
router.post('/join', isAuthenticatedUser, joinMeeting);             // join a meeting
// router.get('/:id/end', isAuthenticatedUser, endMeeting);             // end meeting
// router.get('/', isAuthenticatedUser, getMyMeetings);             // List user’s meetings
router.get('/get-user-meetings', isAuthenticatedUser, getUserMeetings);             // List user’s meetings

module.exports = router;