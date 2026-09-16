import { Response } from 'express';
import { AuthenticateRequest } from '../middlewares/auth';
import * as volumeService from '../services/volumeService';

//se este controller crescer, é sinal que uma regra vazou do service pra cá.


// O controller nao calcula nada
// pega o usuario do token, chama o service e responde. Todo o SQL e a regra do limiar ficam no volumeService.
export async function volumeSemanal(req: AuthenticateRequest, res: Response) {
    try {
        const volume = await volumeService.calcularVolumeSemanal(req.userId as string);
        return res.status(200).json({ volume });
    } catch (erro) {
        console.error(erro);
        return res.status(500).json({ erro: 'Erro ao calcular o volume semanal' });
    }
}