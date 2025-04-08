import fs from 'fs';
import path from 'path';
import {Message} from '../types.js';
import {logger} from '../logger.js';

const SESSION_FILE = 'session.jsonl';

/**
 * Appends a message to the session JSONL file
 * @param message The message to append
 */
export const logMessageToSession = (message: any): void => {
	try {
		// Convert message to JSON line
		const jsonLine = JSON.stringify(message) + '\n';

		// Append to file
		fs.appendFileSync(path.resolve(process.cwd(), SESSION_FILE), jsonLine);

		logger.info(`Message logged to session file: ${message.role}`);
	} catch (error) {
		logger.error('Failed to write message to session file:', error);
	}
};

/**
 * Logs multiple messages to the session file
 * @param messages Array of messages to log
 */
export const logMessagesToSession = (messages: Message[]): void => {
	messages.forEach(message => logMessageToSession(message));
};
