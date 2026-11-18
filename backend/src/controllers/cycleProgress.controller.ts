import express from 'express';
import { prisma } from '../config/db';
import logger from '../config/logger';
import { getUtcDayBounds, resolveTargetDate } from './day.controller';

export const getCycleProgress = async ( req: express.Request, res: express.Response ) => {
    try {
        const { userId } = req;
        if ( !userId ) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const paramCycleId = req.params.cycleId as string | undefined;

        const targetCycle =
            !paramCycleId || paramCycleId === 'current'
                ? await prisma.cycle.findFirst({
                      where: {
                          userId,
                          isActive: true,
                          endDate: { gte: new Date() }
                      },
                      orderBy: { createdAt: 'desc' }
                  })
                : await prisma.cycle.findFirst({
                      where: {
                          id: paramCycleId,
                          userId
                      }
                  });

        if ( !targetCycle ) {
            const status = !paramCycleId || paramCycleId === 'current' ? 400 : 404;
            return res.status( status ).json({
                success: false,
                message:
                    status === 400
                        ? 'No active cycle found to calculate stats.'
                        : 'Cycle not found.'
            });
        }

        const [logs, categories] = await Promise.all([
            prisma.dailyLog.findMany({
                where: {
                    cycleId: targetCycle.id,
                    userId
                },
                include: {
                    plans: {
                        include: { category: true }
                    }
                },
                orderBy: { date: 'asc' }
            }),
            prisma.habitCategory.findMany({
                orderBy: { createdAt: 'asc' }
            })
        ]);

        const now = resolveTargetDate('today');
        const tomorrow = resolveTargetDate('tomorrow');
        const todayBounds = getUtcDayBounds(now);
        const tomorrowBounds = getUtcDayBounds(tomorrow);

        const isWithinBounds = (d: Date, bounds: { startOfDay: Date; endOfDay: Date }) =>
            d.getTime() >= bounds.startOfDay.getTime() && d.getTime() <= bounds.endOfDay.getTime();

        const todayLog = logs.find((l) => isWithinBounds(l.date, todayBounds)) ?? null;
        const tomorrowLog = logs.find((l) => isWithinBounds(l.date, tomorrowBounds)) ?? null;

        const diffTime = Math.max(0, now.getTime() - targetCycle.startDate.getTime());
        const currentDayNumber = Math.min(31, Math.max(1, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1));

        let totalActions = 0;
        let completedActions = 0;
        let closedDays = 0;

        logs.forEach((log) => {
            if (log.isClosed) closedDays++;
            totalActions += log.plans.length;
            completedActions += log.plans.filter((plan) => plan.isCompleted).length;
        });

        const skippedActions = Math.max(0, totalActions - completedActions);
        const overallCompletionRate = totalActions > 0
            ? Math.round((completedActions / totalActions) * 100)
            : 0;

        // Calculate streaks across logged days (up to today)
        const logsUpToToday = logs.filter((l) => l.date.getTime() <= todayBounds.endOfDay.getTime());
        let currentStreak = 0;
        let bestStreak = 0;
        let runningStreak = 0;

        for (const log of logsUpToToday) {
            const hasActivity = log.isClosed || log.plans.some((p) => p.isCompleted);
            if (hasActivity) {
                runningStreak++;
                if (runningStreak > bestStreak) {
                    bestStreak = runningStreak;
                }
            } else {
                runningStreak = 0;
            }
        }
        currentStreak = runningStreak;

        const todayPlannedCount = todayLog
            ? new Set(todayLog.plans.map((p) => p.categoryId)).size
            : 0;
        const todayCompletedCount = todayLog
            ? todayLog.plans.filter((p) => p.isCompleted).length
            : 0;
        const tomorrowPlannedCount = tomorrowLog
            ? new Set(
                  tomorrowLog.plans
                      .filter((p) => typeof p.description === 'string' && p.description.trim().length > 0)
                      .map((p) => p.categoryId)
              ).size
            : 0;

        const requiredPillars = Math.min(8, categories.length || 8);
        const canCloseToday =
            !todayLog?.isClosed &&
            (currentDayNumber >= 31 || tomorrowPlannedCount >= requiredPillars);

        const stats = {
            cycleId: targetCycle.id,
            startDate: targetCycle.startDate.toISOString(),
            endDate: targetCycle.endDate.toISOString(),
            isActive: targetCycle.isActive,
            currentDayNumber,
            totalDays: 31,
            daysLogged: logs.length,
            closedDays,
            totalActions,
            completedActions,
            skippedActions,
            overallCompletionRate,
            currentStreak,
            bestStreak,
            todayPlannedCount,
            todayCompletedCount,
            tomorrowPlannedCount,
            canCloseToday
        };

        // Compute per-pillar statistics across all 8 core categories
        const pillarStats = categories.map((cat) => {
            let plannedCount = 0;
            let completedCount = 0;
            let pillarRunningStreak = 0;

            for (const log of logs) {
                const catPlans = log.plans.filter((p) => p.categoryId === cat.id);
                plannedCount += catPlans.length;
                const catCompleted = catPlans.filter((p) => p.isCompleted).length;
                completedCount += catCompleted;

                if (log.date.getTime() <= todayBounds.endOfDay.getTime()) {
                    if (catCompleted > 0) {
                        pillarRunningStreak++;
                    } else if (catPlans.length > 0) {
                        pillarRunningStreak = 0;
                    }
                }
            }

            const skippedCount = Math.max(0, plannedCount - completedCount);
            const completionRate = plannedCount > 0
                ? Math.round((completedCount / plannedCount) * 100)
                : 0;

            return {
                categoryId: cat.id,
                categoryName: cat.name,
                description: cat.description,
                plannedCount,
                completedCount,
                skippedCount,
                completionRate,
                currentStreak: pillarRunningStreak
            };
        });

        // Compute chronological daily series across logged days
        const usedDayNumbers = new Set<number>();
        const dailySeries = logs.map((log, index) => {
            const rawDayNum = Math.min(
                31,
                Math.max(
                    1,
                    Math.floor((log.date.getTime() - targetCycle.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
                )
            );
            let dayNumber = rawDayNum;
            if (usedDayNumbers.has(dayNumber)) {
                dayNumber = Math.min(31, index + 1);
            }
            usedDayNumbers.add(dayNumber);

            const planned = log.plans.length;
            const completed = log.plans.filter((p) => p.isCompleted).length;
            const skipped = Math.max(0, planned - completed);
            const completionRate = planned > 0 ? Math.round((completed / planned) * 100) : 0;

            return {
                dayNumber,
                date: log.date.toISOString(),
                logId: log.id,
                isClosed: log.isClosed,
                isToday: isWithinBounds(log.date, todayBounds),
                isTomorrow: isWithinBounds(log.date, tomorrowBounds),
                planned,
                completed,
                skipped,
                completionRate
            };
        });

        // Recent activity feed
        const allPlansWithMeta = logs.flatMap((log) =>
            log.plans.map((p) => ({
                id: p.id,
                type: (p.isCompleted ? 'completed' : 'planned') as 'completed' | 'planned',
                description: p.description,
                categoryId: p.categoryId,
                categoryName: p.category?.name ?? 'Habit',
                isCompleted: p.isCompleted,
                logId: log.id,
                date: log.date.toISOString(),
                timestamp: p.updatedAt.toISOString()
            }))
        );
        allPlansWithMeta.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        const recentActivity = allPlansWithMeta.slice(0, 12);

        const payload = {
            stats,
            logs,
            todayLog,
            tomorrowLog,
            pillarStats,
            dailySeries,
            recentActivity
        };

        return res.status( 200 ).json({
            success: true,
            ...payload,
            data: payload
        });
    } catch ( error ) {
        logger.error(`Error fetching cycle progress: ${(error as Error).message}`);
        return res.status( 500 ).json({
            success: false,
            message: 'Internal server error'
        });
    }
};