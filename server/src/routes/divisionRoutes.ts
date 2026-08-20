import { Router } from "express";
import { listar, salvar } from '../controllers/divisionController'
import { autenticar } from "../middlewares/auth";

const router = Router();

router.get('/divisions', autenticar, listar);
router.put('/divisions', autenticar, salvar);

export default router;

