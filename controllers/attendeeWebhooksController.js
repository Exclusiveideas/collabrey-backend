// POST /api/webhooks/attendee/transcript

const supabase = require("../config/supabaseClient");



exports.attendeeTranscriptHandler = async (req, res) => {
    try {
        const { external_id: meeting_id, transcript, language } = req.body;

        if (!meeting_id || !transcript) {
            return res.status(400).json({ error: "Missing meeting ID or transcript" });
        }

        const insertData = transcript.map((segment) => ({
            meeting_id,
            speaker_name: segment.speaker,
            timestamp: segment.timestamp,
            content: segment.text,
            language,
            source: "attendee.dev"
        }));

        const { error } = await supabase.from("transcripts").insert(insertData);

        if (error) throw new Error("Failed to insert transcript");


        // Emit each segment to the frontend via WebSocket
        if (global.io) {
            transcript.forEach((segment) => {
                global.io.to(meeting_id).emit("transcript", {
                    speaker: segment.speaker,
                    timestamp: segment.timestamp,
                    text: segment.text,
                    language,
                });
            });
        }

        res.status(200).json({ message: "Transcript saved" });
    } catch (err) {
        console.error("Attendee.dev transcript error:", err.message);
        res.status(500).json({ error: err.message });
    }
};
