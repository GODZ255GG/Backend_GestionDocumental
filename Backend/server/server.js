require('dotenv').config();
const app = require('./app');
const { connectToDatabase } = require('./config/database');

const PORT = process.env.PORT || 3000;

// Connect to database and then start server
connectToDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch(error => {
    console.error('Database connection error:', error);
    process.exit(1);
  });