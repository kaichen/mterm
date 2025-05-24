import React from 'react';
import test from 'ava';
import {render, getTextContent} from '../utils/test-helpers.js';
import App from '../../src/app.js';

test('renders main screen by default', t => {
	const {lastFrame} = render(<App />);
	const frame = lastFrame();

	t.truthy(frame);
	const textContent = getTextContent(frame!);
	t.true(textContent.includes('MTERM'));
	t.true(textContent.includes('Type /models to see available OpenAI models'));
	t.true(textContent.includes('Type /chat to start chatting with OpenAI'));
});

test('renders with initial chat screen', t => {
	const {lastFrame} = render(<App initialScreen="chat" />);
	const frame = lastFrame();

	t.truthy(frame);
	// Should render the chat screen instead of main
	const textContent = getTextContent(frame!);
	t.false(textContent.includes('MTERM')); // Main screen title should not appear
});

test('renders with initial models screen', t => {
	const {lastFrame} = render(<App initialScreen="models" />);
	const frame = lastFrame();

	t.truthy(frame);
	// Should render the models screen instead of main
	const textContent = getTextContent(frame!);
	t.false(textContent.includes('MTERM')); // Main screen title should not appear
});

test('ignores invalid initial screen and shows main', t => {
	const {lastFrame} = render(<App initialScreen="invalid" />);
	const frame = lastFrame();

	t.truthy(frame);
	const textContent = getTextContent(frame!);
	t.true(textContent.includes('MTERM')); // Should fallback to main screen
});

test('renders without MCP provider by default', t => {
	const {lastFrame} = render(<App />);
	const frame = lastFrame();

	t.truthy(frame);
	// Should render main content directly without MCP wrapper
	const textContent = getTextContent(frame!);
	t.true(textContent.includes('MTERM'));
});

test('renders with MCP provider when enabled', t => {
	const {lastFrame} = render(<App enableMcp={true} />);
	const frame = lastFrame();

	t.truthy(frame);
	// Should still render main content but wrapped in MCP provider
	const textContent = getTextContent(frame!);
	t.true(textContent.includes('MTERM'));
});

test('displays prompt symbol and help text', t => {
	const {lastFrame} = render(<App />);
	const frame = lastFrame();

	t.truthy(frame);
	const textContent = getTextContent(frame!);
	t.true(textContent.includes('> ')); // Input prompt
	t.true(textContent.includes('/models'));
	t.true(textContent.includes('/chat'));
});

test('displays colored text for commands in help', t => {
	const {lastFrame} = render(<App />);
	const frame = lastFrame();

	t.truthy(frame);
	// Check for green color ANSI code for /models and /chat commands
	t.true(frame!.includes('\u001b[32m')); // Green color
});