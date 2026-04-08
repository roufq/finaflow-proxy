export const config = {
  runtime: 'edge', // Penting agar berjalan di infrastruktur Edge Vercel yang cepat
};

const WEBSITE_URL = "https://finaflow.gt.tc"; // URL Website FinaFlow Anda

export default async function handler(request) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p !== ""); 

  // A. INBOUND: Pesan Masuk DARI Telegram ke Website (Jembatan Masuk)
  // URL Anda: https://[NAMA-PROJECT].vercel.app/bot-webhook-jembatan/[TOKEN]
  if (pathParts[0] === "bot-webhook-jembatan") {
    const userWebhookToken = pathParts[1];

    if (!userWebhookToken) {
      return new Response("Error: Webhook Token tidak ditemukan di path URL.", { status: 400 });
    }

    const targetUrl = `${WEBSITE_URL}/telegram/webhook/${userWebhookToken}`;

    return fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", // Bypass block
      },
      body: request.body,
    });
  }

  // B. OUTBOUND: Permintaan Website KE Telegram (Proxy Keluar)
  // Ini meneruskan perintah 'sendMessage' dll dari FinaFlow ke api.telegram.org
  const cleanPath = url.pathname === "/" ? "" : url.pathname;
  const finalTgUrl = `https://api.telegram.org${cleanPath}${url.search}`;

  // Membersihkan Header Host agar tidak bentrok dengan Telegram
  const newHeaders = new Headers(request.headers);
  newHeaders.delete("host");

  return fetch(finalTgUrl, {
    method: request.method,
    headers: newHeaders,
    body: request.body,
  });
}
