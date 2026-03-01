const url = "https://www.youtube.com/watch?v=aqz-KE-bpKQ";

async function testCobalt() {
  try {
    const res = await fetch("https://api.cobalt.tools/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        url: url
      })
    });
    
    const data = await res.json();
    console.log("Response:", data);
  } catch (error) {
    console.error("Error:", error);
  }
}

testCobalt();
