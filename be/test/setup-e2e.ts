import 'reflect-metadata';
import { randomUUID } from 'node:crypto';

process.env.QUEUE_PREFIX = `e2e-${randomUUID().slice(0, 8)}`;
