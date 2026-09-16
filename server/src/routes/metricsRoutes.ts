import { Router } from 'express';
import { autenticar } from '../middlewares/auth';
import { volumeSemanal } from '../controllers/metricsController';


const router = Router();

router.get('/metrics/weekly-volume', autenticar, volumeSemanal);

export default router;