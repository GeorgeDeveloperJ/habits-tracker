import cors from 'cors';

const corsOptions = {
    origin: [
        'http://localhost:5173',
        'https://habits-tracker-flame.vercel.app/'
    ],
    methods: 'GET,POST,PUT,PATCH,DELETE',
    credentials: true

}

export const corsMiddleware = cors(corsOptions);