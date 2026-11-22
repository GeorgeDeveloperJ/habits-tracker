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
        const logsInclude = {
            where: { userId },
            include: {
                plans: {
                    include: { category: true }
                }
            },
            orderBy: { date: 'asc' as const }
        };

        const [targetCycle, categories] = await Promise.all([
            !paramCycleId || paramCycleId === 'current'
                ? prisma.cycle.findFirst({
                      where: {
                          userId,
                          isActive: true,
                          endDate: { gte: new Date() }
                      },
                      orderBy: { createdAt: 'desc' },
                      include: { logs: logsInclude }
                  })
                : prisma.cycle.findFirst({
                      where: {
                          id: paramCycleId,
                          userId
                      },
                      include: { logs: logsInclude }
                  }),
            prisma.habitCategory.findMany({
                orderBy: { createdAt: 'asc' }
            })
        ]);

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

        const { logs } = targetCycle;

        const now = resolveTargetDate('today');
        const tomorrow = resolveTargetDate('tomorrow');
        const todayBounds = getUtcDayBounds(now);
        const tomorrowBounds = getUtcDayBounds(tomorrow);
        const todayStartMs = todayBounds.startOfDay.getTime();
        const todayEndMs = todayBounds.endOfDay.getTime();
        const tomorrowStartMs = tomorrowBounds.startOfDay.getTime();
        const tomorrowEndMs = tomorrowBounds.endOfDay.getTime();
        const cycleStartMs = targetCycle.startDate.getTime();
        const dayMs = 1000 * 60 * 60 * 24;

        let todayLog: (typeof logs)[number] | null = null;
        let tomorrowLog: (typeof logs)[number] | null = null;

        const diffTime = Math.max(0, now.getTime() - cycleStartMs);
        const currentDayNumber = Math.min(31, Math.max(1, Math.floor(diffTime / dayMs) + 1));

        let totalActions = 0;
        let completedActions = 0;
        let closedDays = 0;
        let bestStreak = 0;
        let runningStreak = 0;

        const pillarAccumulators = new Map<string, {
            plannedCount: number;
            completedCount: number;
            currentStreak: number;
        }>();
        const usedDayNumbers = new Set<number>();
        const dailySeries: Array<{
            dayNumber: number;
            date: string;
            logId: string;
            isClosed: boolean;
            isToday: boolean;
            isTomorrow: boolean;
            planned: number;
            completed: number;
            skipped: number;
            completionRate: number;
        }> = [];
        const allPlanEntries: Array<{
            updatedAtMs: number;
            plan: (typeof logs)[number]['plans'][number];
            logId: string;
            logDateIso: string;
        }> = [];

        logs.forEach((log, index) => {
            const logDateMs = log.date.getTime();
            const isToday = logDateMs >= todayStartMs && logDateMs <= todayEndMs;
            const isTomorrow = logDateMs >= tomorrowStartMs && logDateMs <= tomorrowEndMs;
            const logDateIso = log.date.toISOString();

            if (!todayLog && isToday) todayLog = log;
            if (!tomorrowLog && isTomorrow) tomorrowLog = log;
            if (log.isClosed) closedDays++;

            const planned = log.plans.length;
            let completed = 0;
            const logCategoryCounts = new Map<string, { planned: number; completed: number }>();

            for (const p of log.plans) {
                if (p.isCompleted) completed++;

                let catCounts = logCategoryCounts.get(p.categoryId);
                if (!catCounts) {
                    catCounts = { planned: 0, completed: 0 };
                    logCategoryCounts.set(p.categoryId, catCounts);
                }
                catCounts.planned++;
                if (p.isCompleted) catCounts.completed++;

                allPlanEntries.push({
                    updatedAtMs: p.updatedAt.getTime(),
                    plan: p,
                    logId: log.id,
                    logDateIso
                });
            }

            totalActions += planned;
            completedActions += completed;

            if (logDateMs <= todayEndMs) {
                const hasActivity = log.isClosed || completed > 0;
                if (hasActivity) {
                    runningStreak++;
                    if (runningStreak > bestStreak) {
                        bestStreak = runningStreak;
                    }
                } else {
                    runningStreak = 0;
                }
            }

            for (const [categoryId, counts] of logCategoryCounts) {
                let acc = pillarAccumulators.get(categoryId);
                if (!acc) {
                    acc = { plannedCount: 0, completedCount: 0, currentStreak: 0 };
                    pillarAccumulators.set(categoryId, acc);
                }
                acc.plannedCount += counts.planned;
                acc.completedCount += counts.completed;

                if (logDateMs <= todayEndMs) {
                    if (counts.completed > 0) {
                        acc.currentStreak++;
                    } else if (counts.planned > 0) {
                        acc.currentStreak = 0;
                    }
                }
            }

            const rawDayNum = Math.min(
                31,
                Math.max(1, Math.floor((logDateMs - cycleStartMs) / dayMs) + 1)
            );
            let dayNumber = rawDayNum;
            if (usedDayNumbers.has(dayNumber)) {
                dayNumber = Math.min(31, index + 1);
            }
            usedDayNumbers.add(dayNumber);

            const skipped = Math.max(0, planned - completed);
            const completionRate = planned > 0 ? Math.round((completed / planned) * 100) : 0;

            dailySeries.push({
                dayNumber,
                date: logDateIso,
                logId: log.id,
                isClosed: log.isClosed,
                isToday,
                isTomorrow,
                planned,
                completed,
                skipped,
                completionRate
            });
        });

        const currentStreak = runningStreak;
        const skippedActions = Math.max(0, totalActions - completedActions);
        const overallCompletionRate = totalActions > 0
            ? Math.round((completedActions / totalActions) * 100)
            : 0;

        const todayLogValue = todayLog as (typeof logs)[number] | null;
        const tomorrowLogValue = tomorrowLog as (typeof logs)[number] | null;

        const todayPlannedCount = todayLogValue
            ? new Set(todayLogValue.plans.map((p) => p.categoryId)).size
            : 0;
        const todayCompletedCount = todayLogValue
            ? todayLogValue.plans.filter((p) => p.isCompleted).length
            : 0;
        const tomorrowPlannedCount = tomorrowLogValue
            ? new Set(
                  tomorrowLogValue.plans
                      .filter((p) => typeof p.description === 'string' && p.description.trim().length > 0)
                      .map((p) => p.categoryId)
              ).size
            : 0;

        const requiredPillars = Math.min(8, categories.length || 8);
        const canCloseToday =
            !todayLogValue?.isClosed &&
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
            const acc = pillarAccumulators.get(cat.id);
            const plannedCount = acc?.plannedCount ?? 0;
            const completedCount = acc?.completedCount ?? 0;
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
                currentStreak: acc?.currentStreak ?? 0
            };
        });

        // Recent activity feed
        allPlanEntries.sort((a, b) => b.updatedAtMs - a.updatedAtMs);
        const recentActivity = allPlanEntries.slice(0, 12).map(({ plan: p, logId, logDateIso }) => ({
            id: p.id,
            type: (p.isCompleted ? 'completed' : 'planned') as 'completed' | 'planned',
            description: p.description,
            categoryId: p.categoryId,
            categoryName: p.category?.name ?? 'Habit',
            isCompleted: p.isCompleted,
            logId,
            date: logDateIso,
            timestamp: p.updatedAt.toISOString()
        }));

        const payload = {
            stats,
            logs,
            todayLog: todayLogValue,
            tomorrowLog: tomorrowLogValue,
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