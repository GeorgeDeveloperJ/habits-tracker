import express from 'express';
import { prisma } from '../config/db';

export const getCycleProgress = async ( req: express.Request, res: express.Response ) => {
    try {
        const activeCycle = await prisma.cycle.findFirst({
            where: { endDate: { gte: new Date() } },
            orderBy: { endDate: 'desc' }
        });
        
        if ( !activeCycle ) {
            return res.status( 400 ).json( { message: 'No active cycle found to calculate stats.' } );
        }

        const logs = await prisma.dailyLog.findMany({
            where: { cycleId: activeCycle.id },
            include: { plans: true },
            orderBy: { date: 'asc' }
        });

        const totalDaysInclude = 31;
        const daysLogged = logs.length;
        
        const startDate = activeCycle.startDate;
        const today = new Date();
        const diffTime = today.getTime() - activeCycle.startDate.getTime();
        const currentDayNumber = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

        let totalActions = 0;
        let completedActions = 0;

        logs.forEach( log => {
            totalActions += log.plans.length;
            completedActions += log.plans.filter( plan => plan.isCompleted ).length;
        });

        const overallCompletionRate = totalActions > 0
            ? Math.round((completedActions / totalActions) * 100)
            : 0;

        res.status( 200 ).json({
            success: true,
            stats: {
                cycleId: activeCycle.id,
                currentDayNumber: Math.min(currentDayNumber, 31),
                daysLogged,
                completedActions,
                overallCompletionRate
            }
        });

    } catch ( error ) {
        console.error( error );
        res.status( 500 ).json( { message: 'Internal server error' } );
    }
}