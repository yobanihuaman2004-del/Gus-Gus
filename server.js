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
  { id: 2, email: "user@gusgus.com", pass: "user123", role: "USUARIO_ESTANDAR", name: "Usuario Comprador/Vendedor" }
];

const systemConfig = {
  appName: "Gus Gus",
  lemonCashCCI: process.env.LEMON_CASH_CCI || "922003000000222016298",
  logo: "GG - Estilo Disney Mouse",
  theme: "Victoriano-Industrial Elite"
};

// Módulo de Intermediación (Custodia / Escrow)
const deals = [
  {
    id: "DEAL-101",
    buyer: "cliente1@gusgus.com",
    seller: "vendedor1@gusgus.com",
    amount: "150.00",
    description: "Compra de cuenta digital asegurada",
    status: "EN_CUSTODIA", // EN_CUSTODIA, LIBERADO, CANCELADO
    date: new Date().toISOString()
  }
];

// Auditoría Gus & Nor #2
const auditLogs = [
  { timestamp: new Date().toISOString(), auditor: "Gus & Nor #2", status: "SISTEMA OK", detail: "Módulo de Intermediación y Auditoría activo." }
];

const messages = [];

// Middleware Admin Maestro
const verifyAdmin = (req, res, next) => {
  const role = req.headers['x-user-role'];
  if (role === 'ADMIN_MAESTRO') {
    next();
  } else {
    res.status(403).json({ error: "Acceso denegado. Permiso exclusivo del Creador Maestro." });
  }
};

// Autenticación
app.post('/api/auth/register', (req, res) => {
  const { name, email, pass } = req.body;
  if (!email || !pass) return res.status(400).json({ error: "Faltan datos obligatorios." });
  if (users.find(u => u.email === email)) return res.status(400).json({ error: "El correo ya existe." });

  const newUser = { id: users.length + 1, name: name || "Usuario", email, pass, role: "USUARIO_ESTANDAR" };
  users.push(newUser);
  res.json({ message: "Usuario registrado correctamente.", user: newUser });
});

app.post('/api/auth/login', (req, res) => {
  const { email, pass } = req.body;
  const user = users.find(u => u.email === email && u.pass === pass);
  if (!user) return res.status(401).json({ error: "Credenciales incorrectas." });

  auditLogs.push({
    timestamp: new Date().toISOString(),
    auditor: "Gus & Nor #2",
    status: "LOGIN",
    detail: `Inicio de sesión: ${user.email}`
  });

  res.json({ message: "Sesión iniciada.", user });
});

// Configuración y Lemon Cash
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
    return res.status(400).json({ error: "CCI inválido. Debe tener entre 20 y 21 dígitos." });
  }
  systemConfig.lemonCashCCI = cci;
  auditLogs.push({
    timestamp: new Date().toISOString(),
    auditor: "Gus & Nor #2",
    status: "CCI ACTUALIZADO",
    detail: `CCI guardado: ${cci}`
  });
  res.json({ message: "CCI de Lemon Cash actualizado correctamente.", cci: systemConfig.lemonCashCCI });
});

// Intermediación / Tratos
app.get('/api/deals', (req, res) => {
  res.json({ deals });
});

app.post('/api/deals/create', (req, res) => {
  const { seller, amount, description, buyer } = req.body;
  if (!seller || !amount || !description) {
    return res.status(400).json({ error: "Todos los campos del trato son obligatorios." });
  }

  const newDeal = {
    id: `DEAL-${Math.floor(100 + Math.random() * 900)}`,
    buyer: buyer || "Usuario Estándar",
    seller,
    amount,
    description,
    status: "EN_CUSTODIA",
    date: new Date().toISOString()
  };

  deals.push(newDeal);

  auditLogs.push({
    timestamp: new Date().toISOString(),
    auditor: "Gus &
      
