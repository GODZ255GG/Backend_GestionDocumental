const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes');
const procedureRoutes = require('./routes/procedureRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const userRoutes = require('./routes/userRoutes');
const documentRoutes = require('./routes/documentRoutes');
const subprocessRoutes = require('./routes/subprocessRoutes');
const secretariatRoutes = require('./routes/secretariatRoutes');

const app = express();

// Middlewares
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://127.0.0.1:5501',
      'http://127.0.0.1:5500',
      'http://localhost:5500',
      // añade otros dominios permitidos si es necesario
    ];
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/procedures', procedureRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/users', userRoutes);
app.use('/api', documentRoutes);  // Cambiado para /api/documents directo
app.use('/api/subprocesses', subprocessRoutes);
app.use('/api/secretariats', secretariatRoutes);

// Test route
app.get('/', (req, res) => {
  res.send('Document Management API');
});

// 404 handler como JSON
app.use((req, res, next) => {
  res.status(404).json({ message: 'Not Found' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

module.exports = app;