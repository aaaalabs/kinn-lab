const PASSWORD = process.env.LAB_PASSWORD || '';

export default function middleware(request) {
  if (!PASSWORD) return;

  const cookie = request.headers.get('cookie') || '';
  const token = btoa(PASSWORD);

  if (cookie.includes(`lab_auth=${token}`)) return;

  const url = new URL(request.url);

  // Password submitted
  if (url.searchParams.get('_pw') === PASSWORD) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: url.pathname,
        'Set-Cookie': `lab_auth=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`,
      },
    });
  }

  return new Response(loginHTML(), {
    status: 401,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function loginHTML() {
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
input{width:100%;padding:.6rem .8rem;border:1px solid #333;border-radius:6px;background:#141414;color:#e5e5e5;font-size:.9rem;outline:none}
input:focus{border-color:#555}
button{margin-top:.8rem;width:100%;padding:.6rem;border:none;border-radius:6px;background:#e5e5e5;color:#0a0a0a;font-size:.9rem;font-weight:500;cursor:pointer}
button:hover{background:#fff}
</style>
</head>
<body>
<form method="GET">
<h1>KINN Lab</h1>
<input type="password" name="_pw" placeholder="Passwort" autofocus required>
<button type="submit">Weiter</button>
</form>
</body>
</html>`;
}

export const config = {
  matcher: '/((?!api/health|favicon\\.ico|favicon\\.svg|kinn-logo\\.png).*)',
};
