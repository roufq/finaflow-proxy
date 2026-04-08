export const config = {
  runtime: 'edge',
};

const WEBSITE_URL = "https://finaflow.gt.tc";

export default async function handler(request) {
  const url = new URL(request.url);
  // Membersihkan path agar mudah dibaca
  const pathParts = url.pathname.split('/').filter(p => p !== ""); 

  /**
   * A. INBOUND: Telegram -> Vercel -> Laravel (FinaFlow)
   * Pola URL: https://project-p5vrt.vercel.app/bot-webhook-jembatan/[TOKEN]
   */
  if (pathParts[0] === "bot-webhook-jembatan") {
    const userWebhookToken = pathParts[1];

    if (!userWebhookToken) {
      return new Response("Error: Token Webhook tidak ditemukan.", { status: 400 });
    }

    const targetUrl = `${WEBSITE_URL}/telegram/webhook/${userWebhookToken}`;
    
    // Kloning request agar body bisa dibaca tanpa merusak stream asli
    const clonedRequest = request.clone();
    const body = await clonedRequest.arrayBuffer();

    return fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        // User-Agent browser asli untuk mengelabui firewall Anti-Bot InfinityFree
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
      body: body,
    });
  }

  /**
   * B. OUTBOUND: Laravel (FinaFlow) -> Vercel -> api.telegram.org
   * Ini digunakan saat Laravel ingin membalas pesan (sendMessage, dll)
   */
  const cleanPath = url.pathname === "/" ? "" : url.pathname;
  const finalTgUrl = `https://api.telegram.org${cleanPath}${url.search}`;

  // Salin header asli dari Laravel
  const newHeaders = new Headers(request.headers);
  // Hapus header 'host' agar tidak ditolak oleh server Telegram
  newHeaders.delete("host");
  newHeaders.set("User-Agent", "FinaFlow-Bridge/2.0");

  // Siapkan opsi fetch untuk outbound
  const fetchOptions = {
    method: request.method,
    headers: newHeaders,
  };

  // Jika bukan GET, sertakan body (untuk sendMessage, dll)
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const outboundCloned = request.clone();
    fetchOptions.body = await outboundCloned.arrayBuffer();
  }

  return fetch(finalTgUrl, fetchOptions);
}
