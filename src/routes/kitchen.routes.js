import express from 'express';
import { getActiveOrders, updateOrderStatus } from '../controllers/kitchen/queue.controller.js';

const router = express.Router();

// Маршрут для получения очереди заказов
router.get('/orders', getActiveOrders);

// Маршрут для смены статуса конкретного заказа
router.patch('/orders/:id/status', updateOrderStatus);

export default router;