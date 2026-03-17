import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import dinerRoutes from './src/routes/diner.routes.js';
import kitchenRoutes from './src/routes/kitchen.routes.js';
import restaurantRoutes from './src/routes/restaurants.routes.js';
import menuRoutes from './src/routes/menu.routes.js';
import tableRoutes from './src/routes/tables.routes.js';
import userRoutes from './src/routes/users.routes.js';
import tenantMiddleware from './src/middleware/tenant.middleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Public diner flow
app.use('/api/diner', dinerRoutes);

// Kitchen flow (tenant-scoped via middleware in router)
app.use('/api/kitchen', kitchenRoutes);

// Tenant admin routes
app.use('/api', restaurantRoutes);
app.use('/api', tenantMiddleware, menuRoutes);
app.use('/api', tenantMiddleware, tableRoutes);
app.use('/api', tenantMiddleware, userRoutes);

// Health check
app.get('/', (req, res) => {
  res.send('API is running');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
