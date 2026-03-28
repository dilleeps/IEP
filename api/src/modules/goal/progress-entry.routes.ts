import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/authorize.js';
import { STANDARD_PROTECTED_ROLES } from '../../middleware/roles.js';
import { requireChildAccess } from '../../middleware/childAccess.js';
import {
  createProgressEntry,
  getProgressEntriesByGoal,
  getProgressEntriesByChild,
  deleteProgressEntry,
  getProgressTimeline,
} from '../goal/progress-entry.controller.js';

const router = Router();

// All routes require authentication
router.use(authenticate);
router.use(requireRole(STANDARD_PROTECTED_ROLES));

// Progress entries
router.get('/', async (req, res, next) => {
  try {
    // Return empty array when no child filter specified
    res.json({ data: [], message: 'Use GET /progress-entries/child/:childId for child-specific entries' });
  } catch (err) { next(err); }
});
router.post('/', requireChildAccess({ bodyField: 'childId' }), createProgressEntry);
router.delete('/:id', deleteProgressEntry);

// Child progress entries
router.get('/child/:childId', requireChildAccess({ paramName: 'childId' }), getProgressEntriesByChild);

export default router;
