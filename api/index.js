const WEBSITE_URL = "https://finaflow.gt.tc"; // URL Website Utama Anda

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');

    // A. INBOUND: Telegram -> Worker -> FinaFlow (Jembatan Masuk)
    // Pola URL: https://worker-anda.com/bot-webhook-jembatan/{USER_TOKEN}
    if (pathParts[1] === "bot-webhook-jembatan") {
      const userWebhookToken = pathParts[2]; // Mengambil token dari URL secara dinamis

      if (!userWebhookToken) {
        return new Response("Error: Webhook Token tidak ditemukan di URL.", { status: 400 });
      }

      const targetUrl = `${WEBSITE_URL}/telegram/webhook/${userWebhookToken}`;

      return fetch(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36", // Agar lolos blokir hosting
        },
        body: request.body,
      });
    }

    // B. OUTBOUND: FinaFlow -> Worker -> api.telegram.org (Proxy Keluar)
    // Bagian ini sudah otomatis fleksibel karena token bot asli dikirim dalam URL dari website
    url.hostname = "api.telegram.org";
    return fetch(url.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });
  },
};
