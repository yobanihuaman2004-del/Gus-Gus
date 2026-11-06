const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));
app.use(cors());

// Desactivar caché estático para evitar problemas de refresco
app.use(express.static(__dirname, { etag: false, maxAge: 0 }));

// Base de datos de usuarios en memoria
const users = [
  { 
    id: 1, 
    name: "Yobani", 
    dni: "76641433", 
    email: "yobanihuaman2004@gmail.com", 
    phone: "912345678", 
    pass: "123456", 
    role: "ADMIN_MAESTRO", 
    bankAccounts: {
      yape: "912345678",
      plin: "912345678",
      cci: "0000003100087664143301",
      bankApp: "Lemon Cash"
    },
    verified: true 
  }
];

const resetTokens = {};

// Configuración de métodos de pago y recaudo
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
    date: new Date().toISOString()
  }
];

const chatMessages = [
  { id: 1, sender: "Soporte Gus Gus", receiver: "yobanihuaman2004@gmail.com", text: "Bienvenido al panel principal de Gus Gus.", image: null, type: "text", time: "10:30 AM" }
];

/* --- ENDPOINTS DE AUTENTICACIÓN --- */

// Inicio de sesión
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

  res.json({ message: "Inicio de sesión exitoso", user });
});

// Registro de usuario
app.post('/api/auth/register', (req, res) => {
  const { name, dni, email, phone, pass } = req.body;
  const cleanDni = (dni || '').trim();
  const cleanEmail = (email || '').trim().toLowerCase();

  let user = users.find(u => u.email === cleanEmail || u.dni === cleanDni);
  if (!user) {
    user = { 
      id: users.length + 1, 
      name: (name || "Usuario").trim(), 
      dni: cleanDni, 
      email: cleanEmail, 
      phone: (phone || '').trim(), 
      pass: (pass || "123456").trim(), 
      role: (cleanEmail === "yobanihuaman2004@gmail.com" || cleanDni === "76641433") ? "ADMIN_MAESTRO" : "USUARIO_ESTANDAR", 
      bankAccounts: { yape: "", plin: "", cci: "", bankApp: "" },
      verified: true 
    };
    users.push(user);
  }

  res.json({ message: "Usuario registrado con éxito", user });
});

// Solicitar código de recuperación
app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  const cleanEmail = (email || '').trim().toLowerCase();

  const user = users.find(u => u.email === cleanEmail);
  if (!user) {
    return res.status(404).json({ error: "El correo ingresado no existe en el sistema." });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  resetTokens[cleanEmail] = code;

  res.json({ message: "Código generado", code });
});

// Restablecer contraseña
app.post('/api/auth/reset-password', (req, res) => {
  const { email, code, newPass } = req.body;
  const cleanEmail = (email || '').trim().toLowerCase();

  if (resetTokens[cleanEmail] && resetTokens[cleanEmail] === code) {
    const user = users.find(u => u.email === cleanEmail);
    if (user) {
      user.pass = newPass;
      delete resetTokens[cleanEmail];
      return res.json({ message: "Contraseña restablecida correctamente." });
    }
  }

  res.status(400).json({ error: "El código ingresado es incorrecto o ha expirado." });
});

/* --- ENDPOINTS DE FUNCIONALIDAD --- */

// Guardar cuentas bancarias
app.post('/api/user/bank-accounts', (req, res) => {
  const { email, yape, plin, cci, bankApp } = req.body;
  const cleanEmail = (email || '').trim().toLowerCase();

  const user = users.find(u => u.email === cleanEmail);
  if (!user) {
    return res.status(404).json({ error: "Usuario no encontrado." });
  }

  user.bankAccounts = {
    yape: (yape || '').trim(),
    plin: (plin || '').trim(),
    cci: (cci || '').trim(),
    bankApp: (bankApp || '').trim()
  };

  res.json({ message: "Cuentas bancarias actualizadas correctamente.", bankAccounts: user.bankAccounts });
});

// Listar y crear tratos
app.get('/api/deals', (req, res) => res.json({ deals }));

app.post('/api/deals/create', (req, res) => {
  const { sellerPhoneOrEmail, amount, description, paymentMethod, buyer } = req.body;
  if (!sellerPhoneOrEmail || !amount || !description) {
    return res.status(400).json({ error: "Completa todos los campos obligatorios." });
  }

  const newDeal = {
    id: `GN-${Math.floor(1000 + Math.random() * 9000)}`,
    buyer: buyer || "Cliente",
    seller: sellerPhoneOrEmail,
    amount,
    paymentMethod: paymentMethod || "LEMON_CASH",
    description,
    status: "EN_CUSTODIA",
    date: new Date().toISOString()
  };

  deals.push(newDeal);
  res.json({ message: "Trato en custodia registrado exitosamente.", deal: newDeal });
});

// Chat de soporte
app.get('/api/chat', (req, res) => {
  const { user1 } = req.query;
  const msgs = chatMessages.filter(m => m.sender === user1 || m.receiver === user1 || m.sender.includes("Gus") || m.type === "system");
  res.json({ messages: msgs });
});

app.post('/api/chat/send', (req, res) => {
  const { sender, receiver, text } = req.body;
  if (!text) return res.status(400).json({ error: "El mensaje no puede estar vacío." });

  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const newMsg = {
    id: chatMessages.length + 1,
    sender,
    receiver: receiver || "Gus & Soporte",
    text: text,
    type: "user",
    time: timeStr
  };
  chatMessages.push(newMsg);
  res.json({ message: "Mensaje enviado", chat: newMsg });
});

// Ruta por defecto para frontend
app.use((req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => console.log(`[Servidor] Ejecutándose en puerto ${PORT}`));
