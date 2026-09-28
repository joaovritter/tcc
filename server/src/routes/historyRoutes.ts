import { Router } from 'express';
import { autenticar } from '../middlewares/auth';
import { validarUuid } from '../middlewares/validarUuid';
import {
    sessoesDoMes, detalheSessao, exerciciosTreinados, progressaoCarga, volumeHistorico,
} from '../controllers/historyController';

const router = Router();

router.get('/history/sessions', autenticar, sessoesDoMes);
router.get('/history/sessions/:id', autenticar, validarUuid('id'), detalheSessao);
router.get('/history/exercises', autenticar, exerciciosTreinados);
router.get('/history/exercises/:id/load-progression', autenticar, progressaoCarga);
router.get('/history/weekly-volume', autenticar, volumeHistorico);

export default router;