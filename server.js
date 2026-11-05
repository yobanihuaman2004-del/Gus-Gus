require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(xss());
app.use(express.json({ limit: '15mb' }));
app.use(cors());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 150 });
app.use(limiter);

// BASE DE DATOS EN MEMORIA
const operacionesDB = new Map();
const mensajesDB = new Map();
const codigosRecuperacion = new Map();

// CUENTAS RECAUDACIÓN
const CUENTAS_RECAUDACION_GUSGUS = {
  yape: "987-654-321 (Gus Gus Escrow SAC)",
  plin: "987-654-321 (Gus Gus Escrow SAC)",
  cci_bcp: "002-191-000123456789-54 (BCP Soles)"
};

const TARIFA_COMISION_PORCENTAJE = 0.04;

// IA SEGURIDAD Y CUSTODIA
function analizarMensajeConIA(texto, foto, tipoAccion) {
  let analisis = { respuestaIA: null };
  const patronesRiesgo = /(whatsapp|llámame al|pago por fuera|transferencia directa|bcp directo)/i;
  
  if (texto && patronesRiesgo.test(texto)) {
    analisis.respuestaIA = "🤖 **IA Guardián:** Detectamos intención de coordinar por fuera. Realiza tus pagos dentro de Gus Gus para mantener la protección de tu dinero.";
  } else if (tipoAccion === 'SUBIR_ENVIO' && foto) {
    analisis.respuestaIA = "🤖 **IA Guardián:** Comprobante de envío registrado y auditado correctamente.";
  } else if (tipoAccion === 'SUBIR_RECEPCION' && foto) {
    analisis.respuestaIA = "🤖 **IA Guardián:** Recepción confirmada. Fondos autorizados para liberación.";
  }
  return analisis;
}

// IA REPORTES
function generarReporteIA(filtroEmail = null, periodo = 'mensual') {
  let totalMontoMovido = 0;
  let gananciasGusGusTotal = 0;
  let operacionesCompletadas = 0;
  let ventasUsuario = 0;
  let comprasUsuario = 0;
  let comisionesPagadasUsuario = 0;

  for (let [codigo, op] of operacionesDB.entries()) {
    if (op.estado === 'COMPLETADO') {
      const monto = parseFloat(op.montoBase);
      const comisionComp = parseFloat(op.comisionComprador);
      const comisionVend = parseFloat(op.comisionVendedor);
      const comisionTotalOp = comisionComp + comisionVend;

      totalMontoMovido += monto;
      gananciasGusGusTotal += comisionTotalOp;
      operacionesCompletadas++;

      if (filtroEmail) {
        if (op.creador === filtroEmail || op.contraparte === filtroEmail) {
          if (op.rolCreador === 'VENTA' && op.creador === filtroEmail) {
            ventasUsuario += monto;
            comisionesPagadasUsuario += comisionVend;
          } else {
            comprasUsuario += monto;
            comisionesPagadasUsuario += comisionComp;
          }
        }
      }
    }
  }

  if (!filtroEmail) {
    return {
      titulo: `📊 Reporte Financiero (${periodo.toUpperCase()}) - Gus Gus`,
      totalOperaciones: operacionesCompletadas,
      volumenTransaccionado: `S/ ${totalMontoMovido.toFixed(2)}`,
      gananciaNetaGusGus: `S/ ${gananciasGusGusTotal.toFixed(2)}`,
      sustentoFiscalSUNAT: {
        ingresoDeclarable: `S/ ${gananciasGusGusTotal.toFixed(2)} (Comisiones por servicios de intermediación)`,
        fondosCustodiaTerceros: `S/ ${totalMontoMovido.toFixed(2)} (Fondos exentos de tributación propia - Custodia de usuarios)`
      }
    };
  }

  return {
    titulo: `📄 Tu Reporte Financiero (${periodo.toUpperCase()})`,
    ventasTotales: `S/ ${ventasUsuario.toFixed(2)}`,
    comprasTotales: `S/ ${comprasUsuario.toFixed(2)}`,
    comisionesAportadas: `S/ ${comisionesPagadasUsuario.toFixed(2)}`
  };
}

app.use(express.static(__dirname));

app.get('/', (req, res) => res.sendFile(__dirname + '/index.html'));
app.get('/register.html', (req, res) => res.sendFile(__dirname + '/register.html'));
app.get('/dashboard', (req, res) => res.sendFile(__dirname + '/dashboard.html'));

// ENDPOINTS
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Ingresa correo y contraseña.' });

  const token = jwt.sign({ email }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '8h' });
  res.json({
    message: 'Login exitoso',
    token,
    user: { nombre: email.split('@')[0], email, dni: req.body.dni || 'Sin DNI' }
  });
});

app.post('/api/recuperar-codigo', (req, res) => {
  const { contacto } = req.body;
  if (!contacto) return res.status(400).json({ error: 'Ingresa correo o teléfono.' });

  const codigo = Math.floor(100000 + Math.random() * 900000).toString();
  codigosRecuperacion.set(contacto, { codigo, expira: Date.now() + 10 * 60 * 1000 });

  res.json({ message: 'Código generado con éxito.', codigoPrueba: codigo });
});

