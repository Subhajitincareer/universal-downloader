import { ndown } from "nayan-media-downloaders";

async function testYouTube() {
  try {
    const url = "https://www.youtube.com/watch?v=aqz-KE-bpKQ";
    console.log("Testing YouTube URL with nayan-media-downloaders...");
    const data = await ndown(url);
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testYouTube();
