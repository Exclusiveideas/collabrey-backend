const { endZoomMeeting } = require("../services/zoomService");



// POST /webhooks/zoom
exports.zoomWebhookHandler = async (req, res) => {
  try {
    const rawBody = req.body.toString('utf8');  // Parse raw buffer
    const json = JSON.parse(rawBody);           // Convert to JSON

    const { event, payload } = json;

    if (!event) {
      return res.status(400).json({ error: "Missing event in Zoom webhook" });
    }


    const zoomMeetingId = payload?.object?.id;
    if (!zoomMeetingId) {
      return res.status(400).json({ error: "Missing Zoom meeting ID in payload" });
    }

    switch (event) {
      case "meeting.ended":
        await endZoomMeeting(zoomMeetingId);
        return res.status(200).json({ message: "Zoom meeting marked as ended" });

      case "meeting.started":
        // future: handle start event
        return res.status(200).json({ message: "Zoom meeting started (ignored for now)" });

      default:
        return res.status(200).json({ message: `Unhandled event: ${event}` });
    }
  } catch (err) {
    console.error("Zoom webhook error:", err.message || err);
    return res.status(500).json({ error: err.message || "Unexpected server error" });
  }
};
