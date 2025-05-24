import React from 'react';
import {render as inkRender} from 'ink-testing-library';

/**
 * Enhanced render function with common test utilities
 */
export function render(ui: React.ReactElement) {
	return inkRender(ui);
}

/**
 * Helper to extract text content from Ink component output
 */
export function getTextContent(frame: string): string {
	// Remove ANSI escape codes for easier testing
	return frame.replace(/\u001b\[[0-9;]*m/g, '');
}

/**
 * Helper to check if text is colored with specific ANSI codes
 */
export function hasColor(frame: string, colorCode: string): boolean {
	return frame.includes(`\u001b[${colorCode}m`);
}

/**
 * Mock process.stdout for terminal size testing
 */
export function mockProcessStdout(
	columns = 80,
	rows = 24,
): {restore: () => void} {
	const originalColumns = process.stdout.columns;
	const originalRows = process.stdout.rows;
	const originalOn = process.stdout.on;
	const originalOff = process.stdout.off;

	process.stdout.columns = columns;
	process.stdout.rows = rows;

	const listeners = new Map();

	// Mock the event listener functions
	process.stdout.on = ((event: string, listener: any) => {
		listeners.set(event, listener);
		return process.stdout;
	}) as any;

	process.stdout.off = ((event: string, listener: any) => {
		listeners.delete(event);
		return process.stdout;
	}) as any;

	return {
		restore: () => {
			process.stdout.columns = originalColumns;
			process.stdout.rows = originalRows;
			process.stdout.on = originalOn;
			process.stdout.off = originalOff;
		},
	};
}