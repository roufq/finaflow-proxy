export const config = {
  runtime: 'edge',
};

// Pastikan URL ini sudah benar dan tanpa tanda miring (/) di akhir
const WEBSITE_URL = "https://finaflow.gt.tc";

export default async function handler(request) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p !== ""); 

  /**
   * A. INBOUND: Telegram -> Vercel -> Laravel (FinaFlow)
   * Terjadi saat user mengirim pesan ke Bot Telegram
   */
  if (pathParts[0] === "bot-webhook-jembatan") {
    const userWebhookToken = pathParts[1];

    if (!userWebhookToken) {
      console.error("Inbound Error: User Token missing in URL");
      return new Response("Error: Token missing", { status: 400 });
    }

    const targetUrl = `${WEBSITE_URL}/telegram/webhook/${userWebhookToken}`;
    
    try {
      // Cloning request untuk membaca body JSON tanpa merusak stream asli
      const clonedRequest = request.clone();
      const body = await clonedRequest.arrayBuffer();

      console.log(`Forwarding message to Laravel: ${targetUrl}`);

      const response = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          // Menyamar sebagai browser untuk bypass Anti-Bot InfinityFree
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        },
        body: body,
      });

      const resText = await response.text();
      console.log(`Laravel Response Status: ${response.status}`);
      console.log(`Laravel Response Body: ${resText}`);

      return new Response(resText, { 
        status: response.status,
        headers: { "Content-Type": "application/json" }
      });

    } catch (err) {
      console.error("Inbound Fetch Error:", err.message);
      return new Response("Bridge Error: " + err.message, { status: 500 });
    }
  }

  /**
   * B. OUTBOUND: Laravel (FinaFlow) -> Vercel -> Telegram
   * Terjadi saat Laravel mengirim perintah 'sendMessage' ke Telegram
   */
  const cleanPath = url.pathname === "/" ? "" : url.pathname;
  const finalTgUrl = `https://api.telegram.org${cleanPath}${url.search}`;

  try {
    const newHeaders = new Headers(request.headers);
    newHeaders.delete("host");
    newHeaders.set("User-Agent", "FinaFlow-Bridge/3.0");

    const response = await fetch(targetUrl, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "max-age=0",
    "Sec-Ch-Ua": '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": '"Windows"',
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  },
  body: body,
});

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      const outboundCloned = request.clone();
      fetchOptions.body = await outboundCloned.arrayBuffer();
    }

    console.log(`Proxying request to Telegram: ${finalTgUrl}`);

    const tgResponse = await fetch(finalTgUrl, fetchOptions);
    const tgResBody = await tgResponse.arrayBuffer();

    return new Response(tgResBody, {
      status: tgResponse.status,
      headers: tgResponse.headers
    });

  } catch (err) {
    console.error("Outbound Proxy Error:", err.message);
    return new Response("Telegram Proxy Error: " + err.message, { status: 502 });
  }
}
