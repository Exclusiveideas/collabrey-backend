// services/googleMeetService.js

const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
const dotenv = require('dotenv');
dotenv.config();

const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const TOKEN_PATH = process.env.GOOGLE_TOKEN_PATH || 'token.json';
const CREDENTIALS_PATH = process.env.GOOGLE_CREDENTIALS_PATH || 'credentials.json';

/**
 * Load or refresh credentials for Google API
 */
async function getGoogleCredentials() {
  let credentials;
  const rawCredentials = fs.readFileSync(CREDENTIALS_PATH);
  const { installed } = JSON.parse(rawCredentials);

  const oAuth2Client = new google.auth.OAuth2(
    installed.client_id,
    installed.client_secret,
    installed.redirect_uris[0]
  );

  if (fs.existsSync(TOKEN_PATH)) {
    const token = fs.readFileSync(TOKEN_PATH);
    oAuth2Client.setCredentials(JSON.parse(token));
  } else {
    throw new Error('No token found. Please generate Google API credentials manually.');
  }

  // Attempt to refresh the token if expired
  oAuth2Client.on('tokens', (tokens) => {
    if (tokens.refresh_token) {
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
    }
  });

  return oAuth2Client;
}

/**
 * Create a Google Meet event using Google Calendar API
 */
async function createGoogleMeetLink({ title, description, startTime, endTime, attendees = [] }) {
  try {
    const auth = await getGoogleCredentials();
    const calendar = google.calendar({ version: 'v3', auth });

    const attendeeList = attendees.map(email => ({ email }));

    const event = {
      summary: title,
      description,
      start: {
        dateTime: new Date(startTime).toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: new Date(endTime).toISOString(),
        timeZone: 'UTC',
      },
      attendees: attendeeList,
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: 1,
    });

    const eventData = response.data;

    let meetLink = 'No meet link available';
    if (
      eventData.conferenceData?.entryPoints &&
      eventData.conferenceData.entryPoints.length > 0
    ) {
      const videoEntry = eventData.conferenceData.entryPoints.find(
        ep => ep.entryPointType === 'video'
      );
      if (videoEntry) {
        meetLink = videoEntry.uri;
      }
    }

    return {
      event_id: eventData.id,
      meet_link: meetLink,
      event_link: eventData.htmlLink,
      summary: eventData.summary,
      description: eventData.description,
      start_time: eventData.start.dateTime,
      end_time: eventData.end.dateTime,
    };
  } catch (error) {
    console.error('Error creating Google Meet link:', error.message);
    throw error;
  }
}

module.exports = {
  createGoogleMeetLink,
};
