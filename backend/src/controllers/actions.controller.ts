import { Request, Response } from 'express';
import { prisma } from '../config/db';
import logger from '../config/logger';
import { getUtcDayBounds, resolveTargetDate } from './day.controller';

export const createAction = async ( req: Request, res: Response ) => {
    try {
        const { userId } = req;
        if ( !userId ) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const { categoryId, description, targetDate, logId } = req.body ?? {};
        const trimmedDescription = typeof description === 'string' ? description.trim() : '';
        const trimmedCategoryId = typeof categoryId === 'string' ? categoryId.trim() : '';

        if ( !trimmedCategoryId || !trimmedDescription ) {
            return res.status( 400 ).json({
                success: false,
                message: 'Category ID and a non-empty description are required'
            });
        }

        // Verify category exists
        const category = await prisma.habitCategory.findUnique({
            where: { id: trimmedCategoryId }
        }).catch(() => null);

        if ( !category ) {
            return res.status( 400 ).json({
                success: false,
                message: 'Invalid habit category'
            });
        }

        let targetLog = null;

        if ( logId ) {
            targetLog = await prisma.dailyLog.findFirst({
                where: { id: logId, userId }
            });
            if ( !targetLog ) {
                return res.status( 404 ).json({
                    success: false,
                    message: 'Daily log not found'
                });
            }
        } else {
            const activeCycle = await prisma.cycle.findFirst({
                where: {
                    userId,
                    isActive: true,
                    endDate: { gte: new Date() }
                },
                orderBy: { createdAt: 'desc' }
            });

            if ( activeCycle ) {
                const dateObj = resolveTargetDate(targetDate === 'tomorrow' ? 'tomorrow' : 'today');
                const { startOfDay, endOfDay } = getUtcDayBounds(dateObj);

                targetLog = await prisma.dailyLog.findFirst({
                    where: {
                        userId,
                        cycleId: activeCycle.id,
                        date: {
                            gte: startOfDay,
                            lte: endOfDay
                        }
                    }
                });

                if ( !targetLog ) {
                    targetLog = await prisma.dailyLog.create({
                        data: {
                            userId,
                            cycleId: activeCycle.id,
                            date: dateObj,
                            isClosed: false
                        }
                    });
                }
            } else {
                targetLog = await prisma.dailyLog.findFirst({
                    where: { userId },
                    orderBy: { date: 'desc' }
                });
            }
        }

        if ( !targetLog ) {
            return res.status( 400 ).json({
                success: false,
                message: 'No daily log found to associate the action with'
            });
        }

        if ( targetLog.isClosed ) {
            return res.status( 400 ).json({
                success: false,
                message: 'Cannot add or modify actions on a closed day'
            });
        }

        const existingAction = await prisma.plannedAction.findFirst({
            where: {
                userId,
                logId: targetLog.id,
                categoryId: trimmedCategoryId
            }
        });

        const action = existingAction
            ? await prisma.plannedAction.update({
                  where: { id: existingAction.id },
                  data: { description: trimmedDescription }
              })
            : await prisma.plannedAction.create({
                  data: {
                      userId,
                      logId: targetLog.id,
                      categoryId: trimmedCategoryId,
                      description: trimmedDescription
                  }
              });

        return res.status( 201 ).json({
            success: true,
            message: 'Action created successfully',
            data: action
        });
    } catch ( error ) {
        logger.error( `Error creating action: ${(error as Error).message}` );
        return res.status( 500 ).json({
            success: false,
            message: 'Error creating action'
        });
    }
};

export const updateAction = async ( req: Request, res: Response ) => {
    try {
        const { userId } = req;
        if ( !userId ) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const id = req.params.id as string;
        const { description, isCompleted } = req.body ?? {};

        const existing = await prisma.plannedAction.findFirst({
            where: { id, userId },
            include: { dailyLog: true }
        });

        if ( !existing ) {
            return res.status( 404 ).json({
                success: false,
                message: 'Action not found'
            });
        }

        if ( existing.dailyLog.isClosed ) {
            return res.status( 400 ).json({
                success: false,
                message: 'Cannot modify action on a closed day'
            });
        }

        const updateData: { description?: string; isCompleted?: boolean } = {};

        if ( description !== undefined ) {
            if ( typeof description !== 'string' || !description.trim() ) {
                return res.status( 400 ).json({
                    success: false,
                    message: 'Description cannot be empty'
                });
            }
            updateData.description = description.trim();
        }

        if ( isCompleted !== undefined ) {
            if ( typeof isCompleted !== 'boolean' ) {
                return res.status( 400 ).json({
                    success: false,
                    message: 'isCompleted must be a boolean'
                });
            }
            updateData.isCompleted = isCompleted;
        }

        if ( Object.keys(updateData).length === 0 ) {
            return res.status( 400 ).json({
                success: false,
                message: 'No valid update fields provided'
            });
        }

        const action = await prisma.plannedAction.update({
            where: { id },
            data: updateData
        });

        return res.status( 200 ).json({
            success: true,
            message: 'Action updated successfully',
            data: action
        });
    } catch ( error ) {
        logger.error(`Error updating action: ${(error as Error).message}`);
        return res.status( 500 ).json({
            success: false,
            message: 'Error updating action'
        });
    }
};

export const toggleActionStatus = updateAction;

export const deleteAction = async ( req: Request, res: Response ) => {
    try {
        const { userId } = req;
        if ( !userId ) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        const id = req.params.id as string;

        const existing = await prisma.plannedAction.findFirst({
            where: { id, userId },
            include: { dailyLog: true }
        });

        if ( !existing ) {
            return res.status( 404 ).json({
                success: false,
                message: 'Action not found'
            });
        }

        if ( existing.dailyLog.isClosed ) {
            return res.status( 400 ).json({
                success: false,
                message: 'Cannot delete action on a closed day'
            });
        }

        await prisma.plannedAction.delete({
            where: { id }
        });

        return res.status( 200 ).json({
            success: true,
            message: 'Action deleted successfully',
            data: { id }
        });
    } catch ( error ) {
        logger.error(`Error deleting action: ${(error as Error).message}`);
        return res.status( 500 ).json({
            success: false,
            message: 'Error deleting action'
        });
    }
};