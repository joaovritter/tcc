import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import 'dotenv/config';
import healthRoutes from './routes/healthRoutes';
import authRoutes from './routes/authRoutes';
import divisionRoutes from './routes/divisionRoutes';
import exerciseRoutes from './routes/exerciseRoutes';
import sessionRoutes from './routes/sessionRoutes';
import metricsRoutes from './routes/metricsRoutes';
import diagnosticoRoutes from './routes/diagnosticRoutes';
import historyRoutes from './routes/historyRoutes';


//separa o listen no index.js para que os testes importem a aplicação express sem que ela suba
const app = express ();

app.use(cors());
app.use(express.json());
app.use(healthRoutes);
app.use(authRoutes);
app.use(divisionRoutes);
app.use(exerciseRoutes);
app.use(sessionRoutes);
app.use(metricsRoutes);
app.use(diagnosticoRoutes);
app.use(historyRoutes);

//nenhuma rota foi encontrada
app.use((req: Request,  res: Response) => {
    res.status(404).json({erro: 'Rota não encontrada'});
});

//erro que nao foi tratado no controller. precisa dos 4 parametros pro express reconhecer
app.use((erro: any, req: Request, res: Response, next: NextFunction) => {
  console.error(erro);
  res.status(erro.status || 500).json({ erro: 'Erro ao processar a requisição' });
})

export default app;
