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
      .select("id, topic, platform_meeting_id, start_time")
      .eq("platform", "zoom")
      .eq("platform_meeting_id", zoomMeetingId)
      .single();

    if (error || !meeting) throw new Error("Meeting not found");

    await axios.post("https://api.attendee.dev/v1/join", {
      meeting_url: `https://zoom.us/j/${zoomMeetingId}`,
      external_id: meeting.id,
      platform: "zoom"
    }, {
      headers: {
        Authorization: `Bearer ${process.env.ATTENDEE_API_KEY}`,
        "Content-Type": "application/json"
      }
    });

    return meeting.id;
  } catch (err) {
    console.error("startZoomBot failed:", err.message);
    throw err;
  }
};
