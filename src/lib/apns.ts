import http2 from "node:http2";
import jwt from "jsonwebtoken";

// APNs auth tokens are valid up to an hour and Apple asks senders not to
// mint a fresh one per request — this cron only runs a handful of times a
// day, but caching costs nothing and matches their guidance.
let cachedToken: { token: string; iat: number } | null = null;

function getApnsJwt(): string {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && now - cachedToken.iat < 60 * 55) return cachedToken.token;
  const privateKey = (process.env.APNS_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");
  const token = jwt.sign({ iss: process.env.APNS_TEAM_ID, iat: now }, privateKey, {
    algorithm: "ES256",
    header: { alg: "ES256", kid: process.env.APNS_KEY_ID! },
  });
  cachedToken = { token, iat: now };
  return token;
}

export interface ApnsSendResult {
  ok: boolean;
  // 410 (Unregistered) or a 400 BadDeviceToken means Apple will never accept
  // this token again — the caller should delete it from push_tokens.
  shouldRemoveToken: boolean;
}

export function sendApnsPush(deviceToken: string, payload: { title: string; body: string }): Promise<ApnsSendResult> {
  const host = process.env.APNS_ENV === "sandbox" ? "https://api.sandbox.push.apple.com" : "https://api.push.apple.com";
  const client = http2.connect(host);

  return new Promise((resolve) => {
    const req = client.request({
      ":method": "POST",
      ":path": `/3/device/${deviceToken}`,
      authorization: `bearer ${getApnsJwt()}`,
      "apns-topic": process.env.APNS_BUNDLE_ID || "it.swyp.app",
      "apns-push-type": "alert",
      "apns-priority": "10",
      "content-type": "application/json",
    });

    let status = 0;
    let body = "";
    req.on("response", (headers) => {
      status = Number(headers[":status"] ?? 0);
    });
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      client.close();
      resolve({
        ok: status === 200,
        shouldRemoveToken: status === 410 || (status === 400 && body.includes("BadDeviceToken")),
      });
    });
    req.on("error", () => {
      client.close();
      resolve({ ok: false, shouldRemoveToken: false });
    });

    req.end(JSON.stringify({ aps: { alert: { title: payload.title, body: payload.body }, sound: "default" } }));
  });
}
