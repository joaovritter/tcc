import { Router } from "express";
import { autenticar } from "../middlewares/auth";
import {
    treinoDeHoje, comecarTreino, registrarSerie, apagarSerie
} from '../controllers/sessionController';


const router = Router();

router.get('/sessions/today', autenticar, treinoDeHoje);
router.post('/sessions/start', autenticar, comecarTreino);
router.post('/sessions/:id/sets', autenticar, registrarSerie);
router.delete('/sessions/:id/sets/:idSerie', autenticar, apagarSerie);


export default router;