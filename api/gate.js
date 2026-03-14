const PASSWORD = process.env.LAB_PASSWORD || '';

export default function handler(req, res) {
  if (!PASSWORD) return res.redirect(307, req.query.dest || '/');

  const cookies = req.headers.cookie || '';
  const token = Buffer.from(PASSWORD).toString('base64');

  // Already authenticated — serve via internal rewrite
  if (cookies.includes(`lab_auth=${token}`)) {
    const dest = req.query.dest || '/';
    return res.redirect(307, dest);
  }

  // Password submitted via POST
  if (req.method === 'POST') {
    const pw = typeof req.body === 'string'
      ? new URLSearchParams(req.body).get('_pw')
      : req.body?._pw;
    const dest = req.query.dest || '/';
    if (pw === PASSWORD) {
      res.setHeader('Set-Cookie', `lab_auth=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`);
      return res.redirect(302, dest);
    }
    return res.status(401).send(loginHTML(dest, true));
  }

  // Show login
  const dest = req.query.dest || '/';
  return res.status(401).send(loginHTML(dest, false));
}

function loginHTML(dest, error) {
  const action = `/api/gate?dest=${encodeURIComponent(dest)}`;
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>KINN Lab</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;background:#0a0a0a;color:#e5e5e5}
form{text-align:center;max-width:280px}
h1{font-size:1.1rem;font-weight:500;margin-bottom:1.5rem;letter-spacing:.02em}
input{width:100%;padding:.6rem .8rem;border:1px solid ${error ? '#c33' : '#333'};border-radius:6px;background:#141414;color:#e5e5e5;font-size:.9rem;outline:none}
input:focus{border-color:#555}
button{margin-top:.8rem;width:100%;padding:.6rem;border:none;border-radius:6px;background:#e5e5e5;color:#0a0a0a;font-size:.9rem;font-weight:500;cursor:pointer}
button:hover{background:#fff}
.err{color:#c33;font-size:.8rem;margin-bottom:.8rem}
</style>
</head>
<body>
<form action="${action}" method="POST">
<h1>KINN Lab</h1>
${error ? '<p class="err">Falsches Passwort</p>' : ''}
<input type="password" name="_pw" placeholder="Passwort" autofocus required>
<button type="submit">Weiter</button>
</form>
</body>
</html>`;
}
