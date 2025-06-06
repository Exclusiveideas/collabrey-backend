// const express = require("express");
// const router = express.Router();
// const { createOAuth2Client } = require("../../config/googleOAuth");
// const { isAuthenticatedUser } = require("../../middlewares/authMiddleware");
// const jwt = require("jsonwebtoken");

// router.get("/", isAuthenticatedUser, (req, res) => {
//   const oauth2Client = createOAuth2Client();

//   const scopes = [
//     "https://www.googleapis.com/auth/calendar.events",
//     "https://www.googleapis.com/auth/userinfo.email",
//     "openid"
//   ];

//   // Sign the user_id into a JWT with expiry (e.g., 10 mins)
//   const stateToken = jwt.sign(
//     { user_id: req.user?.id },
//     process.env.JWT_SECRET,
//     { expiresIn: "10m" }
//   );

//   const authUrl = oauth2Client.generateAuthUrl({
//     access_type: "offline",
//     prompt: "consent",
//     scope: scopes,
//     state: stateToken,
//   });

//   res.redirect(authUrl);
// });

// module.exports = router;
