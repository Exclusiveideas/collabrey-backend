// POST /api/webhooks/attendee/transcript

const supabase = require("../config/supabaseClient");
// const crypto = require('crypto');

exports.attendeeTranscriptHandler = async (req, res) => {
    try {
        console.log('connected to the attendee transcript handler');

        // const secret = process.env.ATTENDEE_WEBHOOK_SECRET;
        const rawBody = req.body; // already a Buffer
        // const signatureHeader = req.headers['x-signature'];

        // const expectedSignature = crypto
        //     .createHmac('sha256', secret)
        //     .update(rawBody)
        //     .digest('hex');

        // if (signatureHeader !== expectedSignature) {
        //     return res.status(401).json({ error: "Invalid webhook signature" });
        // }

        const data = JSON.parse(rawBody.toString());

        // Extract meeting ID from metadata
        const meeting_id = data?.bot_metadata?.meeting_id;
        const transcriptSegment = data?.data?.transcription?.transcript;

        if (!meeting_id || transcriptSegment === undefined) {
            return res.status(400).json({ error: "Missing meeting ID or transcript" });
        }

        const insertData = {
            meeting_id,
            speaker_name: data.data.speaker_name,
            timestamp: new Date(data.data.timestamp_ms).toISOString(),
            content: transcriptSegment,
            language: "en", 
            translation: '',
            source: "attendee.dev",
            
        };

        const { error } = await supabase.from("transcripts").insert([insertData]);
        if (error) throw new Error("Failed to insert transcript");

        // console.log('transcriptSegment: ', transcriptSegment)
        // Emit transcript segment to the frontend via WebSocket
        if (global.io) {
            global.io.to(meeting_id).emit("transcript", insertData);
        }

        res.status(200).json({ message: "Transcript saved" });
    } catch (err) {
        console.error("Attendee.dev transcript error:", err.message);
        res.status(500).json({ error: err.message });
    }
};
