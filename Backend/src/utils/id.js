import { randomUUID } from 'crypto';
export const genId = (prefix='') => (prefix ? `${prefix}-` : '') + randomUUID();
