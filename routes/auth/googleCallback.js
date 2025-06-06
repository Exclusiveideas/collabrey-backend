// const express = require("express");
// const router = express.Router();
// const { createOAuth2Client } = require("../../config/googleOAuth");
// const { supabase } = require("../../lib/supabaseClient");
// const { google } = require("googleapis");
// const jwt = require("jsonwebtoken");

// router.get("/callback", async (req, res) => {
//   const code = req.query.code;
//   const stateToken = req.query.state || null;

//   let userId = null;

//   // Verify JWT state token
//   if (stateToken) {
//     try {
//       const decoded = jwt.verify(stateToken, process.env.JWT_SECRET);
//       userId = decoded.user_id;
//     } catch (err) {
//       console.warn("Invalid or expired state token:", err.message);
//       return res.status(401).send("Invalid or expired Google login session.");
//     }
//   }

//   const oauth2Client = createOAuth2Client();

//   try {
//     const { tokens } = await oauth2Client.getToken(code);
//     oauth2Client.setCredentials(tokens);

//     // Get user info from Google
//     const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
//     const { data: userInfo } = await oauth2.userinfo.get();
//     const email = userInfo.email;

//     // If userId still null, find by Google email or create new user
//     if (!userId) {
//       const { data: existingUser, error } = await supabase
//         .from("users")
//         .select("id")
//         .eq("email", email)
//         .single();

//       if (error || !existingUser) {
//         const { data: newUser, error: createError } = await supabase
//           .from("users")
//           .insert({ email, full_name: userInfo.name })
//           .select()
//           .single();

//         if (createError) {
//           console.error("User creation error", createError);
//           return res.status(500).send("Failed to create user");
//         }

//         userId = newUser.id;
//       } else {
//         userId = existingUser.id;
//       }
//     }

//     // Upsert OAuth tokens
//     await supabase.from("google_oauth_tokens").upsert({
//       user_id: userId,
//       access_token: tokens.access_token,
//       refresh_token: tokens.refresh_token,
//       expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
//       email,
//     });

//     // Update profile flag
//     await supabase.from("profiles").update({
//       google_connected: true,
//       google_email: email,
//     }).eq("id", userId);

//     res.redirect("/dashboard?google=connected");
//   } catch (err) {
//     console.error("OAuth callback error:", err);
//     res.status(500).send("Google authentication failed.");
//   }
// });

// module.exports = router;
