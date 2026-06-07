import { Request, Response } from 'express';
import { prisma } from '../config/db';
import logger from '../config/logger';

export const createDay = async ( req: Request, res: Response ) => {
    try {
        const { userId } = req;
        if ( !userId ) {
            return res.status(401).json({ success: false, message: 'Unathorized' });
        }

        const activeCycle = await prisma.cycle.findFirst({
            where: { endDate: { gte: new Date() } },
            orderBy: { endDate: 'desc' }
        });
        
        if ( !activeCycle ) {
            return res.status( 400 ).json( { message: 'No active cycle found' } );
        }
        
        const date = new Date();
        const day = await prisma.dailyLog.create({
            data: {
                userId,
                date,
                cycleId: activeCycle.id
            }
        });
        res.status( 201 ).json( day );

    } catch ( error ) {
        logger.error(`Error creating day: ${error as Error}.message`);
        res.status( 500 ).json( { message: 'Internal server error' } );
    }
}

export const getDays = async ( req: Request, res: Response ) => {
    try {
        const days = await prisma.dailyLog.findMany();
        res.status( 200 ).json( days );
    } catch ( error ) {
        logger.error(`Error fetching days: ${error as Error}.message`);
        res.status( 500 ).json( { message: 'Internal server error' } );
    }
}

export const updateDay = async ( req: Request, res: Response ) => {
    try {
        const id = req.params.id as string;

        // Only allow safe fields to be updated
        const { isClosed } = req.body;
        const updateData: { isClosed?: boolean } = {};
        if ( isClosed !== undefined ) updateData.isClosed = isClosed;

        const activeCycle = await prisma.cycle.findFirst({
            where: { endDate: { gte: new Date() } },
            orderBy: { endDate: 'desc' }
        });
        
        if ( !activeCycle ) {
            return res.status( 400 ).json( { message: 'No active cycle found' } );
        }
        
        const day = await prisma.dailyLog.update({
            where: { id },
            data: updateData
        });
        res.status( 200 ).json( day );
    } catch ( error ) {
        logger.error(`Error updating day: ${(error as Error).message}`);
        res.status( 500 ).json( { message: 'Internal server error' } );
    }
}