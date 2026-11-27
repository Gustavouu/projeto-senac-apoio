import { createHmac, timingSafeEqual } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import content from "../data/apoio.json" with { type: "json" };

const localPanel = "http://192.168.4.1";
const outcomes = { accepted: 16, rejected: 17, unknown: 18, withLocation: 19 };

function settings() {
  const env = (key) => process.env[key]?.trim() || "";
  const values = {
    key: env("APOIO_RELAY_KEY"),
    db: env("RELAY_DATABASE_URL"),
    token: env("WHATSAPP_ACCESS_TOKEN"),
    sender: env("WHATSAPP_PHONE_NUMBER_ID"),
    recipient: env("WHATSAPP_DESTINATARIO"),
    template: env("WHATSAPP_TEMPLATE") || "projeto_senac_pedido_apoio",
    version: env("WHATSAPP_API_VERSION") || "v25.0",
  };
  if (/^[0-9a-f]{64}$/.test(values.key) && values.db && values.token &&
      /^\d+$/.test(values.sender) && /^[1-9]\d{9,14}$/.test(values.recipient) &&
      /^[a-z][a-z0-9_]*$/.test(values.template) && /^v\d+\.0$/.test(values.version)) {
    return values;
  }
  return null;
}

function digest(key, bytes, length) {
  return createHmac("sha256", key).update(bytes).digest().subarray(0, length);
}

function validate(body, key) {
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { return null; }
  }
  const { id, kind, proof, gps, phonePosition } = body ?? {};
  if (!Number.isInteger(id) || id < 1 || id > 0xffffffff || !Number.isInteger(kind) ||
      !content.scenarios[kind - 1] || kind === 2 ||
      typeof proof !== "string" || !/^[0-9a-f]{32}$/.test(proof)) return null;
  const bytes = Buffer.alloc(5);
  bytes.writeUInt32LE(id);
  bytes[4] = kind;
  if (!timingSafeEqual(digest(key, bytes, 16), Buffer.from(proof, "hex"))) return null;
  return { id, kind, proof, gps, phonePosition };
}

function mapLink(position) {
  const { latitude, longitude } = position ?? {};
  if (!Number.isFinite(latitude) || Math.abs(latitude) > 90 ||
      !Number.isFinite(longitude) || Math.abs(longitude) > 180) return "";
  return "https://maps.google.com/?q=" + latitude.toFixed(6) + "," + longitude.toFixed(6);
}

function locationFor(packet) {
  const { messageFormat } = content;
  const phone = mapLink(packet.phonePosition);
  if (phone) return { text: messageFormat.phoneLocation + " " + phone, included: true };
  const gps = mapLink(packet.gps);
  if (gps) return { text: messageFormat.deviceLocation + " " + gps, included: true };
  return { text: messageFormat.missingLocation, included: false };
}

async function sendWhatsApp(packet, config, location) {
  const parameters = [content.scenarios[packet.kind - 1].text, location.text]
    .map(text => ({ type: "text", text }));
  try {
    const response = await fetch(
      "https://graph.facebook.com/" + config.version + "/" + config.sender + "/messages",
      {
        method: "POST",
        headers: { Authorization: "Bearer " + config.token, "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: config.recipient,
          type: "template",
          template: {
            name: config.template,
            language: { code: "pt_BR" },
            components: [{ type: "body", parameters }],
          },
        }),
        signal: AbortSignal.timeout(9000),
      },
    );
    const body = await response.json();
    const message = body?.messages?.[0];
    if (response.ok && typeof message?.id === "string" && message.id.startsWith("wamid.") &&
        (!message.message_status || message.message_status === "accepted")) return "accepted";
    if (response.status >= 400 && response.status < 500 && response.status !== 408 && body?.error) {
      return "rejected";
    }
    return "unknown";
  } catch {
    return "unknown";
  }
}

function result(packet, row, key) {
  if (row.status === "pending") return { status: "pending" };
  const outcome = row.status === "accepted" && row.has_location ? outcomes.withLocation : outcomes[row.status];
  const bytes = Buffer.alloc(6);
  bytes[0] = outcome;
  bytes.writeUInt32LE(packet.id, 1);
  bytes[5] = packet.kind;
  return { status: row.status, outcome, receipt: digest(key, bytes, 15).toString("hex") };
}

export default async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Vary", "Origin");
  if (request.headers.origin === localPanel) {
    response.setHeader("Access-Control-Allow-Origin", localPanel);
    response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
  if (request.method === "OPTIONS") return response.status(204).end();

  const config = settings();
  if (request.method === "GET") return response.status(200).json({ ready: Boolean(config) });
  if (request.method !== "POST") {
    response.setHeader("Allow", "GET, POST, OPTIONS");
    return response.status(405).json({ error: "Método indisponível." });
  }
  if (!config) return response.status(503).json({ error: "Canal indisponível." });
  const packet = validate(request.body, config.key);
  if (!packet) return response.status(403).json({ error: "Pedido inválido." });

  try {
    const sql = neon(config.db);
    // Reserve the idempotency key before contacting WhatsApp.
    const [reserved] = await sql`
      INSERT INTO public.relay_dispatches (proof) VALUES (${packet.proof})
      ON CONFLICT (proof) DO NOTHING RETURNING proof
    `;
    if (!reserved) {
      const [existing] = await sql`
        SELECT status, has_location FROM public.relay_dispatches WHERE proof = ${packet.proof}
      `;
      return response.status(200).json(result(packet, existing, config.key));
    }
    const location = locationFor(packet);
    const status = await sendWhatsApp(packet, config, location);
    const hasLocation = status === "accepted" && location.included;
    await sql`
      UPDATE public.relay_dispatches SET status = ${status}, has_location = ${hasLocation}
      WHERE proof = ${packet.proof}
    `;
    return response.status(200).json(result(packet, { status, has_location: hasLocation }, config.key));
  } catch {
    console.error("Falha no registro do pedido de apoio.");
    return response.status(503).json({ error: "Envio sem confirmação." });
  }
}
