import express from 'express';
import arrivalRoutes from './busArrivalController';
import cors from 'cors';

const port = 3001;

const app = express();
app.use(cors({origin: 'http://localhost:5173' }));
app.use('/api', arrivalRoutes);
app.listen(port, () => {
    return console.log(`Express is listening at http://localhost:${port}`);
});