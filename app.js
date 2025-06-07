const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser'); 

const userRoutes = require('./routes/userRoutes.js');
const meetingRoutes = require('./routes/meetingRoutes.js');
const teamsRoutes = require('./routes/teamsRoutes.js');
const zoomWebhookRouter = require('./routes/zoomWebhooksRoutes.js');
const zoomAuthCallbackRoute = require('./routes/zoomAuthCallbackRoute.js');
const attendeeWebhookRouter = require('./routes/attendeeWebhooksRoutes.js');
const generalZoomRoutes = require('./routes/generalZoomRoutes.js');
// const googleAuthRouter = require("./routes/auth/google");
// const googleCallbackRouter = require("./routes/auth/googleCallback");



const cookieParser = require('cookie-parser');

const app = express();


dotenv.config(); // Load environment variables

// webhook routes
app.use('/api/webhooks/zoom', bodyParser.raw({ type: 'application/json' }), zoomWebhookRouter);
app.use('/api/webhooks/attendee', bodyParser.raw({ type: 'application/json' }), attendeeWebhookRouter);

// Middleware
app.use(cors({
  origin: ["http://localhost:3000", "https://collabrey.vercel.app/"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Content-Length", "X-Requested-With"],
}));

app.use(cookieParser());
app.use(express.json());

app.options(/.*/, cors({
  origin: ["http://localhost:3000", "https://collabrey.vercel.app/"],
  credentials: true,
}));


// Routes
app.use('/api/user', userRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/teams', teamsRoutes);

// zoom routes
app.use('/api/zoom', generalZoomRoutes);

// zoom auth callback
app.use('/api/auth/zoom/callback', zoomAuthCallbackRoute);

// google auth routes
// app.use("/api/auth/google", googleAuthRouter);
// app.use("/api/auth/google/callback", googleCallbackRouter);

// Health Check Route
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Welcome to COLLABREY API!' });
});

module.exports = app;
