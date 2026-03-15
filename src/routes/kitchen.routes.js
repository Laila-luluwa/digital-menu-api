import express from 'express';
import { getActiveOrders, updateOrderStatus } from '../controllers/kitchen/queue.controller.js';

const router = express.Router();

router.get('/orders', getActiveOrders);          // Список заказов для повара
router.patch('/orders/:id/status', updateOrderStatus); // Изменение статуса (повар нажал кнопку)

export default router;