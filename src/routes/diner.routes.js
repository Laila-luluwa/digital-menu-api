import express from 'express';
import { getMenu } from '../controllers/diner/menu.controller.js';

const router = express.Router();

router.get('/menu', getMenu);

export default router;