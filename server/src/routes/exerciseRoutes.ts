import { Router } from 'express';
import { listar } from '../controllers/exerciseController';
import { autenticar } from '../middlewares/auth';

const router = Router();

router.get('/exercises', autenticar, listar);

export default router;