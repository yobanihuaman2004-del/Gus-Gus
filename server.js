require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(xss());
app.use(express.json());
app.use(cors());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use(limiter);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const codigosVerificacion = new Map();
const codigosRecuperacion = new Map();

app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/register.html', (req, res) => {
  res.sendFile(__dirname + '/register.html');
});

app.get('/dashboard', (req, res) => {
  res.sendFile(__dirname + '/dashboard.html');
});

// APIs
app.post('/api/enviar-codigo', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'El correo es requerido.' });

  const codigo = Math.floor(100000 + Math.random() * 900000).toString();
  codigosVerificacion.set(email, { codigo, expira: Date.now() + 10 * 60 * 1000 });

  console.log(`[VERIFICACIÓN REGISTRO] Código para ${email}: ${codigo}`);

  res.json({ 
    message: `Código de verificación generado con éxito.`,
    codigoPrueba: codigo 
  });
});

app.post('/api/recuperar-codigo', (req, res) => {
  const { contacto } = req.body;
  if (!contacto) return res.status(400).json({ error: 'Ingresa correo o teléfono.' });

  const codigo = Math.floor(100000 + Math.random() * 900000).toString();
  codigosRecuperacion.set(contacto, { codigo, expira: Date.now() + 10 * 60 * 1000 });

  console.log(`[RECUPERACIÓN] Código para ${contacto}: ${codigo}`);

  res.json({ 
    message: `Código de recuperación generado con éxito.`,
    codigoPrueba: codigo 
  });
});

app.post('/api/restablecer-password', async (req, res) => {
  const { contacto, codigo, nuevaPassword } = req.body;
  if (!contacto || !codigo || !nuevaPassword) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
  }

  const registro = codigosRecuperacion.get(contacto);
  if (!registro || registro.codigo !== codigo) {
    return res.status(400).json({ error: 'El código ingresado es incorrecto.' });
  }

  codigosRecuperacion.delete(contacto);
  res.json({ message: 'Contraseña actualizada con éxito.' });
});

app.post('/api/register', async (req, res) => {
  const { nombre, email, dni, password, codigo } = req.body;
  if (!nombre || !email || !dni || !password || !codigo) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
  }

  const registroCodigo = codigosVerificacion.get(email);
  if (!registroCodigo || registroCodigo.codigo !== codigo) {
    return res.status(400).json({ error: 'El código de verificación es incorrecto.' });
  }

  codigosVerificacion.delete(email);
  res.json({ message: 'Registro exitoso.', user: { nombre, email, dni } });
});

// --- INICIO DE SESIÓN SIMPLIFICADO (SOLO REQUIERE EMAIL Y CONTRASEÑA) ---
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Ingresa tu correo y contraseña.' });
  }

  const token = jwt.sign({ email }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '2h' });
  
  res.json({
    message: 'Login exitoso',
    token,
    user: { 
      nombre: email.split('@')[0], 
      email: email, 
      dni: req.body.dni || 'Sin DNI' 
    }
  });
});

app.post('/api/operaciones/crear', (req, res) => {
  const { email, tipo, monto, descripcion, codigoOp } = req.body;
  res.json({ message: 'Operación registrada con éxito.', codigoOp });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor de Gus Gus corriendo en el puerto ${PORT}`);
});
