import { Alert } from '@inkjs/ui';
import {Text} from 'ink';
import React from 'react';

export const AlertError = ({error}: {error: string | Error | null}) => {
	if (!error) return null;
	return (
		<Alert variant="error">
			<Text color="red">Error: {error instanceof Error ? error.message : error}</Text>
		</Alert>
	);
};
