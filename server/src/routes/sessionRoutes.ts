import { Router } from "express";
import { autenticar } from "../middlewares/auth";
import { validarUuid } from "../middlewares/validarUuid";
import {
    treinoDeHoje, comecarTreino, registrarSerie, apagarSerie, finalizarTreino
} from '../controllers/sessionController';


const router = Router();

router.get('/sessions/today', autenticar, treinoDeHoje);
router.post('/sessions/start', autenticar, comecarTreino);
router.post('/sessions/:id/sets', autenticar, validarUuid('id'), registrarSerie);
router.delete('/sessions/:id/sets/:idSerie', autenticar, validarUuid('id'), apagarSerie);
router.post('/sessions/:id/finish', autenticar, validarUuid('id'), finalizarTreino);


export default router;