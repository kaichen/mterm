import {Box, Text} from 'ink';
import React from 'react';
export const RoleBadge = ({role, name}: {role: string; name?: string}) => {
	let color = 'white';
	let displayRole = role.toUpperCase();

	switch (role) {
		case 'system':
			color = 'yellow';
			break;
		case 'user':
			color = 'blue';
			break;
		case 'assistant':
			color = 'green';
			break;
		case 'tool':
			color = 'magenta';
			displayRole = `TOOL:${name?.toUpperCase() || ''}`;
			break;
	}

	return (
		<Box marginRight={1}>
			<Text color={color} bold>
				{displayRole}:
			</Text>
		</Box>
	);
};
