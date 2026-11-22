import { execSync } from 'child_process';

console.log('Generating Prisma client...');
execSync('npx prisma generate', { stdio: 'inherit' });

console.log('Running migrations...');
execSync('npx prisma migrate deploy', { stdio: 'inherit' });

console.log('Seeding database...');
execSync('npx prisma db seed', { stdio: 'inherit' });

console.log('Starting server...');
execSync('npm run dev', { stdio: 'inherit' });