import { Request, Response } from 'express';
import { prisma } from '../config/db';

export const createDay = async ( req: Request, res: Response ) => {
    try {
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
                date,
                cycleId: activeCycle.id
            }
        });
        res.status( 201 ).json( day );

    } catch ( error ) {
        console.error( error );
        res.status( 500 ).json( { message: 'Internal server error' } );
    }
}

export const getDays = async ( req: Request, res: Response ) => {
    try {
        const days = await prisma.dailyLog.findMany();
        res.status( 200 ).json( days );
    } catch ( error ) {
        console.error( error );
        res.status( 500 ).json( { message: 'Internal server error' } );
    }
}

export const updateDay = async ( req: Request, res: Response ) => {
    try {
        const id = req.params.id as string;
        const updateData = req.body;

        // Prevent updating date, cycleId, and id
        delete updateData.date;
        delete updateData.cycleId;
        delete updateData.id;

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
        console.error( error );
        res.status( 500 ).json( { message: 'Internal server error' } );
    }
}