const supabase = require("../config/supabaseClient");
const axios = require("axios");
const { KJUR } = require("jsrsasign")


exports.endZoomMeeting = async (zoomMeetingId) => {
  try {
    if (!zoomMeetingId) {
      throw new Error("Missing Zoom meeting ID");
    }

    const { data: meeting, error: fetchError } = await supabase
      .from("meetings")
      .select("id")
      .eq("platform", "zoom")
      .eq("platform_meeting_id", zoomMeetingId)
      .single();

    if (fetchError || !meeting) {
      console.error("Meeting not found:", fetchError?.message || "No meeting");
      throw new Error("Meeting not found");
    }

    const { error: updateError } = await supabase
      .from("meetings")
      .update({ end_time: new Date().toISOString() })
      .eq("id", meeting.id);

    if (updateError) {
      console.error("Failed to mark meeting as ended:", updateError.message);
      throw new Error("Failed to mark meeting as ended");
    }

    return true;
  } catch (err) {
    console.error("endZoomMeeting failed:", err.message);
    throw err;
  }
};


exports.startZoomBot = async (zoomMeetingId) => {
  try {
    if (!zoomMeetingId) {
      throw new Error("Missing Zoom meeting ID");
    }

    const { data: meeting, error } = await supabase
      .from("meetings")
      .select("id, topic, platform_meeting_id, join_url, start_time")
      .eq("platform", "zoom")
      .eq("platform_meeting_id", zoomMeetingId)
      .single();

    if (error || !meeting) throw new Error("Meeting not found");
    if (!meeting.join_url) throw new Error("Meeting Url not found");

    await axios.post("https://app.attendee.dev/api/v1/bots", {
      meeting_url: meeting.join_url,
      bot_name: "Collabrey Zoom Bot",
      external_id: meeting.id, // optional - usually used to link in your DB
      platform: "zoom",
      metadata: {
        meeting_id: meeting.id  // ✅ This will show up in webhook payloads
      }
    }, {
      headers: {
        Authorization: `Token ${process.env.ATTENDEE_API_KEY}`,
        "Content-Type": "application/json"
      }
    });

    return meeting.id;
  } catch (err) {
    console.error("startZoomBot failed:", err.message);
    throw err;
  }
};




const SDK_KEY = process.env.ZOOM_OAUTH_CLIENT_ID;
const SDK_SECRET = process.env.ZOOM_OAUTH_CLIENT_SECRET;

// exports.generateSignature = async(meetingNumber, role) => {
//   const timestamp = new Date().getTime() - 30000;
//   const msg = Buffer.from(SDK_KEY + meetingNumber + timestamp + role).toString('base64');
//   const hash = crypto.createHmac('sha256', SDK_SECRET).update(msg).digest('base64');
//   const signature = Buffer.from(`${SDK_KEY}.${meetingNumber}.${timestamp}.${role}.${hash}`).toString('base64');

//   console.log('signature: ', signature)
//   return signature;
// }


exports.generateSignature = (meetingNumber, role) => {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 60 * 60 * 2; // Token valid for 2 hours
  const oHeader = { alg: 'HS256', typ: 'JWT' };

  const oPayload = {
    sdkKey: SDK_KEY,
    mn: meetingNumber,
    role: role,
    iat: iat,
    exp: exp,
    tokenExp: exp,
    video_webrtc_mode: 0
  };

  const sHeader = JSON.stringify(oHeader);
  const sPayload = JSON.stringify(oPayload);

  const signature = KJUR.jws.JWS.sign('HS256', sHeader, sPayload, SDK_SECRET);

  return signature;
};


exports.getAccessToken = async () => {
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;
  const accountId = process.env.ZOOM_ACCOUNT_ID;

  const tokenUrl = "https://zoom.us/oauth/token";

  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  try {
    const response = await axios.post(
      `${tokenUrl}?grant_type=account_credentials&account_id=${accountId}`,
      null,
      {
        headers: {
          Authorization: `Basic ${authHeader}`,
        },
      }
    );

    return response.data.access_token;
  } catch (err) {
    console.error("Zoom token error:", err.response?.data || err);
    throw new Error("Failed to fetch Zoom access token");
  }
};
