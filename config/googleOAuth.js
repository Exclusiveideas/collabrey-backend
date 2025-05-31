// config/googleOAuth.js
const { google } = require("googleapis");

function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI // e.g., http://localhost:3000/api/auth/google/callback
  );
}

module.exports = { createOAuth2Client };
