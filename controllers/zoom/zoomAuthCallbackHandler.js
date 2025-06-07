const axios = require('axios');

const clientId = process.env.ZOOM_OAUTH_CLIENT_ID;      // Zoom OAuth client ID
const clientSecret = process.env.ZOOM_OAUTH_CLIENT_SECRET;  // Zoom OAuth client secret
const redirectUri = process.env.ZOOM_REDIRECT_URI;    // OAuth redirect URI (must match Zoom app)



exports.zoomAuthCallbackHandler = async (req, res) => {
  const authorizationCode = req.query.code;
  const error = req.query.error;

  if (error) {
    // User denied consent or an error occurred
    return res.status(400).json({ error: `OAuth error: ${error}` });
  }

  if (!authorizationCode) {
    return res.status(400).json({ error: 'Missing authorization code' });
  }

  try {
    // Exchange authorization code for access token
    const tokenResponse = await axios.post(
      'https://zoom.us/oauth/token',
      null,  // no request body, parameters go in URL or headers
      {
        params: {
          grant_type: 'authorization_code',
          code: authorizationCode,
          redirect_uri: redirectUri,
        },
        headers: {
          // Basic Auth header with clientId and clientSecret
          Authorization:
            'Basic ' +
            Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    // TODO: Save tokens in your DB/session for API calls on behalf of this user
    // e.g. saveTokensForUser(userId, access_token, refresh_token, expires_in);

    // Redirect user or respond success
    res.status(200).json({
      message: 'Zoom OAuth successful',
      access_token,
      refresh_token,
      expires_in,
    });
  } catch (err) {
    console.error('Error exchanging Zoom OAuth code:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to get access token from Zoom' });
  }
}