async function fetchInstances() {
  try {
    const res = await fetch("https://instances.cobalt.best/api/instances");
    const data = await res.json();
    console.log("Instances found:", data.length);
    console.log(data.slice(0, 3));
  } catch(e) {
    console.error(e);
  }
}
fetchInstances();
