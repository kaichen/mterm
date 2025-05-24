import {describe, it, expect} from 'vitest';
import React from 'react';
import {render} from 'ink-testing-library';
import {RoleBadge} from '../../src/components/role-badge.js';

describe('RoleBadge Component', () => {
	it('should render system role with yellow color', () => {
		const {lastFrame} = render(<RoleBadge role="system" />);

		expect(lastFrame()).toContain('SYSTEM');
	});

	it('should render user role with blue color', () => {
		const {lastFrame} = render(<RoleBadge role="user" />);

		expect(lastFrame()).toContain('USER');
	});

	it('should render assistant role with green color', () => {
		const {lastFrame} = render(<RoleBadge role="assistant" />);

		expect(lastFrame()).toContain('ASSISTANT');
	});

	it('should render tool role with name', () => {
		const {lastFrame} = render(<RoleBadge role="tool" name="calculator" />);

		expect(lastFrame()).toContain('TOOL:CALCULATOR');
	});

	it('should render tool role without name', () => {
		const {lastFrame} = render(<RoleBadge role="tool" />);

		expect(lastFrame()).toContain('TOOL:');
	});

	it('should render unknown role in uppercase', () => {
		const {lastFrame} = render(<RoleBadge role="unknown" />);

		expect(lastFrame()).toContain('UNKNOWN');
	});
});
