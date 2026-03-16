import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import dinerRoutes from './src/routes/diner.routes.js';
import kitchenRoutes from './src/routes/kitchen.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Твои роуты (Diner Flow)
app.use('/api/diner', dinerRoutes);
app.use('/api/kitchen', kitchenRoutes);

// Проверка, что сервер жив
app.get('/', (req, res) => {
  res.send('API is running... 🚀');
});

app.listen(PORT, () => {
  console.log(`
  ✅ Server is flying!
  🔗 Local: http://localhost:${PORT}
  📂 Menu:  http://localhost:${PORT}/api/diner/menu
  `);
});