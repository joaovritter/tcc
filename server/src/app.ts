import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import healthRoutes from './routes/healthRoutes';
import authRoutes from './routes/authRoutes';
import divisionRoutes from './routes/divisionRoutes'
import exerciseRoutes from './routes/exerciseRoutes'

//separa o listen no index.js para que os testes importem a aplicação express sem que ela suba
const app = express ();

app.use(cors());
app.use(express.json());
app.use(healthRoutes);
app.use(authRoutes);
app.use(divisionRoutes);
app.use(exerciseRoutes);

export default app;
