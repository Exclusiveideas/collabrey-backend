const axios = require('axios');
const qs = require('qs');

const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID;
const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID;
const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET;

let accessToken = null;
let tokenExpiresAt = 0;

exports.getZoomAccessToken = async() => {
  if (accessToken && Date.now() < tokenExpiresAt) return accessToken;

  const tokenResponse = await axios.post(
    'https://zoom.us/oauth/token',
    qs.stringify({
      grant_type: 'account_credentials',
      account_id: ZOOM_ACCOUNT_ID,
    }),
    {
      auth: {
        username: ZOOM_CLIENT_ID,
        password: ZOOM_CLIENT_SECRET,
      },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }
  );

  accessToken = tokenResponse.data.access_token;
  tokenExpiresAt = Date.now() + tokenResponse.data.expires_in * 1000 - 60000; // Refresh 1min early
  return accessToken;
}

async function createZoomMeeting(topic = "Untitled Meeting") {
  const token = await getZoomAccessToken();

  const response = await axios.post(
    `https://api.zoom.us/v2/users/me/meetings`,
    {
      topic,
      type: 1, // Instant meeting
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data;
}

module.exports = { createZoomMeeting };
