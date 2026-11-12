const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/status", (_req, res) => {
  res.json({
    ok: true,
    aiConfigured: Boolean(process.env.GEMINI_API_KEY),
    payments: "disabled"
  });
});

// GUSS conectado a Google AI.
// Configura GEMINI_API_KEY en las variables de entorno de Render.
app.post("/api/guss", async (req, res) => {
  try {
    const key = process.env.GEMINI_API_KEY;

    if (!key) {
      return res.status(503).json({
        error: "GUSS necesita configurar GEMINI_API_KEY en Render."
      });
    }

    const messages = Array.isArray(req.body.messages)
      ? req.body.messages.slice(-20)
      : [];

    const prompt = messages.map(m =>
      `${m.role === "model" ? "GUSS" : "Usuario"}: ${String(m.text || "").slice(0, 4000)}`
    ).join("\n");

    if (!prompt.trim()) {
      return res.status(400).json({ error: "Escribe un mensaje." });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(key)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{
              text: "Eres GUSS, el asistente de GusGus. Responde en español con claridad y continuidad. Ayuda con compras, ventas, tratos, comisiones y prevención de estafas. Nunca afirmes que un pago se realizó sin confirmación oficial."
            }]
          },
          contents: [{
            role: "user",
            parts: [{ text: prompt }]
          }]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(502).json({
        error: data.error?.message || "Error de conexión con Google AI."
      });
    }

    const answer = data.candidates?.[0]?.content?.parts
      ?.map(p => p.text || "").join("").trim();

    if (!answer) {
      return res.status(502).json({ error: "GUSS no recibió respuesta." });
    }

    res.json({ answer });

  } catch (error) {
    console.error("Error GUSS:", error);
    res.status(500).json({
      error: "Error temporal. Tu historial se conserva."
    });
  }
});

// EasyPay: preparado, pero desactivado hasta recibir autorización.
app.get("/api/easypay/status", (_req, res) => {
  res.json({
    enabled: false,
    message: "EasyPay pendiente de autorización."
  });
});

app.post("/api/easypay/checkout", (_req, res) => {
  res.status(503).json({
    error: "Los pagos están desactivados hasta conectar EasyPay."
  });
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`GusGus disponible en el puerto ${PORT}`);
});
