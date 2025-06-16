require('dotenv').config();
const app = require('./app');
const { connectToDatabase } = require('./config/database');

const PORT = process.env.PORT || 3000;

// Conectar a la base de datos y luego iniciar el servidor
connectToDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch(error => {
    console.error('Error al conectar a la base de datos:', error);
    process.exit(1);
  });