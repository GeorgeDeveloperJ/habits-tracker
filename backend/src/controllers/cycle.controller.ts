import { Request, Response } from 'express';
import { prisma } from '../config/db';
import logger from '../config/logger';

export const startCycle = async ( req: Request, res: Response ) => {
    try {
        const { userId } = req;
        if ( !userId ) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const rawGoals = Array.isArray(req.body?.initialGoals) ? req.body.initialGoals : [];
        if (rawGoals.length > 0) {
            const validCategories = await prisma.habitCategory.findMany({
                select: { id: true }
            });
            const validIds = new Set(validCategories.map((c) => c.id));
            for (const g of rawGoals) {
                const catId = typeof g?.categoryId === 'string' ? g.categoryId.trim() : '';
                if (!catId || !validIds.has(catId)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid habit category in initialGoals'
                    });
                }
            }
        }

        // Deactivate any previous active cycles for this user
        await prisma.cycle.updateMany({
            where: { userId, isActive: true },
            data: { isActive: false }
        });

        const date = new Date();
        const endDate = new Date( date.getTime() + 31 * 24 * 60 * 60 * 1000 ); // 31 days later

        const cycle = await prisma.cycle.create({
            data: {
                userId,
                startDate: date,
                endDate,
                isActive: true
            }
        });

        // Auto-create Day 1 DailyLog for the new cycle
        const day1Log = await prisma.dailyLog.create({
            data: {
                userId,
                cycleId: cycle.id,
                date,
                isClosed: false
            }
        });

        // Optionally populate Day 1 initial goals if provided
        if (rawGoals.length > 0) {
            const seenCategories = new Set<string>();
            for (const g of rawGoals) {
                const catId = typeof g?.categoryId === 'string' ? g.categoryId.trim() : '';
                const desc = typeof g?.description === 'string' ? g.description.trim() : '';
                if (catId && desc && !seenCategories.has(catId)) {
                    seenCategories.add(catId);
                    await prisma.plannedAction.create({
                        data: {
                            userId,
                            logId: day1Log.id,
                            categoryId: catId,
                            description: desc,
                            isCompleted: false
                        }
                    });
                }
            }
        }

        return res.status( 201 ).json({
            success: true,
            message: 'Cycle started successfully',
            data: cycle
        });
    } catch ( error ) {
        logger.error(`Error starting cycle: ${(error as Error).message}`);
        return res.status( 500 ).json({
            success: false,
            message: 'Error starting cycle'
        });
    }
};

export const getCurrentCycle = async ( req: Request, res: Response ) => {
    try {
        const { userId } = req;
        if ( !userId ) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const cycle = await prisma.cycle.findFirst({
            where: {
                userId,
                isActive: true,
                endDate: { gte: new Date() }
            },
            orderBy: { createdAt: 'desc' }
        });

        return res.status( 200 ).json({
            success: true,
            data: cycle
        });
    } catch ( error ) {
        logger.error(`Error fetching current cycle: ${(error as Error).message}`);
        return res.status( 500 ).json({
            success: false,
            message: 'Error fetching current cycle'
        });
    }
};

export const getCycleHistory = async ( req: Request, res: Response ) => {
    try {
        const { userId } = req;
        if ( !userId ) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const cycles = await prisma.cycle.findMany({
            where: { userId },
            include: {
                logs: {
                    include: { plans: true },
                    orderBy: { date: 'asc' }
                }
            },
            orderBy: { startDate: 'desc' }
        });

        const formatted = cycles.map((c) => {
            let totalActions = 0;
            let completedActions = 0;
            let closedDays = 0;
            for (const log of c.logs) {
                if (log.isClosed) closedDays++;
                totalActions += log.plans.length;
                completedActions += log.plans.filter((p) => p.isCompleted).length;
            }
            const overallCompletionRate = totalActions > 0
                ? Math.round((completedActions / totalActions) * 100)
                : 0;
            return {
                ...c,
                summary: {
                    daysLogged: c.logs.length,
                    closedDays,
                    totalActions,
                    completedActions,
                    overallCompletionRate
                }
            };
        });

        return res.status( 200 ).json({
            success: true,
            data: formatted
        });
    } catch ( error ) {
        logger.error(`Error fetching cycle history: ${(error as Error).message}`);
        return res.status( 500 ).json({
            success: false,
            message: 'Error fetching cycle history'
        });
    }
};