// const fetch = require('node-fetch'); 
const fs = require('fs');

async function testAI() {
    const imageUrl = "https://res.cloudinary.com/dke4vlhek/image/upload/v1777360561/automotive-ai/iweqlgzncsty7qsskcqu.jpg";
    const apiUrl = "https://zahraa28-carid-backend.hf.space/identify";

    console.log("Fetching image from Cloudinary...");
    const imgRes = await fetch(imageUrl);
    const buffer = await imgRes.arrayBuffer();

    const formData = new FormData();
    const blob = new Blob([buffer], { type: 'image/jpeg' });
    formData.append("file", blob, "test.jpg");

    console.log("Sending to AI...");
    const aiRes = await fetch(apiUrl, {
        method: "POST",
        body: formData
    });

    console.log("Status:", aiRes.status);
    const data = await aiRes.json();
    console.log("Result:", JSON.stringify(data, null, 2));
}

testAI().catch(console.error);
