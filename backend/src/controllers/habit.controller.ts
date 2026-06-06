import { Request, Response } from 'express';
import { prisma } from '../config/db';
import logger from '../config/logger';

export const getCoreHabits = async ( req: Request, res: Response ) => {
    try {
        const habits = await prisma.habitCategory.findMany();
        res.status( 200 ).json({
            sucess: true,
            data: habits
        });
    } catch ( error) {
        logger.error(`Error fetching habits: ${(error as Error).message}`);
        res.status( 500 ).json({
            sucess: false,
            message: 'Error fetching habits'
        });
    }

}