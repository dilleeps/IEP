// src/modules/config/public/config.routes.ts
import { Router } from 'express';
import { ConfigController } from './config.controller.js';
import { authenticate } from '../../middleware/authenticate.js';

const router = Router();
const controller = new ConfigController();

// All authenticated users can read configs
router.use(authenticate);

router.get('/', controller.list);
router.get('/:category', controller.getByCategory);

export default router;
