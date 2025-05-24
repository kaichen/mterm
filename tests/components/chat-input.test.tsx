import React from 'react';
import test from 'ava';
import {render, getTextContent} from '../utils/test-helpers.js';
import {ChatInput} from '../../src/components/chat-input.jsx';

test('renders input text with prompt symbol', t => {
	const input = 'Hello, how can I help you?';
	const {lastFrame} = render(<ChatInput input={input} />);
	const frame = lastFrame();

	t.truthy(frame);
	const textContent = getTextContent(frame!);
	t.true(textContent.includes('> Hello, how can I help you?'));
});

test('renders empty input with prompt symbol', t => {
	const {lastFrame} = render(<ChatInput input="" />);
	const frame = lastFrame();

	t.truthy(frame);
	const textContent = getTextContent(frame!);
	t.true(textContent.includes('> '));
});

test('renders multi-line input correctly', t => {
	const multiLineInput = 'Line 1\nLine 2\nLine 3';
	const {lastFrame} = render(<ChatInput input={multiLineInput} />);
	const frame = lastFrame();

	t.truthy(frame);
	const textContent = getTextContent(frame!);
	t.true(textContent.includes('> Line 1\nLine 2\nLine 3'));
});

test('renders special characters correctly', t => {
	const specialInput = 'Test with @#$%^&*(){}[]|\\:";\'<>?,./ characters';
	const {lastFrame} = render(<ChatInput input={specialInput} />);
	const frame = lastFrame();

	t.truthy(frame);
	const textContent = getTextContent(frame!);
	t.true(textContent.includes('> Test with @#$%^&*(){}[]|\\:";\'<>?,./ characters'));
});

test('renders long input text', t => {
	const longInput = 'This is a very long input text that might wrap across multiple lines in the terminal display and should be handled correctly by the component';
	const {lastFrame} = render(<ChatInput input={longInput} />);
	const frame = lastFrame();

	t.truthy(frame);
	const textContent = getTextContent(frame!);
	t.true(textContent.includes('> This is a very long input text'));
	t.true(textContent.includes('should be handled correctly by the component'));
});

test('prompt symbol is bold', t => {
	const {lastFrame} = render(<ChatInput input="test" />);
	const frame = lastFrame();

	t.truthy(frame);
	// Check for bold ANSI code applied to the prompt
	t.true(frame!.includes('\u001b[1m')); // Bold
});

test('renders unicode and emoji correctly', t => {
	const unicodeInput = 'Hello 👋 world 🌍 with unicode ñáéíóú';
	const {lastFrame} = render(<ChatInput input={unicodeInput} />);
	const frame = lastFrame();

	t.truthy(frame);
	const textContent = getTextContent(frame!);
	t.true(textContent.includes('> Hello 👋 world 🌍 with unicode ñáéíóú'));
});