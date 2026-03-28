// src/modules/letter/letter.routes.ts
import { Router } from 'express';
import { LetterController } from './letter.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { requireRole } from '../middleware/authorize.js';
import { STANDARD_PROTECTED_ROLES } from '../middleware/roles.js';
import { validate } from '../middleware/validate.js';
import { requireResourceOwnership } from '../middleware/resourceOwnership.js';
import { requireChildAccess } from '../middleware/childAccess.js';
import {
  createLetterSchema,
  updateLetterSchema,
  generateLetterSchema,
  listLettersSchema,
  letterIdSchema,
  updateStatusSchema,
  sendLetterSchema,
} from './letter.validation.js';

const router = Router();
const controller = new LetterController();

// All routes require authentication
router.use(authenticate);
router.use(requireRole(STANDARD_PROTECTED_ROLES));

// Letter CRUD
router.post('/', validate(createLetterSchema), requireChildAccess({ bodyField: 'childId', required: false }), controller.create);
router.post('/generate', validate(generateLetterSchema), requireChildAccess({ bodyField: 'childId', required: false }), controller.generate);
router.get('/', validate(listLettersSchema), requireChildAccess({ queryField: 'childId', required: false }), controller.list);
router.get('/:id', validate(letterIdSchema), requireResourceOwnership({ resourceType: 'letter' }), controller.getById);
router.put('/:id', validate(updateLetterSchema), requireResourceOwnership({ resourceType: 'letter' }), controller.update);
router.patch('/:id/status', validate(updateStatusSchema), requireResourceOwnership({ resourceType: 'letter' }), controller.updateStatus);
router.post('/:id/send', validate(sendLetterSchema), requireResourceOwnership({ resourceType: 'letter' }), controller.send);
router.delete('/:id', validate(letterIdSchema), requireResourceOwnership({ resourceType: 'letter' }), controller.delete);

// Template endpoints
router.get('/templates/list', controller.getTemplates);
router.get('/templates/:id', validate(letterIdSchema), controller.getTemplateById);

export default router;
