import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import healthRoutes from './routes/healthRoutes';
import authRoutes from './routes/authRoutes';
const app = express ();

app.use(cors());
app.use(express.json());
app.use(healthRoutes)
app.use(authRoutes);

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`server rodando na porta ${port}`)
})