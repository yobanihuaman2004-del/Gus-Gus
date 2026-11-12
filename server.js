const express = require("express");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 10000;
const ROOT = __dirname;

app.use(express.json({ limit: "200kb" }));
// Solo se publican estos dos archivos (el resto del proyecto queda privado)
app.get(["/", "/index.html"], (req, res) => res.sendFile(path.join(ROOT, "index.html")));
app.get("/config.js", (req, res) => res.sendFile(path.join(ROOT, "config.js")));

app.get("/health", (req, res) => res.status(200).send("GusGus funcionando"));

// Variables de entorno en Render: SUPABASE_URL, SUPABASE_ANON_KEY, GEMINI_API_KEY (opcional: GEMINI_MODEL)
const sb = process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
  : null;

const SYSTEM = `Eres GUSS, el asistente de GusGus, una app peruana para comprar y vender con confianza (moneda: soles, S/).
Responde siempre en español, breve y claro. Ayudas con publicar productos, tratos, saldo y comisiones.
La comisión por trato se divide en partes iguales: 50% comprador y 50% vendedor.
Los pagos reales con EasyPay todavía están desactivados. No inventes datos de cuentas ni saldos de usuarios.`;

const hits = new Map();
function limited(id) {
  const now = Date.now();
  const list = (hits.get(id) || []).filter(t => now - t < 60000);
  list.push(now);
  hits.set(id, list);
  return list.length > 10;
}

app.post("/api/guss", async (req, res) => {
  try {
    if (!sb || !process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: "GUSS no está configurado en el servidor." });
    }
    const token = (req.headers.authorization || "").replace(/^Bearer /, "");
    const { data, error } = await sb.auth.getUser(token);
    if (error || !data || !data.user) return res.status(401).json({ error: "Sesión no válida." });
    if (limited(data.user.id)) return res.status(429).json({ error: "Demasiados mensajes. Espera un minuto." });

    const msgs = Array.isArray(req.body.messages) ? req.body.messages.slice(-20) : [];
    const contents = msgs
      .filter(m => m && typeof m.text === "string" && m.text.trim())
      .map(m => ({ role: m.role === "user" ? "user" : "model", parts: [{ text: m.text.slice(0, 2000) }] }));
    while (contents.length && contents[0].role === "model") contents.shift();
    if (!contents.length || contents[contents.length - 1].role !== "user") {
      return res.status(400).json({ error: "Mensaje vacío." });
    }

    const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
      body: JSON.stringify({ systemInstruction: { parts: [{ text: SYSTEM }] }, contents })
    });
    const j = await r.json();
    if (!r.ok) return res.status(502).json({ error: "El asistente no respondió." });
    const answer = (j.candidates?.[0]?.content?.parts || []).map(p => p.text || "").join("").trim();
    res.json({ answer: answer || "No pude generar una respuesta." });
  } catch (e) {
    console.error("GUSS error:", e.message);
    res.status(500).json({ error: "Error interno." });
  }
});

app.listen(PORT, "0.0.0.0", () => console.log("GusGus en puerto", PORT));
