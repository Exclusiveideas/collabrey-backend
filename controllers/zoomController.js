const { generateSignature, getAccessToken } = require("../services/zoomService");
const axios = require("axios");



const handleGenerateZoomSignature = (req, res) => {
  try {
    const { meetingNumber, role } = req.body;
    if (!meetingNumber || role === undefined) {
      return res.status(400).json({ error: 'Missing meetingNumber or role' });
    }
    const signature = generateSignature(meetingNumber, role);
    res.json({ signature, sdkKey: process.env.ZOOM_MEETING_SDK_KEY });
  } catch (err) {
    console.error("Zoom signature generation error:", err);
    res.status(500).json({ error: "Failed to generate zoom signature" });
  }
};


const handleGenerateZAKToken = async (req, res) => {
    const zoomUserEmail = process.env.APP_HOST_EMAIL; // or get from DB

    try {
        const accessToken = await getAccessToken();

        const { data } = await axios.get(
            `https://api.zoom.us/v2/users/${zoomUserEmail}/token?type=zak`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        res.json({ zak: data.token });
    } catch (err) {
        console.error("ZAK token error:", err.response?.data || err);
        res.status(500).json({ error: "Failed to fetch ZAK token" });
    }
};


module.exports = {
    handleGenerateZAKToken, handleGenerateZoomSignature
}