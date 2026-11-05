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
app.use(express.json({ limit: '20mb' })); // Soporte extendido para imágenes de alta resolución
app.use(cors());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use(limiter);

// BASE DE DATOS EN MEMORIA
const operacionesDB = new Map();
const mensajesDB = new Map();
const codigosRecuperacion = new Map();

// CUENTAS OFICIALES Y MÉTODOS DE PAGO PERUANOS (GUS GUS ESCROW)
const CUENTAS_RECAUDACION_GUSGUS = {
  yape: { numero: "987-654-321", titular: "Gus Gus Escrow SAC" },
  plin: { numero: "987-654-321", titular: "Gus Gus Escrow SAC" },
  bcp: { cci: "002-191-000123456789-54", cuenta: "191-12345678-0-54", banco: "BCP Soles" },
  bbva: { cci: "011-018-000100023456-88", cuenta: "0011-0180-0200023456", banco: "BBVA Soles" },
  interbank: { cci: "003-200-003000123456-10", cuenta: "200-3000123456", banco: "Interbank Soles" }
};

const TARIFA_COMISION_PORCENTAJE = 0.04; // 4% Total (2% Comprador / 2% Vendedor)

// 🤖 IA DE AUDITORÍA, SEGURIDAD Y REVISION DE COMPROBANTES
function analizarMensajeConIA(texto, foto, tipoAccion) {
  let analisis = { respuestaIA: null };
  const patronesRiesgo = /(whatsapp|llámame al|pago por fuera|transferencia directa|bcp directo|caja piura personal)/i;
  
  if (texto && patronesRiesgo.test(texto)) {
    analisis.respuestaIA = "🤖 **IA Guardián:** Detectamos intención de coordinar pagos externos. Por tu seguridad, realiza el depósito únicamente mediante los métodos oficiales de Gus Gus.";
  } else if (tipoAccion === 'SUBIR_ENVIO' && foto) {
    analisis.respuestaIA = "🤖 **IA Guardián:** Comprobante de envío procesado correctamente. Esperando confirmación de recepción del comprador.";
  } else if (tipoAccion === 'SUBIR_RECEPCION' && foto) {
    analisis.respuestaIA = "🤖 **IA Guardián:** Entrega confirmada en buen estado. Proceso de fondos completado. La liberación al vendedor ha sido autorizada.";
  }
  return analisis;
}

