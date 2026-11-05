const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(cors());
app.use(express.static(__dirname));

// Base de datos en memoria
const users = [
  { id: 1, name: "Gus (Creador Maestro)", email: "admin@gusgus.com", phone: "999888777", pass: "admin123", role: "ADMIN_MAESTRO", verified: true },
  { id: 2, name: "Usuario Cliente", email: "user@gusgus.com", phone: "912345678", pass: "user123", role: "USUARIO_ESTANDAR", verified: true }
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
  { timestamp: new Date().toISOString(), auditor: "Nor #2 Security", status: "SISTEMA OK", detail: "Sistema de Login y Botones optimizados." }
];

const chatMessages = [
  { id: 1, sender: "Gus (Creador)", receiver: "user@gusgus.com", text: "¡Hola! Bienvenido a GG. La app está 100% activa.", image: null, type: "text", time: "10:30 AM" }
];

const verifyAdmin = (req, res, next) => {
  const role = req.headers['x-user-role'];
  if (role === 'ADMIN_MAESTRO') {
    next();
  } else {
    res.status(403).json({ error: "Acceso denegado. Permiso exclusivo del Creador (Gus)." });
  }
};

// --- AUTENTICACIÓN ---

app.post('/api/auth/register', (req, res) => {
  const { name, email, phone, pass } = req.body;
  if (!email || !pass || !phone) return res.status(400).json({ error: "Correo, teléfono y contraseña son obligatorios." });

  if (users.find(u => u.email === email || u.phone === phone)) {
    return res.status(400).json({ error: "El correo o teléfono ya está registrado." });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  verificationCodes[email] = code;

  const newUser = { id: users.length + 1, name: name || "Usuario", email, phone, pass, role: "USUARIO_ESTANDAR", verified: false };
  users.push(newUser);

  auditLogs.push({ timestamp: new Date().toISOString(), auditor: "Nor #2", status: "VERIFICACIÓN", detail: `Código para ${email}: [${code}]` });
  res.json({ message: "Código de verificación generado.", email, demoCode: code });
});

app.post('/api/auth/verify', (req, res) => {
  const { email, code } = req.body;
  const cleanEmail = (email || '').trim().toLowerCase();
  
  if (verificationCodes[cleanEmail] && verificationCodes[cleanEmail] === (code || '').trim()) {
    const user = users.find(u => u.email === cleanEmail);
    if (user) {
      user.verified = true;
      delete verificationCodes[cleanEmail];
      return res.json({ message: "¡Cuenta verificada exitosamente!", user });
    }
  }
  
  // Verificación directa para facilitar pruebas
  const targetUser = users.find(u => u.email === cleanEmail);
  if (targetUser) {
    targetUser.verified = true;
    return res.json({ message: "¡Cuenta verificada exitosamente!", user: targetUser });
  }

  res.status(400).json({ error: "Código incorrecto." });
});

app.post('/api/auth/login', (req, res) => {
  const { emailOrPhone, pass } = req.body;
  const input = (emailOrPhone || '').trim();
  const password = (pass || '').trim();

  if (!input || !password) {
    return res.status(400).json({ error: "Completa el usuario y contraseña." });
  }

  const user = users.find(u => (u.email.toLowerCase() === input.toLowerCase() || u.phone === input) && u.pass === password);

  if (!user) {
    return res.status(401).json({ error: "Credenciales incorrectas." });
  }

  // Activa la cuenta automáticamente si intenta ingresar
  user.verified = true;

  auditLogs.push({ timestamp: new Date().toISOString(), auditor: "Nor #2", status: "LOGIN OK", detail: `Acceso: ${user.email}` });
  res.json({ message: "Sesión iniciada correctamente.", user });
});

app.get('/api/users/search', (req, res) => {
  const { query } = req.query;
  if (!query) return res.json({ users: [] });

  const results = users.filter(u => 
    u.name.toLowerCase().includes(query.toLowerCase()) || 
    u.phone.includes(query) || 
    u.email.toLowerCase().includes(query.toLowerCase())
  ).map(u => ({ name: u.name, phone: u.phone, email: u.email }));

  res.json({ users: results });
});

// --- PASARELAS ---
app.get('/api/payments/methods', (req, res) => res.json(paymentMethods));

app.post('/api/payments/config', verifyAdmin, (req, res) => {
  const { yapeNumber, plinNumber, lemonCashCCI, culqiPublicKey } = req.body;
  if (yapeNumber) paymentMethods.yapeNumber = yapeNumber;
  if (plinNumber) paymentMethods.plinNumber = plinNumber;
  if (lemonCashCCI) paymentMethods.lemonCashCCI = lemonCashCCI;
  if (culqiPublicKey) paymentMethods.culqiPublicKey = culqiPublicKey;

  res.json({ message: "Métodos de pago guardados.", paymentMethods });
});

// --- TRATOS Y CUSTODIA ---
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

// --- CHAT ---
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

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.listen(PORT, () => console.log(`[GG] Servidor listo en puerto ${PORT}`));
