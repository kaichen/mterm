import pino from 'pino';

// ref: https://github.com/pinojs/pino/issues/2120
// @ts-ignore
export const logger = pino(pino.destination('dev.log'));
