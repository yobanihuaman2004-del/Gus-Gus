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

// Base de usuarios registrados con Cuentas Bancarias
const users = [
  { 
    id: 1, 
    name: "Yobani (Creador Maestro)", 
    dni: "76641433", 
    email: "yobanihuaman2004@gmail.com", 
    phone: "912345678", 
    pass: "123456", 
    role: "ADMIN_MAESTRO", 
    bankAccounts: {
      yape: "912345678",
      plin: "912345678",
      cci: "0000003100087664143301",
      bankApp: "Lemon Cash / BCP"
    },
    verified: true 
  }
];

const verificationCodes = {};

// Pasarelas y recaudo (Lemon Cash configurado para fondos de la app Gus Gus)
const paymentMethods = {
  yapeNumber: "999888777",
  plinNumber: "999888777",
  lemonCashCCI: process.env.LEMON_CASH_CCI || "0000003100087664143301",
  lemonCashTag: "$gusgus.lemon",
  culqiPublicKey: "pk_live_gusgus123456"
};

const deals = [
  {
    id: "GN-1001",
    buyer: "yobanihuaman2004@gmail.com",
    seller: "912345678",
    amount: "150.00",
    paymentMethod: "LEMON_CASH",
    description: "Trato inicial en custodia Gus Gus",
    status: "EN_CUSTODIA",
    auditor: "Nor #2 Guard",
    date: new Date().toISOString()
  }
];

const auditLogs = [
  { timestamp: new Date().toISOString(), auditor: "Nor #2 Security", status: "SISTEMA OK", detail: "Servidor iniciado. Módulo de Cuentas Bancarias activo." }
];

const chatMessages = [
  { id: 1, sender: "Soporte Gus Gus", receiver: "yobanihuaman2004@gmail.com", text: "¡Hola Yobani! Puedes registrar tus cuentas bancarias en tu perfil.", image: null, type: "text", time: "10:30 AM" }
];

const verifyAdmin = (req, res, next) => {
  const role = req.headers['x-user-role'];
  if (role === 'ADMIN_MAESTRO') {
    next();
  } else {
    res.status(403).json({ error: "Acceso denegado. Permiso exclusivo del Creador Maestro (Yobani)." });
  }
};

// --- AUTENTICACIÓN Y REGISTRO ---
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
      role: (cleanEmail === "yobanihuaman2004@gmail.com" || cleanDni === "76641433") ? "ADMIN_MAESTRO" : "USUARIO_ESTANDAR", 
      bankAccounts: { yape: "", plin: "", cci: "", bankApp: "" },
      verified: true 
    };
    users.push(user);
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  verificationCodes[cleanEmail] = code;

  res.json({ message: "Código generado.", email: cleanEmail, demoCode: code, user });
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
      role: (cleanEmail === "yobanihuaman2004@gmail.com" || cleanDni === "76641433") ? "ADMIN_MAESTRO" : "USUARIO_ESTANDAR",
      bankAccounts: { yape: "", plin: "", cci: "", bankApp: "" },
      verified: true
    };
    users.push(user);
  }

  auditLogs.push({ timestamp: new Date().toISOString(), auditor: "Nor #2", status: "LOGIN OK", detail: `Acceso: ${user.name}` });
  res.json({ message: "¡Bienvenido!", user });
});

// --- REGISTRO Y GUARDADO DE CUENTAS BANCARIAS DEL USUARIO ---
app.post('/api/user/bank-accounts', (req, res) => {
  const { email, yape, plin, cci, bankApp } = req.body;
  const cleanEmail = (email || '').trim().toLowerCase();

  let user = users.find(u => u.email === cleanEmail);
  if (!user) {
    return res.status(404).json({ error: "Usuario no encontrado." });
  }

  user.bankAccounts = {
    yape: (yape || '').trim(),
    plin: (plin || '').trim(),
    cci: (cci || '').trim(),
    bankApp: (bankApp || '').trim()
  };

  auditLogs.push({ 
    timestamp: new Date().toISOString(), 
    auditor: "Nor #2", 
    status: "CUENTAS REGISTRADAS", 
    detail: `Cuentas actualizadas para ${user.name}: Yape (${user.bankAccounts.yape}), Plin (${user.bankAccounts.plin}), Banco (${user.bankAccounts.bankApp})` 
  });

  res.json({ message: "¡Cuentas bancarias registradas con éxito en el sistema!", bankAccounts: user.bankAccounts });
});

app.get('/api/users/search', (req, res) => {
  const { query } = req.query;
  if (!query) return res.json({ users: [] });

  const results = users.filter(u => 
    u.name.toLowerCase().includes(query.toLowerCase()) || 
    u.phone.includes(query) || 
    u.dni.includes(query) ||
    u.email.toLowerCase().includes(query.toLowerCase())
  ).map(u => ({ name: u.name, phone: u.phone, dni: u.dni, email: u.email, bankAccounts: u.bankAccounts }));

  res.json({ users: results });
});

app.get('/api/payments/methods', (req, res) => res.json(paymentMethods));

app.get('/api/deals', (req, res) => res.json({ deals }));

app.post('/api/deals/create', (req, res) => {
  const { sellerPhoneOrEmail, amount, description, paymentMethod, buyer } = req.body;
  if (!sellerPhoneOrEmail || !amount || !description) return res.status(400).json({ error: "Faltan datos del trato." });

  const newDeal = {
    id: `GN-${Math.floor(1000 + Math.random() * 9000)}`,
    buyer: buyer || "Cliente",
    seller: sellerPhoneOrEmail,
    amount,
    paymentMethod: paymentMethod || "LEMON_CASH",
    description,
    status: "EN_CUSTODIA",
    auditor: "Nor #2 Guard",
    date: new Date().toISOString()
  };

  deals.push(newDeal);
  res.json({ message: "Trato registrado en custodia Gus Gus.", deal: newDeal });
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

app.use((req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => console.log(`[GG] Servidor listo en puerto ${PORT}`));
