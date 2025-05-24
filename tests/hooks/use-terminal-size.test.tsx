import React from 'react';
import test from 'ava';
import {render} from '../utils/test-helpers.js';
import {useTerminalSize} from '../../src/hooks/use-terminal-size.js';
import {mockProcessStdout} from '../utils/test-helpers.js';
import {Box, Text} from 'ink';

// Test component that uses the hook and displays the values
const TestTerminalSizeComponent: React.FC = () => {
	const {columns, rows} = useTerminalSize();
	return (
		<Box>
			<Text>columns:{columns},rows:{rows}</Text>
		</Box>
	);
};

test('returns default terminal size', t => {
	const mock = mockProcessStdout(100, 30);

	const {lastFrame} = render(<TestTerminalSizeComponent />);
	const frame = lastFrame();

	t.truthy(frame);
	// Should return columns with padding subtracted
	t.true(frame!.includes('columns:80')); // 100 - 20 padding
	t.true(frame!.includes('rows:30'));

	mock.restore();
});

test('handles undefined process.stdout.columns', t => {
	const mock = mockProcessStdout(undefined as any, 25);

	const {lastFrame} = render(<TestTerminalSizeComponent />);
	const frame = lastFrame();

	t.truthy(frame);
	// Should fallback to 60 - 20 = 40 when columns is undefined
	t.true(frame!.includes('columns:40')); // 60 - 20 padding
	t.true(frame!.includes('rows:25'));

	mock.restore();
});

test('handles undefined process.stdout.rows', t => {
	const mock = mockProcessStdout(120, undefined as any);

	const {lastFrame} = render(<TestTerminalSizeComponent />);
	const frame = lastFrame();

	t.truthy(frame);
	t.true(frame!.includes('columns:100')); // 120 - 20 padding
	t.true(frame!.includes('rows:20')); // fallback value

	mock.restore();
});

test('handles both dimensions undefined', t => {
	const mock = mockProcessStdout(undefined as any, undefined as any);

	const {lastFrame} = render(<TestTerminalSizeComponent />);
	const frame = lastFrame();

	t.truthy(frame);
	t.true(frame!.includes('columns:40')); // 60 - 20 padding (fallback)
	t.true(frame!.includes('rows:20')); // fallback value

	mock.restore();
});

test('applies correct padding to columns', t => {
	const mock = mockProcessStdout(200, 50);

	const {lastFrame} = render(<TestTerminalSizeComponent />);
	const frame = lastFrame();

	t.truthy(frame);
	// Should subtract 20 from columns for padding
	t.true(frame!.includes('columns:180')); // 200 - 20
	t.true(frame!.includes('rows:50')); // no padding applied to rows

	mock.restore();
});

test('handles small terminal sizes', t => {
	const mock = mockProcessStdout(15, 5);

	const {lastFrame} = render(<TestTerminalSizeComponent />);
	const frame = lastFrame();

	t.truthy(frame);
	// Even with very small terminal, should apply padding
	t.true(frame!.includes('columns:-5')); // 15 - 20 = -5 (realistic edge case)
	t.true(frame!.includes('rows:5'));

	mock.restore();
});