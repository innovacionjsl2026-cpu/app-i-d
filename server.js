const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(express.json());
app.use(cors());

// --- BASE DE DATOS EN MEMORIA Y CATÁLOGOS ERPS ---
const db = {
  usuarios: [
    { id: 1, nombre: 'Gerente Calidad e Innovación', email: 'innovacion.jsl2026@gmail.com', rol: 'Gerente' },
    { id: 2, nombre: 'Técnico de Planta', email: 'tecnico@empresa.com', rol: 'Tecnico' }
  ],
  catalogo_productos: [
    { id: 1, codigo_sistema: 'PROD-1024', nombre: 'Pan de Sándwich Blanco 500g', linea: 'Panadería' },
    { id: 2, codigo_sistema: 'PROD-2048', nombre: 'Tortillas de Trigo Integrales 12pk', linea: 'Tortillas' }
  ],
  catalogo_ingredientes: [
    { id: 1, codigo_sistema: 'ING-001', nombre: 'Harina de Trigo Panificable', costo_unitario: 0.85, unidad: 'kg' },
    { id: 2, codigo_sistema: 'ING-002', nombre: 'Levadura Fresca', costo_unitario: 2.10, unidad: 'kg' }
  ],
  tareas_gantt: [
    { id: 1, tarea: 'Desarrollo de Prototipos Piloto', estado: 'PENDIENTE_REVISION', tecnico: 'Técnico de Planta' },
    { id: 2, tarea: 'Panel Sensorial Afectivo', estado: 'BLOQUEADA', tecnico: 'Panelista' }
  ]
};

// --- CONFIGURACIÓN DE CORREO (GMAIL API / SMTP) ---
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'innovacion.jsl2026@gmail.com',
    pass: 'innovacion2026'
  }
});

// --- ENDPOINTS DE LA APLICACIÓN ---

// 1. Obtener lista desplegable de productos existentes (Módulo VI)
app.get('/api/reingenieria/productos', (req, res) => {
  const lista = db.catalogo_productos.map(p => ({
    id: p.id,
    label: `[${p.codigo_sistema}] ${p.nombre}`
  }));
  res.json(lista);
});

// 2. Obtener catálogo maestro de ingredientes (Módulo IV)
app.get('/api/ingredientes', (req, res) => {
  res.json(db.catalogo_ingredientes);
});

// 3. Botón "Notificar y Solicitar Revisión" (Técnico -> Gerente)
app.post('/api/tareas/:id/notificar', (req, res) => {
  const tareaId = req.params.id;
  const tarea = db.tareas_gantt.find(t => t.id == tareaId);
  if (tarea) {
    tarea.estado = 'PENDIENTE_REVISION';
    
    const mailOptions = {
      from: 'innovacion.jsl2026@gmail.com',
      to: 'innovacion.jsl2026@gmail.com',
      subject: `[SOLICITUD DE REVISIÓN] Tarea: ${tarea.tarea}`,
      text: `El técnico ha completado la tarea "${tarea.tarea}". Ingrese al panel web para la Aprobación 1-Click.`
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) console.log('Aviso Email:', err.message);
    });

    res.json({ status: 'OK', mensaje: 'Notificación enviada al Gerente exitosamente.' });
  } else {
    res.status(404).json({ error: 'Tarea no encontrada' });
  }
});

// 4. Botón "Aprobación 1-Click" (Gerente -> Desbloqueo)
app.post('/api/tareas/:id/aprobar-1click', (req, res) => {
  const tareaId = parseInt(req.params.id);
  const tareaActual = db.tareas_gantt.find(t => t.id === tareaId);
  
  if (tareaActual) {
    tareaActual.estado = 'APROBADA';
    
    const tareaSiguiente = db.tareas_gantt.find(t => t.id === tareaId + 1);
    if (tareaSiguiente) {
      tareaSiguiente.estado = 'EN_PROCESO';
    }

    res.json({
      status: 'ÉXITO',
      mensaje: `Tarea ${tareaId} aprobada en 1-Click. Siguiente tarea desbloqueada.`,
      tareaActual,
      tareaSiguiente
    });
  } else {
    res.status(404).json({ error: 'Tarea no encontrada' });
  }
});

// Inicialización del Servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor de Innovación JSL ejecutándose en el puerto ${PORT}`);
});
