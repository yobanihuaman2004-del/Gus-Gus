const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(cors());

// Desactivar caché estático
app.use(express.static(__dirname, { etag: false, maxAge: 0 }));

const users = [
  { id: 1, name: "Gus (Creador Maestro)", dni: "12345678", email: "admin@gusgus.com", phone: "999888777", pass: "admin123", role: "ADMIN_MAESTRO", verified: true },
  { id: 2, name: "Usuario Cliente", dni: "87654321", email: "user@gusgus.com", phone: "912345678", pass: "user123", role: "USUARIO_ESTANDAR", verified: true }
];

const verificationCodes = {};

const paymentMethods = {
  yapeNumber: "999888777",
  plinNumber: "999888777",
  lemonCashCCI: process.env.LEMON_CASH_CCI || "922003000000222016298",
  culqiPublicKey: "pk_live_gusgus123456"
};

const deals = [
  {
    id: "GN-1001",
    buyer: "user@gusgus.com",
    seller: "912345678",
    amount: "150.00",
    paymentMethod: "YAPE",
    description: "Compra respaldada por Gus & Nor #2",
    status: "EN_CUSTODIA",
    auditor: "Nor #2 Guard",
    date: new Date().toISOString()
  }
];

const auditLogs = [
  { timestamp: new Date().toISOString(), auditor: "Nor #2 Security", status: "SISTEMA OK", detail: "Sistema iniciado correctamente." }
];

const chatMessages = [
  { id: 1, sender: "Gus (Creador)", receiver: "Soporte", text: "¡Hola! Bienvenido a GG. La app está 100% activa.", image: null, type: "text", time: "10:30 AM" }
];

const verifyAdmin = (req, res, next) => {
  const role = req.headers['x-user-role'];
  if (role === 'ADMIN_MAESTRO') {
    next();
  } else {
    res.status(403).json({ error: "Acceso denegado. Permiso exclusivo del Creador (Gus)." });
  }
};