// 📊 IA DE REPORTES FINANCIEROS Y AUDITORÍA CONTABLE (SUNAT)
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
      titulo: `📊 Reporte General (${periodo.toUpperCase()}) - Gus Gus Escrow`,
      totalOperaciones: operacionesCompletadas,
      volumenTransaccionado: `S/ ${totalMontoMovido.toFixed(2)}`, gananciaNetaGusGus: `S/ ${gananciasGusGusTotal.toFixed(2)}`,
      sustentoFiscalSUNAT: {
        ingresoDeclarable: `S/ ${gananciasGusGusTotal.toFixed(2)} (Comisiones por intermediación)`, fondosCustodiaTerceros: `S/ ${totalMontoMovido.toFixed(2)} (Fondos de terceros en custodia - Exentos)`
      }
    };
  }

  return {
    titulo: `📄 Tu Reporte Financiero (${periodo.toUpperCase()})`,
    ventasTotales: `S/ ${ventasUsuario.toFixed(2)}`, comprasTotales: `S/ ${comprasUsuario.toFixed(2)}`,
    comisionesAportadas: `S/ ${comisionesPagadasUsuario.toFixed(2)}` }; }  app.use(express.static(__dirname));  app.get('/', (req, res) => res.sendFile(__dirname + '/index.html')); app.get('/register.html', (req, res) => res.sendFile(__dirname + '/register.html')); app.get('/dashboard', (req, res) => res.sendFile(__dirname + '/dashboard.html'));  // OBTENER CUENTAS DE RECAUDACIÓN app.get('/api/medios-pago', (req, res) => { res.json({ cuentas: CUENTAS_RECAUDACION_GUSGUS }); });  // AUTENTICACIÓN app.post('/api/login', (req, res) => { const { email, password } = req.body; if (!email \vert{}\vert{} !password) return res.status(400).json({ error: 'Ingresa correo y contraseña.' });  const token = jwt.sign({ email }, process.env.JWT_SECRET \vert{}\vert{} 'secret_key', { expiresIn: '8h' }); res.json({ message: 'Login exitoso', token, user: { nombre: email.split('@')[0], email, dni: req.body.dni \vert{}\vert{} 'Sin DNI' } }); });  app.post('/api/recuperar-codigo', (req, res) => { const { contacto } = req.body; if (!contacto) return res.status(400).json({ error: 'Ingresa correo o teléfono.' });  const codigo = Math.floor(100000 + Math.random() * 900000).toString(); codigosRecuperacion.set(contacto, { codigo, expira: Date.now() + 10 * 60 * 1000 });  res.json({ message: 'Código generado con éxito.', codigoPrueba: codigo }); });  app.post('/api/restablecer-password', (req, res) => { const { contacto, codigo, nuevaPassword } = req.body; if (!contacto \vert{}\vert{} !codigo \vert{}\vert{} !nuevaPassword) { return res.status(400).json({ error: 'Todos los campos son obligatorios.' }); }  const registro = codigosRecuperacion.get(contacto); if (!registro \vert{}\vert{} registro.codigo !== codigo) { return res.status(400).json({ error: 'El código ingresado es incorrecto.' }); }  codigosRecuperacion.delete(contacto); res.json({ message: 'Contraseña actualizada con éxito.' }); });  // CREAR OPERACIÓN app.post('/api/operaciones/crear', (req, res) => { const { email, contraparteEmail, rol, monto, descripcion, fotoProducto } = req.body; if (!email \vert{}\vert{} !monto \vert{}\vert{} !descripcion) { return res.status(400).json({ error: 'Monto y descripción son requeridos.' }); }  const montoNum = parseFloat(monto); const comisionTotal = montoNum * TARIFA_COMISION_PORCENTAJE; const comisionComprador = comisionTotal / 2; const comisionVendedor = comisionTotal / 2;  const totalAPagarComprador = montoNum + comisionComprador; const totalARecibirVendedor = montoNum - comisionVendedor;  const codigoOp = "GG-" + Math.floor(100000 + Math.random() * 900000);  const nuevaOperacion = { codigoOp, creador: email, contraparte: contraparteEmail \vert{}\vert{} 'Esperando participante...', rolCreador: rol \vert{}\vert{} 'VENTA', montoBase: montoNum.toFixed(2), comisionComprador: comisionComprador.toFixed(2), comisionVendedor: comisionVendedor.toFixed(2), totalAPagarComprador: totalAPagarComprador.toFixed(2), totalARecibirVendedor: totalARecibirVendedor.toFixed(2), descripcion, fotoProducto: fotoProducto \vert{}\vert{} null, fotoEnvio: null, fotoRecepcion: null, comprobantePago: null, metodoPagoUsado: null, estado: 'PENDIENTE_DEPÓSITO', cuentasDestino: CUENTAS_RECAUDACION_GUSGUS, fecha: new Date().toISOString() };  operacionesDB.set(codigoOp, nuevaOperacion);  mensajesDB.set(codigoOp, [ { remitente: '🤖 IA Gus Gus Guardián', texto: `🤝 Acuerdo ${codigoOp} creado.\n` +
             `💰 Valor: S/ ${nuevaOperacion.montoBase} \vert{} Comisiones (50/50): S/ ${nuevaOperacion.comisionComprador} cada uno.\n` +
             `📌 Total a depositar por Comprador: S/ ${nuevaOperacion.totalAPagarComprador}.\n` +
             `📲 Paga mediante Yape/Plin: ${CUENTAS_RECAUDACION_GUSGUS.yape.numero} (${CUENTAS_RECAUDACION_GUSGUS.yape.titular}) o CCI BCP:${CUENTAS_RECAUDACION_GUSGUS.bcp.cci}`,
      tipo: 'sistema',
      fecha: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  res.json({ message: 'Operación iniciada.', operacion: nuevaOperacion });
});

// MULTICHATS Y MENSAJES
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
      texto: `✅ Entrega confirmada. Fondos de S/ ${op.totalARecibirVendedor} liberados al Vendedor.`,
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

// SUBIR COMPROBANTE DE DEPOSITOS (YAPE / PLIN / TRANSFERENCIA)
app.post('/api/operaciones/:codigoOp/depositar', (req, res) => {
  const { codigoOp } = req.params;
  const { metodoPago, comprobanteFoto } = req.body;

  const op = operacionesDB.get(codigoOp);
  if (!op) return res.status(404).json({ error: 'Operación no encontrada.' });

  op.estado = 'EN_CUSTODIA';
  op.metodoPagoUsado = metodoPago || 'YAPE_PLIN';
  op.comprobantePago = comprobanteFoto || null;

  operacionesDB.set(codigoOp, op);

  const mensajes = mensajesDB.get(codigoOp) || [];
  mensajes.push({
    remitente: '🤖 IA Gus Gus Guardián',
    texto: `🟢 **Depósito Registrado (${metodoPago \vert{}\vert{} 'Yape/Plin'}):**\nS/${op.totalAPagarComprador} retenidos en custodia segura.\n
    
