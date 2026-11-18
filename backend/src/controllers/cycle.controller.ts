import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
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

        const date = new Date();
        const endDate = new Date(date.getTime() + 31 * 24 * 60 * 60 * 1000);
        const goals = new Map<string, string>();
        for (const goal of rawGoals) {
            const categoryId = goal.categoryId.trim();
            const description = goal.description.trim();
            if (!goals.has(categoryId)) goals.set(categoryId, description);
        }

        const cycle = await prisma.$transaction(async (tx) => {
            // Serialize starts for this account without locking other users' cycles.
            await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId} FOR UPDATE NOWAIT`;
            await tx.cycle.updateMany({
                where: { userId, isActive: true },
                data: { isActive: false }
            });
            return tx.cycle.create({
                data: {
                    userId,
                    startDate: date,
                    endDate,
                    logs: {
                        create: {
                            userId,
                            date,
                            plans: {
                                createMany: {
                                    data: Array.from(goals, ([categoryId, description]) => ({
                                        userId, categoryId, description
                                    }))
                                }
                            }
                        }
                    }
                }
            });
        });

        return res.status( 201 ).json({
            success: true,
            message: 'Cycle started successfully',
            data: cycle
        });
    } catch ( error ) {
        if (error instanceof Prisma.PrismaClientKnownRequestError &&
            (error.code === 'P2002' || (error.code === 'P2010' && error.meta?.code === '55P03'))) {
            return res.status(409).json({ success: false, message: 'Another cycle start is in progress. Refresh and try again.' });
        }
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

        const pageSize = 20;
        const cursorId = req.query.cursor;
        if (cursorId !== undefined && (typeof cursorId !== 'string' || cursorId.length > 64)) {
            return res.status(400).json({ success: false, message: 'Invalid cycle history cursor.' });
        }

        const cursor = cursorId === undefined ? null : await prisma.cycle.findFirst({
            where: { id: cursorId, userId },
            select: { id: true, startDate: true }
        });
        if (cursorId !== undefined && !cursor) {
            return res.status(400).json({ success: false, message: 'Invalid cycle history cursor.' });
        }

        const rows = await prisma.cycle.findMany({
            where: {
                userId,
                ...(cursor && {
                    OR: [
                        { startDate: { lt: cursor.startDate } },
                        { startDate: cursor.startDate, id: { lt: cursor.id } }
                    ]
                })
            },
            orderBy: [{ startDate: 'desc' }, { id: 'desc' }],
            take: pageSize + 1
        });
        const cycles = rows.slice(0, pageSize);
        const summaries = cycles.length ? await prisma.$queryRaw<Array<{
            cycleId: string;
            daysLogged: number;
            closedDays: number;
            totalActions: number;
            completedActions: number;
        }>>`
            SELECT logs."cycleId",
                count(*)::int AS "daysLogged",
                count(*) FILTER (WHERE logs."isClosed")::int AS "closedDays",
                sum(plans.total)::int AS "totalActions",
                sum(plans.completed)::int AS "completedActions"
            FROM "DailyLog" AS logs
            CROSS JOIN LATERAL (
                SELECT count(*) AS total,
                    count(*) FILTER (WHERE plan."isCompleted") AS completed
                FROM "PlannedAction" AS plan
                WHERE plan."logId" = logs."id" AND plan."userId" = ${userId}
            ) AS plans
            WHERE logs."cycleId" IN (${Prisma.join(cycles.map(({ id }) => id))})
                AND logs."userId" = ${userId}
            GROUP BY logs."cycleId"
        ` : [];
        const summaryByCycle = new Map(summaries.map(({ cycleId, ...summary }) => [cycleId, summary]));
        const data = cycles.map(cycle => {
            const summary = summaryByCycle.get(cycle.id) ?? {
                daysLogged: 0, closedDays: 0, totalActions: 0, completedActions: 0
            };
            return {
                ...cycle,
                summary: {
                    ...summary,
                    overallCompletionRate: summary.totalActions
                        ? Math.round((summary.completedActions / summary.totalActions) * 100)
                        : 0
                }
            };
        });

        return res.status(200).json({
            success: true,
            data,
            nextCursor: rows.length > pageSize ? cycles[cycles.length - 1].id : null
        });
    } catch ( error ) {
        logger.error(`Error fetching cycle history: ${(error as Error).message}`);
        return res.status( 500 ).json({
            success: false,
            message: 'Error fetching cycle history'
        });
    }
};