const { createZoomMeeting } = require("./zoomApi");


async function generatePlatformLink(platform, name) {
  if (platform === "zoom") {
    const zoomData = await createZoomMeeting(name); // This returns Zoom's full meeting object
    return {
      join_url: zoomData.join_url,
      platform_meeting_id: zoomData.id, // numeric ID
    };
  }

  // Stub for Google/Teams — replace as needed
  return {
    join_url: `https://example.com/fake-link-for-${platform}`,
    platform_meeting_id: null,
  };
}


function extractMeetingCode(url) {
  // For Zoom, extract last part of URL
  const match = url.match(/\/j\/(\d+)/);
  return match ? match[1] : null;
}

module.exports = { generatePlatformLink, extractMeetingCode };
