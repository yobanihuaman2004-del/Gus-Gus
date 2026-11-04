require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const app = express();

// --- CONFIGURACIÓN DE SEGURIDAD Y MIDDLEWARES ---
app.use(helmet());
app.use(xss());
app.use(express.json());
app.use(cors());

// Limitador de peticiones
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

// Base de Datos PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// --- MIDDLEWARE DE AUTENTICACIÓN JWT ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });

  jwt.verify(token, process.env.JWT_SECRET || 'secret_key', (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido o expirado.' });
    req.user = user;
    next();
  });
};

// --- SERVIR ARCHIVOS ESTÁTICOS ---
app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

// --- RUTA DE LOGIN ---
app.post('/api/login', async (req, res) => {
  const { email, dni, password } = req.body;
  if (!email || !dni || !password) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
  }
  res.json({ message: 'Inicio de sesión exitoso', user: { email, dni } });
});

// --- PUERTO Y ARRANQUE DEL SERVIDOR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor de Gus Gus corriendo en el puerto ${PORT}`);
});
