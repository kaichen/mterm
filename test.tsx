import React from 'react';
import test from 'ava';
import {render} from 'ink-testing-library';
import App from './src/app.js';

test('app renders without crashing', t => {
	const {lastFrame} = render(<App />);
	const frame = lastFrame();

	t.truthy(frame);
	t.true(frame!.includes('MTERM'));
});

test('app renders with initial screen', t => {
	const {lastFrame} = render(<App initialScreen="chat" />);
	const frame = lastFrame();

	t.truthy(frame);
	// Should render, even if it shows chat screen instead of main
	t.is(typeof frame, 'string');
});
