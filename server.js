const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Base de datos en memoria
const users = [
  { id: 1, email: "admin@gusgus.com", pass: "admin123", role: "ADMIN_MAESTRO", name: "Creador Maestro" },
  { id: 2, email: "user@gusgus.com", pass: "user123", role: "USUARIO_ESTANDAR", name: "Usuario Cliente" }
];

const systemConfig = {
  appName: "Gus Gus",
  lemonCashCCI: process.env.LEMON_CASH_CCI || "922003000000222016298",
  logo: "GG - Estilo Disney Mouse",
  theme: "Victoriano-Industrial Elite"
};

const deals = [
  {
    id: "DEAL-101",
    buyer: "cliente1@gusgus.com",
    seller: "vendedor1@gusgus.com",
    amount: "150.00",
    description: "Compra de cuenta digital asegurada",
    status: "EN_CUSTODIA",
    date: new Date().toISOString()
  }
];

const auditLogs = [
  { timestamp: new Date().toISOString(), auditor: "Gus & Nor #2", status: "SISTEMA OK", detail: "Sistema Gus Gus e Intermediación activos." }
];

const messages = [];

// Middleware de verificación para el Admin Maestro
const verifyAdmin = (req, res, next) => {
  const role = req.headers['x-user-role'];
  if (role === 'ADMIN_MAESTRO') {
    next();
  } else {
    res.status(403).json({ error: "Acceso denegado. Permiso exclusivo del Creador Maestro." });
  }
};

// Rutas Autenticación
app.post('/api/auth/register', (req, res) => {
  const { name, email, pass } = req.body;
  if (!email || !pass) return res.status(400).json({ error: "Todos los campos son obligatorios." });
  if (users.find(u => u.email === email)) return res.status(400).json({ error: "El correo ya está registrado." });

  const newUser = { id: users.length + 1, name: name || "Usuario", email, pass, role: "USUARIO_ESTANDAR" };
  users.push(newUser);
  res.json({ message: "Usuario registrado con éxito.", user: newUser });
});

app.post('/api/auth/login', (req, res) => {
  const { email, pass } = req.body;
  const user = users.find(u => u.email === email && u.pass === pass);
  if (!user) return res.status(401).json({ error: "Credenciales incorrectas." });

  auditLogs.push({
    timestamp: new Date().toISOString(),
    auditor: "Gus & Nor #2",
    status: "LOGIN",
    detail: `Inicio de sesión: ${user.email} [${user.role}]`
  });

  res.json({ message: "Sesión iniciada correctamente.", user });
});

// Rutas de Configuración y Lemon Cash
app.get('/api/config', (req, res) => {
  res.json({
    appName: systemConfig.appName,
    lemonCashCCI: systemConfig.lemonCashCCI,
    logo: systemConfig.logo
  });
});

app.post('/api/config/cci', verifyAdmin, (req, res) => {
  const { cci } = req.body;
  if (!cci || cci.length < 20 || !/^\d+$/.test(cci)) {
    return res.status(400).json({ error: "El CCI debe contener entre 20 y 21 dígitos numéricos." });
  }
  systemConfig.lemonCashCCI = cci;
  auditLogs.push({
    timestamp: new Date().toISOString(),
    auditor: "Gus & Nor #2",
    status: "CCI ACTUALIZADO",
    detail: `CCI guardado: ${cci}`
  });
  res.json({ message: "CCI de Lemon Cash actualizado exitosamente.", cci: systemConfig.lemonCashCCI });
});

// Rutas Módulo Intermediación
app.get('/api/deals', (req, res) => {
  res.json({ deals });
});

app.post('/api/deals/create', (req, res) => {
  const { seller, amount, description, buyer } = req.body;
  if (!seller || !amount || !description) {
    return res.status(400).json({ error: "Completa los datos del trato." });
  }

  const newDeal = {
    id: `DEAL-${Math.floor(100 + Math.random() * 900)}`,
    buyer: buyer || "Cliente",
    seller,
    amount,
    description,
    status: "EN_CUSTODIA",
    date: new Date().toISOString()
  };

  deals.push(newDeal);

  auditLogs.push({
    timestamp: new Date().toISOString(),
    auditor: "Gus & Nor #2",
    status: "TRATO EN CUSTODIA",
    detail: `Trato ${newDeal.id} por $${amount} entre ${newDeal.buyer} y ${seller}`
  });

  res.json({ message: "Trato registrado. Fondos retenidos en custodia.", deal: newDeal });
});

app.post('/api/deals/release', verifyAdmin, (req, res) => {
  const { dealId } = req.body;
  const deal = deals.find(d => d.id === dealId);
  if (!deal) return res.status(404).json({ error: "Trato no encontrado." });

  deal.status = "LIBERADO";

  auditLogs.push({
    timestamp: new Date().toISOString(),
    auditor: "Gus & Nor #2",
    status: "FONDOS LIBERADOS",
    detail: `Fondos del trato ${dealId} liberados a favor de ${deal.seller}`
  });

  res.json({ message: `Fondos del trato ${dealId} liberados con éxito.` });
});

// Rutas Auditoría y Mensajería
app.get('/api/audit', verifyAdmin, (req, res) => {
  res.json({ logs: auditLogs });
});

app.post('/api/messages', (req, res) => {
  const { sender, text } = req.body;
  if (!text) return res.status(400).json({ error: "El mensaje no puede estar vacío." });

  const newMsg = { timestamp: new Date().toISOString(), sender: sender || "Anónimo", text };
  messages.push(newMsg);

  auditLogs.push({
    timestamp: new Date().toISOString(),
    auditor: "Gus & Nor #2",
    status: "MENSAJE",
    detail: `Mensaje de ${sender}: ${text}`
  });

  res.json({ message: "Mensaje enviado al Creador." });
});

app.get('/api/messages', verifyAdmin, (req, res) => {
  res.json({ messages });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[Gus Gus] Servidor completo ejecutándose en puerto ${PORT}`);
});
