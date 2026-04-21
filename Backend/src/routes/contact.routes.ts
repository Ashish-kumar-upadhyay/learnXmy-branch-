import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validateBody } from '../middleware/validation.middleware';
import { contactFormSchema } from '../utils/validation';
import * as contact from '../controllers/contact.controller';

const r = Router();
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many contact submissions. Try again later.',
});

r.post('/', contactLimiter, validateBody(contactFormSchema), contact.submitContact);

export default r;
