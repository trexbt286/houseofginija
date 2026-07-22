const fs = require('fs');
async function testUpload() {
  try {
    const buffer = fs.readFileSync('src/app/icon.png'); // icon.png is in src/app
    const blob = new Blob([buffer]);
    const form = new FormData();
    form.append('file', blob, 'icon.png');
    
    console.log("Sending request to http://localhost:3000/api/admin/upload...");
    const res = await fetch('http://localhost:3000/api/admin/upload', {
      method: 'POST',
      body: form
    });
    const text = await res.text();
    console.log("Response Status:", res.status);
    console.log("Response Body:", text);
  } catch (err) {
    console.error("Fetch Error:", err);
  }
}
testUpload();
