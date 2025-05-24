import React from 'react';
import test from 'ava';
import {render, getTextContent} from '../utils/test-helpers.js';
import {AlertError} from '../../src/components/alert-error.jsx';

test('renders nothing when error is null', t => {
	const {lastFrame} = render(<AlertError error={null} />);
	const frame = lastFrame();

	// Should render nothing/empty
	t.is(frame, '');
});

test('renders string error correctly', t => {
	const errorMessage = 'Something went wrong';
	const {lastFrame} = render(<AlertError error={errorMessage} />);
	const frame = lastFrame();

	t.truthy(frame);
	const textContent = getTextContent(frame!);
	t.true(textContent.includes('Error: Something went wrong'));
});

test('renders Error object correctly', t => {
	const error = new Error('Network connection failed');
	const {lastFrame} = render(<AlertError error={error} />);
	const frame = lastFrame();

	t.truthy(frame);
	const textContent = getTextContent(frame!);
	t.true(textContent.includes('Error: Network connection failed'));
});

test('displays error text in red color', t => {
	const {lastFrame} = render(<AlertError error="Test error" />);
	const frame = lastFrame();

	t.truthy(frame);
	// Check for red color ANSI code
	t.true(frame!.includes('\u001b[31m')); // Red color
});

test('renders empty string error', t => {
	const {lastFrame} = render(<AlertError error="" />);
	const frame = lastFrame();

	t.truthy(frame);
	const textContent = getTextContent(frame!);
	t.true(textContent.includes('Error: '));
});

test('renders complex error message', t => {
	const complexError = 'Connection failed: timeout after 5000ms. Check your network connection.';
	const {lastFrame} = render(<AlertError error={complexError} />);
	const frame = lastFrame();

	t.truthy(frame);
	const textContent = getTextContent(frame!);
	t.true(textContent.includes('Error: Connection failed: timeout after 5000ms. Check your network connection.'));
});

test('renders Error with custom message', t => {
	const error = new Error('Custom error message');
	error.message = 'Modified error message';
	const {lastFrame} = render(<AlertError error={error} />);
	const frame = lastFrame();

	t.truthy(frame);
	const textContent = getTextContent(frame!);
	t.true(textContent.includes('Error: Modified error message'));
});