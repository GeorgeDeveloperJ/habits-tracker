import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';
import logger from '../config/logger';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export const authMiddleware = async ( req: Request, res: Response, next: NextFunction ) => {
    try {
        const authHeader = req.headers.authorization;
        if ( !authHeader || (!authHeader.startsWith("Bearer ")) ) {
            return res.status( 401 ).json({
                success: false,
                message: 'Access denied'
            })
        }

        const token = authHeader.split(' ')[1];
        const payload = verify( token, process.env.JWT_SECRET as string ) as { id: string };
        
        req.userId = payload.id;
        next();

    } catch ( error ) {
        logger.error(`JWT Verification Failed: ${(error as Error).message}`);
        return res.status( 401 ).json({
            success: false,
            message: 'Invalid or expired token.'
        });
    }
}