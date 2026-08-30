import { Router } from 'express';
import { listarExercicios } from '../controllers/exerciseController';
import { autenticar } from '../middlewares/auth';

const router = Router();

router.get('/exercises', autenticar, listarExercicios);

export default router;