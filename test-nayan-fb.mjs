import { ndown } from "nayan-media-downloaders";

async function testFB() {
  try {
    const url = "https://www.facebook.com/watch/?v=353724813958784";
    console.log("Testing FB URL with nayan-media-downloaders...");
    const data = await ndown(url);
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testFB();
