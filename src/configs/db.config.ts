import { registerAs } from '@nestjs/config';

export default registerAs('dbConfig', () => ({
  host: process.env.DATABASE_HOST || 'localhost',
  port: Number(process.env.DATABASE_PORT ?? 5432),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  name: process.env.DATABASE_NAME,
  synchronize: process.env.DATABASE_SYNC === 'true',
  autoLoadEntities: process.env.DATABASE_AUTOLOAD === 'true',
  runMigrations: process.env.DATABASE_RUN_MIGRATIONS === 'true',
}));
