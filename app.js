const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');

const userRoutes = require('./routes/userRoutes.js');
const cookieParser = require('cookie-parser');

const app = express();


dotenv.config(); // Load environment variables

// Middleware
app.use(cors({
  origin: ["http://localhost:3000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Content-Length", "X-Requested-With"],
}));

app.use(bodyParser.json());
app.use(cookieParser());

app.options(/.*/, cors({
  origin: ["http://localhost:3000"],
  credentials: true,
}));


// Routes
app.use('/api/user', userRoutes);

// Health Check Route
app.get('/', (req, res) => {
    res.status(200).json({ message: 'Welcome to COLLABREY API!' });
});

module.exports = app;
