import { Request, Response } from 'express';
import { prisma } from '../config/db';

export const startCycle = async ( req: Request, res: Response ) => {
    try {
        const date = new Date();
        const endDate = new Date( date.getTime() + 31 * 24 * 60 * 60 * 1000 ); // 31 days later
        const cycle = await prisma.cycle.create({
            data: {
                endDate
            }
        });
        res.status( 200 ).json({
            success: true,
            message: 'Cycle started succesfully',
            data: cycle
        });
    } catch ( error ) {
        console.error( error );
        res.status( 500 ).json({
            success: false,
            message: 'Error starting cycle'
        });
    }

}

export const getCurrentCycle = async ( req: Request, res: Response ) => {
    try {
        const cycle = await prisma.cycle.findFirst();
        res.status( 200 ).json({
            success: true,
            data: cycle
        });
    } catch ( error ) {
        console.error( error );
        res.status( 500 ).json({
            success: false,
            message: 'Error fetching current cycle'
        });
    }

}