app.post('/api/auth/register', (req, res) => {
  const { name, dni, email, phone, pass } = req.body;
  const cleanDni = (dni || '76641433').trim();
  const cleanEmail = (email || 'yobanihuaman2004@gmail.com').trim().toLowerCase();
  const cleanPhone = (phone || '900000000').trim();

  let user = users.find(u => u.email === cleanEmail || u.dni === cleanDni);
  if (!user) {
    user = { 
      id: users.length + 1, 
      name: (name || "Usuario").trim(), 
      dni: cleanDni, 
      email: cleanEmail, 
      phone: cleanPhone, 
      pass: (pass || "123456").trim(), 
      role: "USUARIO_ESTANDAR", 
      verified: true 
    };
    users.push(user);
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  verificationCodes[cleanEmail] = code;

  res.json({ message: "Código generado.", email: cleanEmail, demoCode: code, user });
});

app.post('/api/auth/verify', (req, res) => {
  const { email } = req.body;
  const cleanEmail = (email || '').trim().toLowerCase();
  const user = users.find(u => u.email === cleanEmail) || users[0];
  user.verified = true;
  res.json({ message: "¡Cuenta verificada!", user });
});

app.post('/api/auth/login', (req, res) => {
  const { dni, email, pass } = req.body;
  const cleanDni = (dni || '').trim();
  const cleanEmail = (email || '').trim().toLowerCase();

  let user = users.find(u => 
    (cleanDni && u.dni === cleanDni) || 
    (cleanEmail && u.email.toLowerCase() === cleanEmail)
  );

  if (!user) {
    user = {
      id: users.length + 1,
      name: cleanEmail ? cleanEmail.split('@')[0] : `Usuario ${cleanDni || '76641433'}`,
      dni: cleanDni || "76641433",
      email: cleanEmail || "yobanihuaman2004@gmail.com",
      phone: "912345678",
      pass: pass || "123456",
      role: "USUARIO_ESTANDAR",
      verified: true
    };
    users.push(user);
  }

  auditLogs.push({ timestamp: new Date().toISOString(), auditor: "Nor #2", status: "LOGIN OK", detail: `Acceso: ${user.name}` });
  res.json({ message: "¡Bienvenido!", user });
});

app.get('/api/users/search', (req, res) => {
  const { query } = req.query;
  if (!query) return res.json({ users: [] });

  const results = users.filter(u => 
    u.name.toLowerCase().includes(query.toLowerCase()) || 
    u.phone.includes(query) || 
    u.dni.includes(query) ||
    u.email.toLowerCase().includes(query.toLowerCase())
  ).map(u => ({ name: u.name, phone: u.phone, dni: u.dni, email: u.email }));

  res.json({ users: results });
});

app.get('/api/payments/methods', (req, res) => res.json(paymentMethods));

app.post('/api/payments/config', verifyAdmin, (req, res) => {
  const { yapeNumber, plinNumber, lemonCashCCI, culqiPublicKey } = req.body;
  if (yapeNumber) paymentMethods.yapeNumber = yapeNumber;
  if (plinNumber) paymentMethods.plinNumber = plinNumber;
  if (lemonCashCCI) paymentMethods.lemonCashCCI = lemonCashCCI;
  if (culqiPublicKey) paymentMethods.culqiPublicKey = culqiPublicKey;

  res.json({ message: "Métodos de pago guardados.", paymentMethods });
});

app.get('/api/deals', (req, res) => res.json({ deals }));

app.post('/api/deals/create', (req, res) => {
  const { sellerPhoneOrEmail, amount, description, paymentMethod, buyer } = req.body;
  if (!sellerPhoneOrEmail || !amount || !description) return res.status(400).json({ error: "Faltan datos del trato." });

  const newDeal = {
    id: `GN-${Math.floor(1000 + Math.random() * 9000)}`,
    buyer: buyer || "Cliente",
    seller: sellerPhoneOrEmail,
    amount,
    paymentMethod: paymentMethod || "YAPE",
    description,
    status: "EN_CUSTODIA",
    auditor: "Nor #2 Guard",
    date: new Date().toISOString()
  };

  deals.push(newDeal);
  res.json({ message: "Trato registrado en custodia.", deal: newDeal });
});

app.post('/api/deals/ship', (req, res) => {
  const { dealId, trackingPhoto } = req.body;
  const deal = deals.find(d => d.id === dealId);
  if (!deal) return res.status(404).json({ error: "Trato no encontrado." });

  deal.status = "ENVIADO";
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  chatMessages.push({
    id: chatMessages.length + 1,
    sender: "Sistema GG",
    receiver: deal.buyer,
    text: `📦 ¡ENVÍO NOTIFICADO! El pedido del trato ${dealId} fue despachado.`,
    image: trackingPhoto || null,
    type: "system",
    time: timeStr
  });

  res.json({ message: "Envío notificado.", deal });
});

app.post('/api/deals/confirm-receipt', (req, res) => {
  const { dealId } = req.body;
  const deal = deals.find(d => d.id === dealId);
  if (!deal) return res.status(404).json({ error: "Trato no encontrado." });

  deal.status = "RECIBIDO_CONFIRMADO";
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  chatMessages.push({
    id: chatMessages.length + 1,
    sender: "Sistema GG",
    receiver: "Gus & Soporte",
    text: `✅ ¡RECEPCIÓN CONFIRMADA! El comprador ha recibido el producto del trato ${dealId}.`,
    image: null,
    type: "system",
    time: timeStr
  });

  res.json({ message: "¡Recepción confirmada!", deal });
});

app.post('/api/deals/release', verifyAdmin, (req, res) => {
  const { dealId } = req.body;
  const deal = deals.find(d => d.id === dealId);
  if (!deal) return res.status(404).json({ error: "Trato no encontrado." });

  deal.status = "LIBERADO";
  res.json({ message: `Fondos del trato ${dealId} liberados con éxito.` });
});

app.get('/api/chat', (req, res) => {
  const { user1 } = req.query;
  const msgs = chatMessages.filter(m => m.sender === user1 || m.receiver === user1 || m.sender.includes("Gus") || m.type === "system");
  res.json({ messages: msgs });
});

app.post('/api/chat/send', (req, res) => {
  const { sender, receiver, text, image } = req.body;
  if (!text && !image) return res.status(400).json({ error: "Ingresa texto o foto." });

  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const newMsg = {
    id: chatMessages.length + 1,
    sender,
    receiver: receiver || "Gus & Soporte",
    text: text || "",
    image: image || null,
    type: "user",
    time: timeStr
  };
  chatMessages.push(newMsg);
  res.json({ message: "Mensaje enviado", chat: newMsg });
});

app.get('/api/audit', verifyAdmin, (req, res) => res.json({ logs: auditLogs }));

// Forzar respuesta sin caché para la página HTML
app.use((req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => console.log(`[GG] Servidor listo en puerto ${PORT}`));
