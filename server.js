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

// Base de datos de usuarios
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

const resetTokens = {};

// Pasarelas y recaudo
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

const chatMessages = [
  { id: 1, sender: "Soporte Gus Gus", receiver: "yobanihuaman2004@gmail.com", text: "¡Hola Yobani! Bienvenido al panel principal de Gus Gus.", image: null, type: "text", time: "10:30 AM" }
];

// AUTENTICACIÓN
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

  res.json({ message: "¡Cuenta creada y verificada exitosamente!", user });
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

  res.json({ message: "¡Bienvenido!", user });
});

// RECUPERACIÓN DE CONTRASEÑA
app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  const cleanEmail = (email || '').trim().toLowerCase();

  let user = users.find(u => u.email === cleanEmail);
  if (!user) {
    return res.status(404).json({ error: "El correo ingresado no está registrado." });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  resetTokens[cleanEmail] = code;

  res.json({ message: "Código de recuperación enviado.", code: code });
});

app.post('/api/auth/reset-password', (req, res) => {
  const { email, code, newPass } = req.body;
  const cleanEmail = (email || '').trim().toLowerCase();

  if (resetTokens[cleanEmail] && resetTokens[cleanEmail] === code) {
    let user = users.find(u => u.email === cleanEmail);
    if (user) {
      user.pass = newPass;
      delete resetTokens[cleanEmail];
      return res.json({ message: "Contraseña actualizada con éxito." });
    }
  }

  res.status(400).json({ error: "Código de verificación inválido." });
});

// CUENTAS BANCARIAS
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

  res.json({ message: "¡Cuentas bancarias registradas con éxito!", bankAccounts: user.bankAccounts });
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
  const { sender, receiver, text } = req.body;
  if (!text) return res.status(400).json({ error: "Ingresa texto." });

  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const newMsg = {
    id: chatMessages.length + 1,
    sender,
    receiver: receiver || "Gus & Soporte",
    text: text || "",
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
