const PASSWORD = process.env.LAB_PASSWORD || '';

export default function middleware(req) {
  const url = new URL(req.url);

  // Only protect /playgrounds/*
  if (!url.pathname.startsWith('/playgrounds')) return;

  // No password configured — skip
  if (!PASSWORD) return;

  const token = btoa(PASSWORD);
  const cookies = req.headers.get('cookie') || '';

  if (cookies.includes(`lab_auth=${token}`)) return;

  // Redirect to gate with return destination
  const dest = encodeURIComponent(url.pathname);
  return Response.redirect(new URL(`/api/gate?dest=${dest}`, req.url), 307);
}

export const config = {
  matcher: ['/playgrounds/:path*'],
};
