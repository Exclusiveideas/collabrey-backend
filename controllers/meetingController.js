const supabase = require("../config/supabaseClient");
const { generatePlatformLink, extractMeetingCode } = require("../utils/meetingUtils");
const { getZoomAccessToken } = require("../utils/zoomApi");


exports.createMeeting = async (req, res) => {
  const { name, team_id, platform, is_private } = req.body;
  const user_id = req.user.id;


  if (!name || !team_id || !platform || !is_private) {
    return res.status(400).json({ error: 'Incomplete details.' });
  }

  try {
    // Generate meeting link + metadata
    const { join_url, platform_meeting_id } = await generatePlatformLink(platform, name);
    const meeting_code = extractMeetingCode(meeting_url); // Optional parsing

    const { data, error } = await supabase.from("meetings").insert({
      name,
      team_id,
      platform,
      meeting_code,
      start_time: new Date(),
      created_by: user_id,
      is_private,
      join_url: join_url,
      platform_meeting_id
    }).select().single();

    if (error) return res.status(500).json({ error: error.message });

    return res.status(201).json({ message: "Meeting creation successful.", data: data });
  } catch (err) {
    console.error("Meeting creation error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
}


exports.joinMeeting = async (req, res) => {
  const { meeting_code } = req.body;
  const user_id = req.user.id;

  if (!meeting_code) return res.status(400).json({ error: "Meeting code is required." });

  try {
    // Find meeting by code
    const { data: meeting, error: meetingError } = await supabase
      .from("meetings")
      .select("id, platform, is_private, join_url")
      .eq("meeting_code", meeting_code)
      .single();

    if (meetingError || !meeting) return res.status(404).json({ error: "Meeting not found." });

    // Optional: check permissions if private
    if (meeting.is_private) {
      // Check if user has access via some `allowed_users` table or role
      return res.status(403).json({ error: "Private meeting access denied." });
    }

    // Log participation
    const now = new Date();
    const { data: participant, error: participantError } = await supabase
      .from("meeting_participants")
      .upsert(
        {
          meeting_id: meeting.id,
          user_id,
          join_time: now,
        },
        { onConflict: ['meeting_id', 'user_id'] }
      );

    if (participantError) return res.status(500).json({ error: participantError.message });

    // Return Zoom join URL if platform is Zoom
    if (meeting.platform === 'zoom') {
      if (!meeting.join_url) {
        return res.status(500).json({ error: "Zoom join link not available." });
      }

      return res.status(200).json({
        message: "Joined Zoom meeting successfully.",
        join_url: meeting.join_url,
        data: participant,
      });

      // Your frontend can then just window.location.href = join_url or open it in a new tab.
    }

    // Otherwise, for Google Meet or Teams, you can add logic later
    return res.status(200).json({ message: "Joined meeting successfully.", data: participant });

  } catch (err) {
    console.error("Join meeting error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
};


exports.endMeeting = async (req, res) => {
  const meeting_id = req.params.id;
  const user_id = req.user.id;

  if (!meeting_id) return res.status(400).json({ error: "Meeting ID is required." });

  try {
    // Fetch meeting info
    const { data: meeting, error } = await supabase
      .from("meetings")
      .select("created_by, platform, platform_meeting_id")
      .eq("id", meeting_id)
      .single();

    if (error || !meeting) return res.status(404).json({ error: "Meeting not found." });
    if (meeting.created_by !== user_id) return res.status(403).json({ error: "Unauthorized." });

    // If Zoom meeting, end it via Zoom API
    if (meeting.platform === 'zoom' && meeting.platform_meeting_id) {
      try {
        const token = await getZoomAccessToken();
        const zoomResponse = await axios.put(
          `https://api.zoom.us/v2/meetings/${meeting.platform_meeting_id}/status`,
          { action: "end" },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (zoomResponse.status !== 204) {
          console.warn("Zoom meeting end request returned:", zoomResponse.status);
        }
      } catch (zoomError) {
        console.error("Zoom end meeting error:", zoomError.response?.data || zoomError.message);
        return res.status(500).json({ error: "Failed to end Zoom meeting." });
      }
    }

    // Mark as ended in Supabase
    const { error: updateError } = await supabase
      .from("meetings")
      .update({ end_time: new Date() })
      .eq("id", meeting_id);

    if (updateError) return res.status(500).json({ error: updateError.message });

    res.status(200).json({ message: "Meeting ended successfully." });
  } catch (err) {
    console.error("End meeting error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
};


exports.getMyMeetings = async (req, res) => {
  const user_id = req.user.id;

  try {
    const { data, error } = await supabase
      .from("meeting_participants")
      .select(`
        meeting_id,
        meetings (
          id, name, start_time, end_time, platform, platform_meeting_id, created_by
        )
      `)
      .eq("user_id", user_id);

    if (error) return res.status(500).json({ error: error.message });

    const meetings = data.map(record => record.meetings);

    res.status(200).json({ data: meetings });
  } catch (err) {
    console.error("Get meetings error:", err);
    res.status(500).json({ error: "Internal server error." });
  }
};
