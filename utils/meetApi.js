

const { google } = require("googleapis");

// You must provide OAuth2 client or access token for Google API
// For example, you could pass the google OAuth2 client here or get a token from your user/session.

exports.createGoogleMeetEvent = async(name, oauth2Client) => {
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  // Create a calendar event with conferenceData to generate Google Meet link
  const event = {
    summary: name,
    start: {
      dateTime: new Date().toISOString(), // Start now
      timeZone: "UTC",
    },
    end: {
      dateTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // +1 hour
      timeZone: "UTC",
    },
    conferenceData: {
      createRequest: {
        requestId: `meet-${Date.now()}`, // Unique request ID
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    },
  };

  const response = await calendar.events.insert({
    calendarId: "primary", // or your service account calendar ID
    resource: event,
    conferenceDataVersion: 1,
  });

  const createdEvent = response.data;
  if (!createdEvent.conferenceData || !createdEvent.conferenceData.entryPoints) {
    throw new Error("Failed to create Google Meet link");
  }

  // Find the Meet join URL from entryPoints
  const meetEntryPoint = createdEvent.conferenceData.entryPoints.find(
    (ep) => ep.entryPointType === "video"
  );

  return {
    join_url: meetEntryPoint.uri,
    platform_meeting_id: createdEvent.id, // Google Calendar event ID
  };
}
