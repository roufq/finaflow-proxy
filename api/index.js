export const config = {
  runtime: 'edge',
};

const WEBSITE_URL = "https://finaflow.gt.tc";

export default async function handler(request) {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/').filter(p => p !== ""); 

  // --- A. INBOUND (Telegram -> Vercel -> Laravel) ---
  if (pathParts[0] === "bot-webhook-jembatan") {
    const userWebhookToken = pathParts[1];
    if (!userWebhookToken) return new Response("Token missing", { status: 400 });

    const targetUrl = `${WEBSITE_URL}/telegram/webhook/${userWebhookToken}`;
    
    try {
      const clonedRequest = request.clone();
      const body = await clonedRequest.arrayBuffer();

      const response = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
          "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
          "Cache-Control": "max-age=0",
          "Sec-Ch-Ua": '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
          "Sec-Ch-Ua-Mobile": "?0",
          "Sec-Ch-Ua-Platform": '"Windows"',
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "none",
          "Sec-Fetch-User": "?1",
          "Upgrade-Insecure-Requests": "1",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        },
        body: body,
      });

      const resText = await response.text();
      return new Response(resText, { 
        status: response.status,
        headers: { "Content-Type": "application/json" }
      });
    } catch (err) {
      return new Response("Bridge Error: " + err.message, { status: 500 });
    }
  }

  // --- B. OUTBOUND (Laravel -> Vercel -> Telegram) ---
  const cleanPath = url.pathname === "/" ? "" : url.pathname;
  const finalTgUrl = `https://api.telegram.org${cleanPath}${url.search}`;

  try {
    const newHeaders = new Headers(request.headers);
    newHeaders.delete("host");
    newHeaders.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");

    const fetchOptions = {
      method: request.method,
      headers: newHeaders,
      redirect: 'follow'
    };

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      const outboundCloned = request.clone();
      fetchOptions.body = await outboundCloned.arrayBuffer();
    }

    const tgResponse = await fetch(finalTgUrl, fetchOptions);
    const tgResBody = await tgResponse.arrayBuffer();

    return new Response(tgResBody, {
      status: tgResponse.status,
      headers: tgResponse.headers
    });
  } catch (err) {
    return new Response("Telegram Proxy Error: " + err.message, { status: 502 });
  }
}
