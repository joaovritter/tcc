import { Router } from "express";
import { autenticar } from "../middlewares/auth";
import { validarUuid } from "../middlewares/validarUuid";
import {
    listarDivisoes, salvarDivisoes, 
    listarExerciciosDivisao, salvarExerciciosDivisao, listarResumoMusculos,
} from '../controllers/divisionController';

const router = Router();

router.get('/divisions', autenticar, listarDivisoes);
router.put('/divisions', autenticar, salvarDivisoes);
router.get('/divisions/:id/exercises', autenticar, validarUuid('id'), listarExerciciosDivisao);
router.put('/divisions/:id/exercises', autenticar, validarUuid('id'), salvarExerciciosDivisao);
router.get('/divisions/muscle-summary', autenticar, listarResumoMusculos);

export default router;

    