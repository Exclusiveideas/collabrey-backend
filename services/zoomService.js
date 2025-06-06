const supabase = require("../config/supabaseClient");


exports.endZoomMeeting = async (zoomMeetingId) => {
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
};
