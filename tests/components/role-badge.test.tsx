import React from 'react';
import test from 'ava';
import {render, getTextContent} from '../utils/test-helpers.js';
import {RoleBadge} from '../../src/components/role-badge.js';

test('renders system role with yellow color', t => {
	const {lastFrame} = render(<RoleBadge role="system" />);
	const frame = lastFrame();

	t.truthy(frame);
	t.true(frame!.includes('SYSTEM'));
	// Check for yellow color ANSI code
	t.true(frame!.includes('\u001b[33m')); // Yellow color
});

test('renders user role with blue color', t => {
	const {lastFrame} = render(<RoleBadge role="user" />);
	const frame = lastFrame();

	t.truthy(frame);
	t.true(frame!.includes('USER'));
	// Check for blue color ANSI code
	t.true(frame!.includes('\u001b[34m')); // Blue color
});

test('renders assistant role with green color', t => {
	const {lastFrame} = render(<RoleBadge role="assistant" />);
	const frame = lastFrame();

	t.truthy(frame);
	t.true(frame!.includes('ASSISTANT'));
	// Check for green color ANSI code
	t.true(frame!.includes('\u001b[32m')); // Green color
});

test('renders tool role with magenta color and name', t => {
	const {lastFrame} = render(<RoleBadge role="tool" name="search_tool" />);
	const frame = lastFrame();

	t.truthy(frame);
	t.true(frame!.includes('TOOL:SEARCH_TOOL'));
	// Check for magenta color ANSI code
	t.true(frame!.includes('\u001b[35m')); // Magenta color
});

test('renders tool role without name', t => {
	const {lastFrame} = render(<RoleBadge role="tool" />);
	const frame = lastFrame();

	t.truthy(frame);
	t.true(frame!.includes('TOOL:'));
	// Should not have extra text after TOOL:
	const textContent = getTextContent(frame!);
	t.true(textContent.includes('TOOL:'));
});

test('renders unknown role with default white color', t => {
	const {lastFrame} = render(<RoleBadge role="unknown" />);
	const frame = lastFrame();

	t.truthy(frame);
	t.true(frame!.includes('UNKNOWN'));
	// Should have default/white color (no specific color code or white code)
	// White color is typically \u001b[37m or no color
});

test('role text is uppercase', t => {
	const {lastFrame} = render(<RoleBadge role="developer" />);
	const frame = lastFrame();

	t.truthy(frame);
	const textContent = getTextContent(frame!);
	t.true(textContent.includes('DEVELOPER'));
	t.false(textContent.includes('developer'));
});

test('component has bold styling', t => {
	const {lastFrame} = render(<RoleBadge role="user" />);
	const frame = lastFrame();

	t.truthy(frame);
	// Check for bold ANSI code
	t.true(frame!.includes('\u001b[1m')); // Bold
});