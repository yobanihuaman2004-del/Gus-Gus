const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Servir archivos estáticos directamente desde la raíz principal
app.use(express.static(__dirname));

// Configuración global de la app Gus Gus
const gusGusConfig = {
  appName: "Gus Gus",
  adminEmail: process.env.ADMIN_EMAIL || "creador@gusgus.com",
  lemonCashCCI: process.env.LEMON_CASH_CCI || "922003000000222016298",
  logo: "GG - Estilo Disney Mouse",
  theme: "Victoriano-Industrial"
};

// Historial de auditoría para el módulo Gus & Nor #2
const auditLogs = [
  {
    timestamp: new Date().toISOString(),
    auditor: "Gus & Nor #2",
    status: "SISTEMA OK",
    detail: "Servidor Gus Gus en línea con pasarela Lemon Cash activa."
  }
];

// Middleware para validar el rol de Administrador Maestro / Creador
const verifyCreatorAdmin = (req, res, next) => {
  const userRole = req.headers['x-user-role'];
  if (userRole === 'ADMIN_MAESTRO') {
    next();
  } else {
    res.status(403).json({
      error: "Acceso restringido. Requiere permisos del Administrador Maestro (Creador)."
    });
  }
};

// Rutas de API
app.get('/api/config', (req, res) => {
  res.json({
    appName: gusGusConfig.appName,
    lemonCashCCI: gusGusConfig.lemonCashCCI,
    logo: gusGusConfig.logo
  });
});

app.post('/api/config/cci', verifyCreatorAdmin, (req, res) => {
  const { cci } = req.body;
  if (!cci || cci.length !== 21 || !/^\d+$/.test(cci)) {
    return res.status(400).json({
      error: "El CCI de Lemon Cash debe contener los 21 dígitos numéricos."
    });
  }
  gusGusConfig.lemonCashCCI = cci;

  auditLogs.push({
    timestamp: new Date().toISOString(),
    auditor: "Gus & Nor #2",
    status: "ACTUALIZADO",
    detail: `CCI verificado y guardado: ${cci}`
  });

  res.json({
    message: "CCI de Lemon Cash actualizado exitosamente.",
    cci: gusGusConfig.lemonCashCCI
  });
});

app.get('/api/audit', verifyCreatorAdmin, (req, res) => {
  res.json({ logs: auditLogs });
});

// Ruta principal apuntando al index.html en la raíz
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[Gus Gus] Servidor ejecutándose en el puerto ${PORT}`);
});
