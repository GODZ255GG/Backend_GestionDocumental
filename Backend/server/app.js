const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes');
const procedimientoRoutes = require('./routes/procedimientoRoutes');
const direccionRoutes = require('./routes/direccionRoutes');

const app = express();

// Middlewares
// Configuración CORS para desarrollo
const corsOptions = {
    origin: 'http://localhost:3000', // Ajusta según tu entorno de desarrollo
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204
};

app.use(cors());
app.use(bodyParser.json());

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/procedimientos', procedimientoRoutes);
app.use('/api/direcciones', direccionRoutes);
// Ruta de prueba
app.get('/', (req, res) => {
  res.send('API de Gestión Documental');
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Error interno del servidor' });
});

module.exports = app;