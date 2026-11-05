const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Estado centralizado de la aplicación Gus Gus
const gusGusConfig = {
  appName: "Gus Gus",
  creatorEmail: process.env.ADMIN_EMAIL || "creador@gusgus.com",
  lemonCashCCI: process.env.LEMON_CASH_CCI || "92200300000022201629",
  logo: "GG - Estilo Ratón Disney",
  modules: [
    "Gestión de Usuarios y Rol Creador/Admin Maestro",
    "Módulo Financiero Lemon Cash (CCI 20 dígitos)",
    "Custodia y Supervisión (Gus & Nor #2)",
    "Centro de Ayuda y Mensajería Directa"
  ]
};

// Historial de auditoría para el módulo Gus & Nor #2
const auditLogs = [
  {
    timestamp: new Date().toISOString(),
    auditor: "Gus & Nor #2",
    status: "INICIALIZADO",
    detail: "Sistema Gus Gus iniciado. Módulos y conexión CCI activos."
  }
];

// Middleware de autenticación y privilegios exclusivos de Creador Maestro
const verifyCreatorAdmin = (req, res, next) => {
  const userRole = req.headers['x-user-role'];
  if (userRole === 'ADMIN_MAESTRO') {
    next();
  } else {
    res.status(403).json({
      error: "Acceso denegado. Este panel y acción requieren permisos de Creador/Administrador Maestro."
    });
  }
};

// Rutas de la API
app.get('/api/config', (req, res) => {
  res.json({
    appName: gusGusConfig.appName,
    lemonCashCCI: gusGusConfig.lemonCashCCI,
    logo: gusGusConfig.logo,
    modules: gusGusConfig.modules
  });
});

app.post('/api/config/cci', verifyCreatorAdmin, (req, res) => {
  const { cci } = req.body;
  if (!cci || cci.length !== 20 || !/^\d+$/.test(cci)) {
    return res.status(400).json({
      error: "El CCI de Lemon Cash debe contener exactamente 20 dígitos numéricos."
    });
  }
  gusGusConfig.lemonCashCCI = cci;
  
  auditLogs.push({
    timestamp: new Date().toISOString(),
    auditor: "Gus & Nor #2",
    status: "ACTUALIZACIÓN FINANCIERA",
    detail: `CCI actualizado a: ${cci}`
  });

  res.json({
    message: "CCI registrado exitosamente en Lemon Cash.",
    cci: gusGusConfig.lemonCashCCI
  });
});

app.get('/api/audit', verifyCreatorAdmin, (req, res) => {
  res.json({ logs: auditLogs });
});

app.post('/api/support/message', (req, res) => {
  const { user, message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "El mensaje no puede estar vacío." });
  }

  auditLogs.push({
    timestamp: new Date().toISOString(),
    auditor: "Gus & Nor #2",
    status: "MENSAJERÍA",
    detail: `Mensaje recibido de ${user || 'Usuario'}: "${message}"`
  });

  res.json({ message: "Mensaje enviado al Administrador Maestro con éxito." });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[Gus Gus App] Servidor escuchando en puerto ${PORT}`);
});
