'use strict';
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 10000;
app.disable('x-powered-by');
app.use(express.json({ limit: '256kb' }));
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));
const gussRate = new Map();

app.get('/api/status', (_req, res) => res.json({
  ok: true,
  aiConfigured: Boolean(process.env.GEMINI_API_KEY),
  payments: 'disabled_until_provider_authorization'
}));

// La clave de Gemini solo existe en el servidor (variable GEMINI_API_KEY).
// El historial lo conserva el cliente y envía una ventana limitada para mantener continuidad.
app.post('/api/guss', async (req, res) => {
  try {
    const auth = req.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    if (!token) return res.status(401).json({ error: 'Inicia sesión para usar GUSS.' });
    if (!supabaseUrl || !supabaseAnonKey) return res.status(503).json({ error: 'Falta configurar SUPABASE_URL y SUPABASE_ANON_KEY en el servidor.' });
    const authResponse = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/user`, { headers: { apikey: supabaseAnonKey, Authorization: `Bearer ${token}` } });
    if (!authResponse.ok) return res.status(401).json({ error: 'Tu sesión no es válida. Vuelve a iniciar sesión.' });
    const authUser = await authResponse.json();
    const now = Date.now();
    const bucket = gussRate.get(authUser.id) || { start: now, count: 0 };
    if (now - bucket.start > 60000) { bucket.start = now; bucket.count = 0; }
    bucket.count += 1; gussRate.set(authUser.id, bucket);
    if (bucket.count > 30) return res.status(429).json({ error: 'Has enviado muchos mensajes. Espera un minuto e inténtalo otra vez.' });
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(503).json({ error: 'GUSS no está conectado: falta GEMINI_API_KEY en el servidor.' });
    const input = Array.isArray(req.body?.messages) ? req.body.messages.slice(-24) : [];
    const contents = input.map(m => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: String(m.text || '').slice(0, 3500) }]
    })).filter(m => m.parts[0].text.trim());
    if (!contents.length || contents[contents.length - 1].role !== 'user') {
      return res.status(400).json({ error: 'Escribe un mensaje para GUSS.' });
    }
    const upstream = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: 'Eres GUSS, el asistente oficial de GusGus. Habla siempre en español, conserva el contexto de la conversación, explica cómo comprar, vender y crear tratos, aclara la comisión configurada y ayuda a detectar señales de estafa. No afirmes que un pago, custodia o transferencia real ocurrió sin confirmación del proveedor. En GusGus, el vendedor envía una propuesta con foto, precio, categoría, descripción y moneda PEN o USD; el comprador debe revisarla y aceptarla antes de crear el trato. La comisión total es configurable y se divide 50/50. Nunca pidas contraseñas, códigos OTP ni claves privadas. Si no sabes algo, dilo claramente.' }] },
        contents,
        generationConfig: { temperature: 0.6, maxOutputTokens: 900 }
      })
    });
    const data = await upstream.json();
    if (!upstream.ok) return res.status(502).json({ error: data?.error?.message || 'Google AI no pudo responder.' });
    const answer = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('').trim();
    if (!answer) return res.status(502).json({ error: 'GUSS no recibió una respuesta válida.' });
    res.json({ answer });
  } catch (error) {
    console.error('GUSS error:', error);
    res.status(500).json({ error: 'Error temporal de GUSS. El historial de esta conversación permanece guardado en este dispositivo.' });
  }
});

app.get('/api/payments/status', (_req, res) => res.json({ enabled: false, message: 'Los pagos reales se habilitarán después de integrar y autorizar un proveedor.' }));
app.post('/api/payments/checkout', (_req, res) => res.status(503).json({ error: 'Los pagos reales todavía no están habilitados.' }));
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.listen(PORT, '0.0.0.0', () => console.log(`GusGus iniciado en puerto ${PORT}`));
