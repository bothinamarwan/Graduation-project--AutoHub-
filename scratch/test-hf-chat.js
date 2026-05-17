const fetch = require('node-fetch');

async function testChat() {
  const payload = {
    question: "what did I just say?",
    messages: [
      { role: "user", content: "hello, my name is Bob" },
      { role: "assistant", content: "Hi Bob!" },
      { role: "user", content: "what did I just say?" }
    ],
    history: [
      { role: "user", content: "hello, my name is Bob" },
      { role: "assistant", content: "Hi Bob!" }
    ]
  };

  try {
    const res = await fetch('https://zahraa28-carid-backend.hf.space/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const text = await res.text();
    console.log('Response:', res.status, text);
  } catch (err) {
    console.error(err);
  }
}

testChat();
