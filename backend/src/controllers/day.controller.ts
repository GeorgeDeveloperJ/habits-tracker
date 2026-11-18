import { Request, Response } from 'express';
import { prisma } from '../config/db';
import logger from '../config/logger';

export const getUtcDayBounds = (baseDate: Date) => {
    const startOfDay = new Date(baseDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(baseDate);
    endOfDay.setUTCHours(23, 59, 59, 999);
    return { startOfDay, endOfDay };
};

export const resolveTargetDate = (targetDate?: 'today' | 'tomorrow'): Date => {
    const now = new Date();
    if (targetDate === 'tomorrow') {
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
    return now;
};

export const createDay = async ( req: Request, res: Response ) => {
    try {
        const { userId } = req;
        if ( !userId ) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { cycleId, targetDate } = req.body ?? {};

        const activeCycle = cycleId
            ? await prisma.cycle.findFirst({
                  where: { id: cycleId, userId }
              })
            : await prisma.cycle.findFirst({
                  where: {
                      userId,
                      isActive: true,
                      endDate: { gte: new Date() }
                  },
                  orderBy: { createdAt: 'desc' }
              });

        if ( !activeCycle ) {
            return res.status( 400 ).json({
                success: false,
                message: 'No active cycle found'
            });
        }

        const dateObj = resolveTargetDate(targetDate === 'tomorrow' ? 'tomorrow' : 'today');
        const { startOfDay, endOfDay } = getUtcDayBounds(dateObj);

        const existingDay = await prisma.dailyLog.findFirst({
            where: {
                userId,
                cycleId: activeCycle.id,
                date: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            },
            include: { plans: true }
        });

        if ( existingDay ) {
            return res.status( 200 ).json({
                success: true,
                message: 'Daily log already exists',
                data: existingDay
            });
        }

        const day = await prisma.dailyLog.create({
            data: {
                userId,
                date: dateObj,
                cycleId: activeCycle.id
            },
            include: { plans: true }
        });

        return res.status( 201 ).json({
            success: true,
            message: 'Daily log created successfully',
            data: day
        });
    } catch ( error ) {
        logger.error(`Error creating day: ${(error as Error).message}`);
        return res.status( 500 ).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

export const getDays = async ( req: Request, res: Response ) => {
    try {
        const { userId } = req;
        if ( !userId ) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const cycleId = typeof req.query.cycleId === 'string' ? req.query.cycleId : undefined;

        const days = await prisma.dailyLog.findMany({
            where: {
                userId,
                ...(cycleId ? { cycleId } : {})
            },
            include: { plans: true },
            orderBy: { date: 'asc' }
        });

        return res.status( 200 ).json({
            success: true,
            data: days
        });
    } catch ( error ) {
        logger.error(`Error fetching days: ${(error as Error).message}`);
        return res.status( 500 ).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

export const updateDay = async ( req: Request, res: Response ) => {
    try {
        const { userId } = req;
        if ( !userId ) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const id = req.params.id as string;
        const { isClosed, forceClose } = req.body ?? {};

        const existingDay = await prisma.dailyLog.findFirst({
            where: { id, userId },
            include: {
                cycle: true,
                plans: true
            }
        });

        if ( !existingDay ) {
            return res.status( 404 ).json({
                success: false,
                message: 'Daily log not found'
            });
        }

        // Enforce Close Day Gatekeeper when closing a day
        if ( isClosed === true && !existingDay.isClosed && !forceClose ) {
            const cycleStartMs = existingDay.cycle.startDate.getTime();
            const dayNumFromLog = Math.floor((existingDay.date.getTime() - cycleStartMs) / (1000 * 60 * 60 * 24)) + 1;
            const dayNumFromNow = Math.floor((Date.now() - cycleStartMs) / (1000 * 60 * 60 * 24)) + 1;

            const tomorrowDate = new Date(existingDay.date.getTime() + 24 * 60 * 60 * 1000);
            const { startOfDay: tomorrowStart, endOfDay: tomorrowEnd } = getUtcDayBounds(tomorrowDate);

            const isFinalDay =
                dayNumFromLog >= 31 ||
                dayNumFromNow >= 31 ||
                tomorrowStart.getTime() >= existingDay.cycle.endDate.getTime();

            if ( !isFinalDay ) {
                const tomorrowLog = await prisma.dailyLog.findFirst({
                    where: {
                        userId,
                        cycleId: existingDay.cycleId,
                        date: {
                            gte: tomorrowStart,
                            lte: tomorrowEnd
                        }
                    },
                    include: { plans: true }
                });

                const totalCategoriesCount = await prisma.habitCategory.count();
                const requiredPillars = Math.min(8, totalCategoriesCount || 8);

                const plannedPillarsCount = new Set(
                    (tomorrowLog?.plans ?? [])
                        .filter((p) => typeof p.description === 'string' && p.description.trim().length > 0)
                        .map((p) => p.categoryId)
                ).size;

                if ( plannedPillarsCount < requiredPillars ) {
                    return res.status( 400 ).json({
                        success: false,
                        message: "Cannot close today until you have planned tomorrow's 8 pillars.",
                        plannedPillarsCount,
                        requiredPillars,
                        data: {
                            plannedPillarsCount,
                            requiredPillars
                        }
                    });
                }
            }
        }

        const updateData: { isClosed?: boolean } = {};
        if ( typeof isClosed === 'boolean' ) {
            updateData.isClosed = isClosed;
        }

        const day = await prisma.dailyLog.update({
            where: { id },
            data: updateData,
            include: { plans: true }
        });

        return res.status( 200 ).json({
            success: true,
            message: 'Daily log updated successfully',
            data: day
        });
    } catch ( error ) {
        logger.error(`Error updating day: ${(error as Error).message}`);
        return res.status( 500 ).json({
            success: false,
            message: 'Internal server error'
        });
    }
};