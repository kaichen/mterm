import React from 'react';
import {Box, Text} from 'ink';

interface ChatInputProps {
	input: string;
}

export const ChatInput: React.FC<ChatInputProps> = ({input}) => {
	return (
		<Box marginTop={1}>
			<Text bold>{'> '}</Text>
			<Text>{input}</Text>
		</Box>
	);
};
