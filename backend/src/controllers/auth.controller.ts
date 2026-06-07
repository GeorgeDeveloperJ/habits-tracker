import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { hash, compare } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import logger from '../config/logger';

export const register = async ( req: Request, res: Response ) => {
    try {
        const { email, password } = req.body;
        if ( ! ( email && password )) {
            return res.status( 400 ).json({
                success: false,
                message: 'Email and password are required.'
            });
        }

        const checkEmail = await prisma.user.findUnique({ where: { email } });
        if ( checkEmail ) {
            return res.status( 400 ).json({
                success: false,
                message: 'User already exists.'
            });
        }

        const hashedPassword = await hash(password, 10);
        const user = await prisma.user.create({ data: { email, hashedPassword }})
        
        res.status( 201 ).json({
            success: true,
            message: 'User created succesfully',
            data: { id: user.id, email: user.email }
        })
    } catch ( error ) {
        logger.error( `Error registering user: ${(error as Error).message}` );
        res.status ( 500 ).json({
            success: false,
            message: 'Error registering'
        })
    }
}

export const login = async ( req: Request, res: Response ) => {
    try {
        const { email, password } = req.body;
        if ( ! ( email && password )) {
            return res.status( 400 ).json({
                success: false,
                message: 'Email and password are required.'
            });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if ( !user ) {
            return res.status( 401 ).json({
                success: false,
                message: 'Invalid credentials'
            })
        }

        const isMatch = await compare(password, user.hashedPassword);
        if ( !isMatch ) {
            return res.status( 401 ).json({
                success: false,
                message: 'Invalid credentials'
            })
        }

        const token = sign({ id: user.id }, process.env.JWT_SECRET as string, { expiresIn: '7d' });

        return res.status( 200 ).json({
            success: true,
            message: 'Login succesful',
            data: { token, email }
        })

    } catch (error) {
    logger.error(`Error logging in user: ${(error as Error).message}`);
    res.status(500).json({
        success: false,
        message: 'Error logging in'
    });
    }
}