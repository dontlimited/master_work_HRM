import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import morgan from 'morgan';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

import { errorHandler } from './middlewares/errorHandler';
import { requestRateLimiter } from './middlewares/rateLimiter';
import apiRouter from './routes';

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200
  })
);
app.use(helmet());
app.use(hpp());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.resolve(process.env.UPLOAD_DIR || './uploads')));
app.use(requestRateLimiter);

const swaggerDocument = YAML.load(path.resolve(__dirname, './swagger/openapi.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Disable caching for API responses to avoid 304 reuse across different users/queries
app.use('/api', (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

app.use('/api/v1', apiRouter);

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use(errorHandler);

export default app;


