async function run() {
  try {
    const res = await fetch("http://localhost:3000/api/auth/sign-up/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: "test-" + Date.now() + "@example.com",
        password: "securepassword123",
        name: "Test User"
      })
    });
    const body = await res.json();
    console.log("Status:", res.status);
    console.log("Body:", body);
  } catch (error) {
    console.error("Fetch error:", error);
  }
}

run();
