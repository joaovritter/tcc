import {Router} from 'express'
import { register, login, me} from '../controllers/authController'
import { autenticar } from '../middlewares/auth';

const router = Router();

router.post('/auth/register', register);

router.post('/auth/login', login);

//caminho, middleware e função
router.get('/me', autenticar, me);


export default router;