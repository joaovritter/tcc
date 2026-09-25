import { Router } from 'express';
import { autenticar } from '../middlewares/auth';
import { validarUuid } from '../middlewares/validarUuid';
import { gerarDiagnostico, diagnosticoAtual } from '../controllers/diagnosticController';

const router = Router();

router.post('/sessions/:id/diagnostics/generate', autenticar, validarUuid ('id'), gerarDiagnostico);
router.get('/diagnostics/latest', autenticar, diagnosticoAtual);

export default router;