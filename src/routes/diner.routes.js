import express from 'express';
import { getMenu } from '../controllers/diner/menu.controller.js';
import { startSession } from '../controllers/diner/session.controller.js';
import { createOrder } from '../controllers/diner/order.controller.js'; // Импорт
import { validateSession } from '../middleware/validateSession.js';

const router = express.Router();

router.post('/sessions/start', startSession);
router.get('/menu', validateSession, getMenu);

// НОВЫЙ РОУТ: Оформление заказа
router.post('/orders', validateSession, createOrder);

export default router;