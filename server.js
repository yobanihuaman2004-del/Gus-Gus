const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(cors());

// Desactivar caché
app.use(express.static(__dirname, { etag: false, maxAge: 0 }));

// Base de datos de usuarios (Creador Maestro Yobani)
const users = [
  { 
    id: 1, 
    name: "Yobani Huamán (Creador Maestro)", 
    dni: "76641433", 
    email: "yobanihuaman2004@gmail.com", 
    phone: "930715341", 
    pass: "123456", 
    role: "ADMIN_MAESTRO", 
    bankAccounts: {
      yape: "930715341",
      plin: "930715341",
      cci: "0000003100087664143301",
      bankApp: "Lemon Cash"
    },
    verified: true 
  }
];

const resetTokens = {};

const paymentMethods = {
  yapeNumber: "930715341",
  plinNumber: "930715341",
  lemonCashCCI: process.env.LEMON_CASH_CCI || "0000003100087664143301",
  lemonCashTag: "$gusgus.lemon"
};

const deals = [
  {
    id: "GN-1001",
    buyer: "yobanihuaman2004@gmail.com",
    seller: "930715341",
    amount: "150.00",
    fee: "4.50",
    paymentMethod: "LEMON_CASH",
    description: "Trato en custodia Gus, Nort II & Cus",
    status: "EN_CUSTODIA",
    date: new Date().toISOString()
  }
];

const chatMessages = [
  { id: 1, sender: "yobanihuaman2004@gmail.com", receiver: "Gus, Nort II & Cus (Soporte)", text: "Hola Yobani, la red de custodia Gus, Nort II y Cus está 100% activa.", time: "10:30 AM" }
];

/* --- ENDPOINTS AUTENTICACIÓN --- */

app.post('/api/auth/login', (req, res) => {
  const { dni, email, pass } = req.body;
  const cleanDni = (dni || '').trim();
  const cleanEmail = (email || '').trim().toLowerCase();

  let user = users.find(u => 
    (cleanDni && u.dni === cleanDni) || 
    (cleanEmail && (u.email.toLowerCase() === cleanEmail || u.phone === cleanEmail))
  );

  const esAdmin = (cleanEmail === "yobanihuaman2004@gmail.com" || cleanEmail === "930715341" || cleanDni === "76641433");

  if (!user) {
    user = {
      id: users.length + 1,
      name: esAdmin ? "Yobani Huamán (Creador Maestro)" : (cleanEmail ? cleanEmail.split('@')[0] : `Usuario ${cleanDni}`),
      dni: cleanDni || "76641433",
      email: cleanEmail.includes('@') ? cleanEmail : "yobanihuaman2004@gmail.com",
      phone: cleanEmail.includes('@') ? "930715341" : cleanEmail,
      pass: pass || "123456",
      role: esAdmin ? "ADMIN_MAESTRO" : "USUARIO_ESTANDAR",
      bankAccounts: { yape: "", plin: "", cci: "", bankApp: "Yape / BCP" },
      verified: true
    };
    users.push(user);
  } else if (esAdmin) {
    user.role = "ADMIN_MAESTRO";
    user.phone = "930715341";
  }

  res.json({ message: "Inicio de sesión exitoso", user });
});

app.post('/api/auth/register', (req, res) => {
  const { name, dni, email, phone, pass } = req.body;
  const cleanDni = (dni || '').trim();
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanPhone = (phone || '').trim();
  const esAdmin = (cleanEmail === "yobanihuaman2004@gmail.com" || cleanDni === "76641433" || cleanPhone === "930715341");

  let user = users.find(u => u.email === cleanEmail || u.dni === cleanDni || u.phone === cleanPhone);
  if (!user) {
    user = { 
      id: users.length + 1, 
      name: (name || "Usuario").trim(), 
      dni: cleanDni, 
      email: cleanEmail, 
      phone: cleanPhone, 
      pass: (pass || "123456").trim(), 
      role: esAdmin ? "ADMIN_MAESTRO" : "USUARIO_ESTANDAR", 
      bankAccounts: { yape: "", plin: "", cci: "", bankApp: "Yape / BCP" },
      verified: true 
    };
    users.push(user);
  }

  res.json({ message: "Usuario registrado con éxito", user });
});

app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  const cleanEmail = (email || '').trim().toLowerCase();
  const user = users.find(u => u.email === cleanEmail || u.phone === cleanEmail || u.dni === cleanEmail);
  
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  if (user) {
    resetTokens[user.email] = code;
  }
  res.json({ message: "Código generado de recuperación", code: code });
});

app.post('/api/auth/reset-password', (req, res) => {
  const { email, code, newPass } = req.body;
  const cleanEmail = (email || '').trim().toLowerCase();
  
  const user = users.find(u => u.email === cleanEmail || u.phone === cleanEmail || u.dni === cleanEmail);
  if (user) {
    user.pass = newPass;
    return res.json({ message: "Contraseña actualizada correctamente." });
  }
  res.status(400).json({ error: "No se pudo restablecer la contraseña." });
});

/* --- ENDPOINTS PERFIL Y BANCOS --- */

app.post('/api/user/update-profile', (req, res) => {
  const { email, name, phone, yape, plin, cci, bankApp } = req.body;
  const cleanEmail = (email || '').trim().toLowerCase();
  const user = users.find(u => u.email === cleanEmail || u.dni === cleanEmail);

  if (!user) return res.status(404).json({ error: "Usuario no encontrado." });

  if (name) user.name = name.trim();
  if (phone) user.phone = phone.trim();

  user.bankAccounts = {
    yape: (yape || '').trim(),
    plin: (plin || '').trim(),
    cci: (cci || '').trim(),
    bankApp: (bankApp || '').trim()
  };

  res.json({ message: "Perfil y datos bancarios actualizados.", user });
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

/* --- ENDPOINTS TRATOS Y CHAT --- */

app.get('/api/deals', (req, res) => res.json({ deals }));

app.post('/api/deals/create', (req, res) => {
  const { sellerPhoneOrEmail, amount, description, paymentMethod, buyer } = req.body;
  if (!sellerPhoneOrEmail || !amount || !description) {
    return res.status(400).json({ error: "Completa los datos requeridos." });
  }

  const fee = (parseFloat(amount) * 0.03).toFixed(2);
  const newDeal = {
    id: `GN-${Math.floor(1000 + Math.random() * 9000)}`,
    buyer: buyer || "Cliente",
    seller: sellerPhoneOrEmail,
    amount,
    fee,
    paymentMethod: paymentMethod || "LEMON_CASH",
    description,
    status: "EN_CUSTODIA",
    date: new Date().toISOString()
  };

  deals.push(newDeal);
  res.json({ message: "Trato registrado en custodia Gus, Nort II & Cus.", deal: newDeal });
});

app.get('/api/chat', (req, res) => {
  const { user1 } = req.query;
  const msgs = chatMessages.filter(m => m.sender === user1 || m.receiver === user1 || m.sender.includes("Gus"));
  res.json({ messages: msgs });
});

app.post('/api/chat/send', (req, res) => {
  const { sender, receiver, text } = req.body;
  if (!text) return res.status(400).json({ error: "Mensaje vacío." });

  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const newMsg = {
    id: chatMessages.length + 1,
    sender,
    receiver: receiver || "Gus, Nort II & Cus (Soporte)",
    text,
    time: timeStr
  };
  chatMessages.push(newMsg);
  res.json({ message: "Mensaje enviado", chat: newMsg });
});

app.use((req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => console.log(`[Gus, Nort II & Cus] Servidor activo en puerto ${PORT}`));
                          
