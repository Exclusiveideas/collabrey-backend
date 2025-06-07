const supabase = require("../config/supabaseClient");
const axios = require("axios");


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
