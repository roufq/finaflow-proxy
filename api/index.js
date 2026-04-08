export const config = {
  runtime: 'edge', // Penting agar berjalan di infrastruktur Edge Vercel
};

const WEBSITE_URL = "https://finaflow.gt.tc";

export default async function handler(request) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p !== ""); 

  // A. INBOUND: Telegram -> Vercel -> FinaFlow
  // URL Anda nanti: https://nama-project.vercel.app/bot-webhook-jembatan/{USER_TOKEN}
  if (pathParts[0] === "bot-webhook-jembatan") {
    const userWebhookToken = pathParts[1];

    if (!userWebhookToken) {
      return new Response("Error: Webhook Token tidak ditemukan.", { status: 400 });
    }

    const targetUrl = `${WEBSITE_URL}/telegram/webhook/${userWebhookToken}`;

    return fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      body: request.body,
    });
  }

  // B. OUTBOUND: FinaFlow -> Vercel -> api.telegram.org
  const tgUrl = new URL(request.url);
  tgUrl.hostname = "api.telegram.org";
  tgUrl.port = ""; // Pastikan port kosong
  
  // Menghapus path '/' jika ada agar tidak double slash
  const cleanPath = url.pathname === "/" ? "" : url.pathname;
  const finalTgUrl = `https://api.telegram.org${cleanPath}${url.search}`;

  return fetch(finalTgUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body,
  });
}
