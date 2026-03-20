import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import dinerRoutes from './src/routes/diner.routes.js';
import kitchenRoutes from './src/routes/kitchen.routes.js';
import authRoutes from './src/routes/auth.routes.js';
import restaurantRoutes from './src/routes/restaurants.routes.js';
import menuRoutes from './src/routes/menu.routes.js';
import tableRoutes from './src/routes/tables.routes.js';
import userRoutes from './src/routes/users.routes.js';
import { validateJWT } from './src/middleware/validateJWT.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ============================================
// PUBLIC ROUTES (БЕЗ защиты)
// ============================================
// Authentication routes
app.use('/api/auth', authRoutes);

// Public diner flow (uses session tokens, not JWT)
app.use('/api/diner', dinerRoutes);

// ============================================
// PROTECTED ROUTES (требуют JWT)
// ============================================
// Kitchen queue
app.use('/api/kitchen', validateJWT, kitchenRoutes);

// Admin/Staff management routes
app.use('/api', validateJWT, restaurantRoutes);
app.use('/api', validateJWT, menuRoutes);
app.use('/api', validateJWT, tableRoutes);
app.use('/api', validateJWT, userRoutes);

// ============================================
// HEALTH CHECK
// ============================================
app.get('/', (req, res) => {
  res.send('API is running');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
