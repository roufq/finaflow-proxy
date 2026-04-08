export const config = {
  runtime: 'edge',
};

const WEBSITE_URL = "https://finaflow.gt.tc";

export default async function handler(request) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p !== ""); 

  // A. INBOUND: Telegram -> Vercel -> Laravel
  if (pathParts[0] === "bot-webhook-jembatan") {
    const userWebhookToken = pathParts[1];

    if (!userWebhookToken) {
      return new Response("Error: Token missing", { status: 400 });
    }

    const targetUrl = `${WEBSITE_URL}/telegram/webhook/${userWebhookToken}`;
    
    // Ambil body asli dari Telegram
    const body = await request.arrayBuffer();

    return fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        // Meniru browser agar tidak diblokir sistem Anti-Bot hosting
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      body: body,
    });
  }

  // B. OUTBOUND: Laravel -> Vercel -> Telegram
  const cleanPath = url.pathname === "/" ? "" : url.pathname;
  const finalTgUrl = `https://api.telegram.org${cleanPath}${url.search}`;

  const newHeaders = new Headers(request.headers);
  newHeaders.delete("host");
  // Pastikan Vercel mengirim sebagai User-Agent yang dikenal
  newHeaders.set("User-Agent", "FinaFlow-Bridge/1.0");

  return fetch(finalTgUrl, {
    method: request.method,
    headers: newHeaders,
    body: request.method === 'GET' ? null : await request.arrayBuffer(),
  });
}
