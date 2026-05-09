const fetch = require('node-fetch');

(async () => {
  const loginRes = await fetch('https://nova-chat-sunucu.onrender.com/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'testuser', password: 'testpassword' })
  });
  const { token } = await loginRes.json();
  
  const createRes = await fetch('https://nova-chat-sunucu.onrender.com/api/server/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ name: 'My Local Test' })
  });
  const createText = await createRes.text();
  console.log("STATUS:", createRes.status);
  console.log("BODY:", createText);
})();
