// utils/googleAuth.js
const { google } = require("googleapis");
const { supabase } = require("../lib/supabaseClient"); // Adjust this import path to your Supabase client

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

async function getUserGoogleOAuthClient(user_id) {
  // 1. Fetch token record
  const { data: tokenData, error } = await supabase
    .from("google_oauth_tokens")
    .select("*")
    .eq("user_id", user_id)
    .single();

  if (error || !tokenData) {
    console.error("OAuth token fetch error:", error?.message || "No token found");
    return null;
  }

  // 2. Create OAuth2 client
  const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expiry_date: new Date(tokenData.expires_at).getTime(),
  });

  // 3. Automatically refresh token if expired
  oauth2Client.on("tokens", async (tokens) => {
    const updates = {
      access_token: tokens.access_token,
      expires_at: new Date(Date.now() + tokens.expiry_date).toISOString(),
    };

    if (tokens.refresh_token) {
      updates.refresh_token = tokens.refresh_token;
    }

    await supabase
      .from("google_oauth_tokens")
      .update(updates)
      .eq("user_id", user_id);
  });

  return oauth2Client;
}

module.exports = {
  getUserGoogleOAuthClient,
};
