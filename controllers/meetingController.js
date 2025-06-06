const supabase = require("../config/supabaseClient");
const { getUserGoogleOAuthClient } = require("../utils/googleAuth");
const { generatePlatformLink, extractMeetingCode } = require("../utils/meetingUtils");
const { getZoomAccessToken } = require("../utils/zoomApi");


exports.createMeeting = async (req, res) => {
  const { topic, team_id, platform, is_private } = req.body;
  const user_id = req.user.id;


  if (!topic || !team_id || !platform) {
    return res.status(400).json({ error: 'Incomplete details.' });
  }

  try {
    let oauth2Client = null;

    // If user selected Google Meet, check if they connected Google
    if (platform === "google_meet") {
      const { data: userProfile, error: profileError } = await supabase
        .from("users")
        .select("google_connected")
        .eq("id", user_id)
        .single();

      if (profileError || !userProfile?.google_connected) {
        return res.status(400).json({
          error: "Please connect your Google account to use Google Meet.",
        });
      }

    

      oauth2Client = await getUserGoogleOAuthClient(user_id);
      if (!oauth2Client) {
        return res.status(400).json({
          error: "Failed to fetch Google OAuth tokens. Please reconnect your account.",
        });
      }
    }
    
    // Generate meeting link + metadata
    const { join_url, platform_meeting_id } = await generatePlatformLink(platform, topic, {
      oauth2Client,
    });
    
    const meeting_code = extractMeetingCode(join_url);


    const { data, error } = await supabase.from("meetings").insert({
      topic,
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

    return res.status(201).json({ data: data });
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


// exports.endMeeting = async (req, res) => {
//   const meeting_id = req.params.id;
//   const user_id = req.user.id;

//   if (!meeting_id) return res.status(400).json({ error: "Meeting ID is required." });

//   try {
//     // Fetch meeting info
//     const { data: meeting, error } = await supabase
//       .from("meetings")
//       .select("created_by, platform, platform_meeting_id")
//       .eq("id", meeting_id)
//       .single();

//     if (error || !meeting) return res.status(404).json({ error: "Meeting not found." });
//     if (meeting.created_by !== user_id) return res.status(403).json({ error: "Unauthorized." });

//     // If Zoom meeting, end it via Zoom API
//     if (meeting.platform === 'zoom' && meeting.platform_meeting_id) {
//       try {
//         const token = await getZoomAccessToken();
//         const zoomResponse = await axios.put(
//           `https://api.zoom.us/v2/meetings/${meeting.platform_meeting_id}/status`,
//           { action: "end" },
//           {
//             headers: {
//               Authorization: `Bearer ${token}`,
//               "Content-Type": "application/json",
//             },
//           }
//         );

//         if (zoomResponse.status !== 204) {
//           console.warn("Zoom meeting end request returned:", zoomResponse.status);
//         }
//       } catch (zoomError) {
//         console.error("Zoom end meeting error:", zoomError.response?.data || zoomError.message);
//         return res.status(500).json({ error: "Failed to end Zoom meeting." });
//       }
//     } else if (meeting.platform === 'google_meet') {
//       // No API call needed for Google Meet, just mark ended in DB
//     }

//     // Mark as ended in Supabase
//     const { error: updateError } = await supabase
//       .from("meetings")
//       .update({ end_time: new Date() })
//       .eq("id", meeting_id);

//     if (updateError) return res.status(500).json({ error: updateError.message });

//     res.status(200).json({ message: "Meeting ended successfully." });
//   } catch (err) {
//     console.error("End meeting error:", err);
//     res.status(500).json({ error: "Internal server error." });
//   }
// };


// exports.getMyMeetings = async (req, res) => {
//   const user_id = req.user.id;

//   try {
//     const { data, error } = await supabase
//       .from("meeting_participants")
//       .select(`
//         meeting_id,
//         meetings (
//           id, topic, start_time, end_time, platform, platform_meeting_id, created_by
//         )
//       `)
//       .eq("user_id", user_id);

//     if (error) return res.status(500).json({ error: error.message });

//     const meetings = data.map(record => record.meetings);

//     res.status(200).json({ data: meetings });
//   } catch (err) {
//     console.error("Get meetings error:", err);
//     res.status(500).json({ error: "Internal server error." });
//   }
// };


exports.getUserMeetings = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: No user ID found in request' });
  }

  try {
    const { data: meetings, error } = await supabase
      .from('meetings')
      .select('*')
      .eq('created_by', userId)
      .order('start_time', { ascending: true });

    if (error) {
      throw error;
    }

    res.status(200).json({ meetings });
  } catch (err) {
    console.error('Error fetching meetings:', err.message || err);
    res.status(500).json({ error: 'Failed to fetch meetings' });
  }
};
