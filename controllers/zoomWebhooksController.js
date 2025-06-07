const { endZoomMeeting, startZoomBot } = require("../services/zoomService");
const crypto = require("crypto");



// POST /api/zoom/webhook
exports.zoomWebhookHandler = async (req, res) => {
  try {
    // const signature = req.headers['x-zm-signature'];
    // const timestamp = req.headers['x-zm-request-timestamp'];
    // const rawBody = JSON.stringify(req.body);  // Zoom sends JSON
    const secretToken = process.env.ZOOM_WEBHOOK_SECRET_TOKEN;

    // Step 1: Verify Zoom Signature
    // const message = `v0:${timestamp}:${rawBody}`;
    // const hash = crypto.createHmac('sha256', secretToken).update(message).digest('hex');
    // const expectedSignature = `v0=${hash}`;

    // if (signature !== expectedSignature) {
    //   console.warn("🔒 Invalid Zoom signature");
    //   return res.status(401).json({ error: "Unauthorized Zoom webhook" });
    // }

    const { event, payload } = req.body;

    // Step 2: Handle URL validation event
    if (event === 'endpoint.url_validation') {
      const { plainToken } = req.body.payload;

      const encryptedToken = crypto
        .createHmac('sha256', secretToken)
        .update(plainToken)
        .digest('hex');

      return res.status(200).json({
        plainToken,
        encryptedToken
      });
    }
    
    // Step 3: Handle other real events like meeting.started, meeting.ended
    const zoomMeetingId = payload?.object?.id;

    if (!zoomMeetingId) {
      return res.status(400).json({ error: "Missing Zoom meeting ID" });
    }

    switch (event) {
      case "meeting.started":
        console.log("📢 Meeting started:", zoomMeetingId);
        await startZoomBot(zoomMeetingId);
        return res.status(200).json({ message: "Zoom bot started" });

      case "meeting.ended":
        console.log("📢 Meeting ended:", zoomMeetingId);
        await endZoomMeeting(zoomMeetingId);
        return res.status(200).json({ message: "Zoom meeting ended" });

      default:
        console.log("📥 Unhandled Zoom event:", event);
        return res.status(200).json({ message: `Unhandled event: ${event}` });
    }

  } catch (err) {
    console.error("❌ Zoom webhook error:", err.message || err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
};