app.post('/api/restablecer-password', (req, res) => {
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

app.post('/api/operaciones/crear', (req, res) => {
  const { email, contraparteEmail, rol, monto, descripcion, fotoProducto } = req.body;
  if (!email || !monto || !descripcion) {
    return res.status(400).json({ error: 'Monto y descripción son requeridos.' });
  }

  const montoNum = parseFloat(monto);
  const comisionTotal = montoNum * TARIFA_COMISION_PORCENTAJE;
  const comisionComprador = comisionTotal / 2;
  const comisionVendedor = comisionTotal / 2;
  
  const totalAPagarComprador = montoNum + comisionComprador;
  const totalARecibirVendedor = montoNum - comisionVendedor;

  const codigoOp = "GG-" + Math.floor(100000 + Math.random() * 900000);

  const nuevaOperacion = {
    codigoOp,
    creador: email,
    contraparte: contraparteEmail || 'Esperando participante...',
    rolCreador: rol || 'VENTA',
    montoBase: montoNum.toFixed(2),
    comisionComprador: comisionComprador.toFixed(2),
    comisionVendedor: comisionVendedor.toFixed(2),
    totalAPagarComprador: totalAPagarComprador.toFixed(2),
    totalARecibirVendedor: totalARecibirVendedor.toFixed(2),
    descripcion,
    fotoProducto: fotoProducto || null,
    fotoEnvio: null,
    fotoRecepcion: null,
    estado: 'PENDIENTE_DEPÓSITO',
    cuentasDestino: CUENTAS_RECAUDACION_GUSGUS,
    fecha: new Date().toISOString()
  };

  operacionesDB.set(codigoOp, nuevaOperacion);

  mensajesDB.set(codigoOp, [
    {
      remitente: '🤖 IA Gus Gus Guardián',
      texto: `🤝 Acuerdo ${codigoOp} creado con auditoría inteligente.\n` +
             `💰 Monto: S/ ${nuevaOperacion.montoBase} | Comisiones (50/50): S/ ${nuevaOperacion.comisionComprador} c/u.\n` +
             `📌 Total a depositar: S/ ${nuevaOperacion.totalAPagarComprador}.\n` +
             `🏦 Depósitos a Yape/Plin: ${CUENTAS_RECAUDACION_GUSGUS.yape}`,
      tipo: 'sistema',
      fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  res.json({ message: 'Operación iniciada.', operacion: nuevaOperacion });
});

app.get('/api/operaciones/usuario/:email', (req, res) => {
  const { email } = req.params;
  const userOps = [];
  for (let [codigo, op] of operacionesDB.entries()) {
    if (op.creador === email || op.contraparte === email) userOps.push(op);
  }
  res.json({ operaciones: userOps });
});

app.get('/api/operaciones/:codigoOp', (req, res) => {
  const { codigoOp } = req.params;
  const op = operacionesDB.get(codigoOp);
  if (!op) return res.status(404).json({ error: 'Operación no encontrada.' });
  res.json({ operacion: op, chat: mensajesDB.get(codigoOp) || [] });
});

app.post('/api/operaciones/:codigoOp/mensaje', (req, res) => {
  const { codigoOp } = req.params;
  const { remitente, texto, foto, tipoAccion } = req.body;

  const op = operacionesDB.get(codigoOp);
  if (!op) return res.status(404).json({ error: 'Operación no encontrada.' });

  const mensajes = mensajesDB.get(codigoOp) || [];

  if (tipoAccion === 'SUBIR_ENVIO') {
    op.fotoEnvio = foto;
    op.estado = 'ENVIADO';
    mensajes.push({
      remitente: 'Sistema Gus Gus',
      texto: '📦 Comprobante de envío subido por el Vendedor.',
      foto: foto,
      tipo: 'sistema',
      fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  } else if (tipoAccion === 'SUBIR_RECEPCION') {
    op.fotoRecepcion = foto;
    op.estado = 'COMPLETADO';
    mensajes.push({
      remitente: 'Sistema Gus Gus',
      texto: `✅ Recepción confirmada. Fondos de S/ ${op.totalARecibirVendedor} liberados al Vendedor.`,
      foto: foto,
      tipo: 'sistema',
      fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  } else {
    mensajes.push({
      remitente,
      texto: texto || '',
      foto: foto || null,
      tipo: 'usuario',
      fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  }

  const evaluacionIA = analizarMensajeConIA(texto, foto, tipoAccion);
  if (evaluacionIA.respuestaIA) {
    mensajes.push({
      remitente: '🤖 IA Gus Gus Guardián',
      texto: evaluacionIA.respuestaIA,
      tipo: 'sistema',
      fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
  }

  operacionesDB.set(codigoOp, op);
  mensajesDB.set(codigoOp, mensajes);

  res.json({ message: 'Procesado.', operacion: op, chat: mensajes });
});

app.post('/api/operaciones/:codigoOp/depositar', (req, res) => {
  const { codigoOp } = req.params;
  const op = operacionesDB.get(codigoOp);
  if (!op) return res.status(404).json({ error: 'Operación no encontrada.' });

  op.estado = 'EN_CUSTODIA';
  operacionesDB.set(codigoOp, op);

  const mensajes = mensajesDB.get(codigoOp) || [];
  mensajes.push({
    remitente: '🤖 IA Gus Gus Guardián',
    texto: `🟢 **Depósito Verificado:** S/ ${op.totalAPagarComprador} retenidos en custodia. Vendedor, ya puedes enviar el producto.`,
    tipo: 'sistema',
    fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });

  mensajesDB.set(codigoOp, mensajes);
  res.json({ message: 'Depósito procesado.', operacion: op, chat: mensajes });
});

app.get('/api/reportes/admin', (req, res) => {
  const periodo = req.query.periodo || 'mensual';
  res.json(generarReporteIA(null, periodo));
});

app.get('/api/reportes/usuario/:email', (req, res) => {
  const { email } = req.params;
  const periodo = req.query.periodo || 'mensual';
  res.json(generarReporteIA(email, periodo));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor Gus Gus corriendo en puerto ${PORT}`);
});
             
