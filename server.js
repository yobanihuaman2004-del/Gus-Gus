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

const whitelist = ['https://gusgus.pe', 'http://localhost:3000'];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  }
}));

// --- CONEXIÓN A BASE DE DATOS POSTGRESQL ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// --- MIDDLEWARE DE AUTENTICACIÓN JWT ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Acceso denegado, token requerido' });

  jwt.verify(token, process.env.JWT_SECRET || 'secret_key', (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido o expirado' });
    req.user = user;
    next();
  });
};

// --- RUTA BASE DE PRUEBA ---
app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor Gus Gus funcionando correctamente.' });
});

// --- AUTENTICACIÓN ---
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, hashedPassword]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error en registro:", err);
    res.status(500).json({ error: 'Error en el servidor', detalle: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'secret_key');
    res.json({ token, user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error("Error en login:", err);
    res.status(500).json({ error: 'Error en el servidor', detalle: err.message });
  }
});

// --- INICIO DEL SERVIDOR ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});
