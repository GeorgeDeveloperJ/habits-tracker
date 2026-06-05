import { Request, Response } from 'express';
import { prisma } from '../config/db';
import logger from '../config/logger';

export const createAction = async ( req: Request, res: Response ) => {
    try {
        const { categoryId, description } = req.body;

        const getLog = await prisma.dailyLog.findFirst({
            orderBy: { createdAt: 'desc' }
        })
        if ( !getLog ) {
            return res.status( 400 ).json({
                success: false,
                message: 'No daily log found to associate the action with'
            })
        }

        const action = await prisma.plannedAction.create({
            data: {
                logId: getLog.id,
                categoryId: categoryId as string,
                description
            }
        })
        res.status( 201 ).json({
            success: true,
            message: 'Action created successfully',
            data: action
        })

    } catch ( error ) {
        logger.error( error );
        res.status ( 500 ).json({
            success: false,
            message: 'Error creating action'
        })
    }

} 

export const toggleActionStatus = async ( req: Request, res: Response ) => {
    try {
        const id = req.params.id as string;

        const { isCompleted } = req.body;

        const action = await prisma.plannedAction.update({
            where: { id },
            data: { isCompleted }
        })

        res.status( 200 ).json({
            success: true,
            message: 'Action updated successfully',
            data: action
        })
    } catch ( error ) {
        logger.error(`Error toggling action status: ${error as Error}.message`);
        res.status ( 500 ).json({
            success: false,
            message: 'Error updating action'
        })
    }
}