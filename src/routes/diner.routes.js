import express from 'express';
import { createOrder } from '../controllers/diner/order.controller.js';
import { validateSession } from '../middleware/validateSession.js';
import { validateRequest } from '../middleware/validateRequest.js'; // Используем её название

const router = express.Router();

// Применяем проверку перед созданием заказа
router.post('/orders', validateSession, validateRequest, createOrder);

export default router;