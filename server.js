const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Base de datos temporal en memoria
const users = [
  { id: 1, email: "admin@gusgus.com", pass: "admin123", role: "ADMIN_MAESTRO", name: "Creador Maestro" },
  { id: 2, email: "user@gusgus.com", pass: "user123", role: "USUARIO_ESTANDAR", name: "Usuario Cliente" }
];

const systemConfig = {
  appName: "Gus Gus",
  lemonCashCCI: process.env.LEMON_CASH_CCI || "922003000000222016298",
  logo: "GG - Estilo Disney Mouse",
  theme: "Victoriano-Industrial"
};

const auditLogs = [
  { timestamp: new Date().toISOString(), auditor: "Gus & Nor #2", status: "SISTEMA OK", detail: "Sistema Gus Gus iniciado correctamente." }
];

const messages = [];

// Middleware para verificar token/rol de Admin Maestro
const verifyAdmin = (req, res, next) => {
  const role = req.headers['x-user-role'];
  if (role === 'ADMIN_MAESTRO') {
    next();
  } else {
    res.status(403).json({ error: "Acceso denegado. Se requieren privilegios de Creador/Admin Maestro." });
  }
};

// --- RUTAS DE AUTENTICACIÓN ---
app.post('/api/auth/register', (req, res) => {
  const { name, email, pass } = req.body;
  if (!email || !pass) return res.status(400).json({ error: "Faltan datos obligatorios." });
  
  const exists = users.find(u => u.email === email);
  if (exists) return res.status(400).json({ error: "El correo ya está registrado." });

  const newUser = { id: users.length + 1, name: name || "Usuario", email, pass, role: "USUARIO_ESTANDAR" };
  users.push(newUser);
  res.json({ message: "Usuario registrado con éxito.", user: newUser });
});

app.post('/api/auth/login', (req, res) => {
  const { email, pass } = req.body;
  const user = users.find(u => u.email === email && u.pass === pass);
  
  if (!user) {
    return res.status(401).json({ error: "Credenciales incorrectas." });
  }

  auditLogs.push({
    timestamp: new Date().toISOString(),
    auditor: "Gus & Nor #2",
    status: "LOGIN",
    detail: `Inicio de sesión de ${user.email} [${user.role}]`
  });

  res.json({ message: "Inicio de sesión exitoso.", user });
});

// --- RUTAS DE CONFIGURACIÓN Y MÓDULOS ---
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

  res.json({ message: "CCI de Lemon Cash actualizado.", cci: systemConfig.lemonCashCCI });
});

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
    detail: `Mensaje de ${newMsg.sender}: ${text}`
  });

  res.json({ message: "Mensaje enviado con éxito." });
});

app.get('/api/messages', verifyAdmin, (req, res) => {
  res.json({ messages });
});

// Servir la app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[Gus Gus] Servidor activo en el puerto ${PORT}`);
});
