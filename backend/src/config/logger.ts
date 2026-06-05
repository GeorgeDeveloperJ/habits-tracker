import winston, { format } from 'winston';
const { combine, timestamp, printf, colorize } = format;

const myFormat = printf(({ level, message, timestamp }) => {
    return `[${level}] ${timestamp}: ${message}`;
});

const logger = winston.createLogger({
    level: 'info',
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        myFormat,
    ),

    transports: [
        new winston.transports.Console({
            format: combine(
                colorize({ all: true }),
                myFormat
            )
        })
    ]
})

export default logger;