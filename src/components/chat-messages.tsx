import React from 'react';
import {Box, Text} from 'ink';
import {Spinner} from '@inkjs/ui';
import {RoleBadge} from './role-badge.js';
import {AlertError} from './alert-error.js';
import {Message} from '../types.js';

interface ChatMessagesProps {
	messages: Message[];
	isLoading: boolean;
	error: string;
	mcpError: string | null;
	hideToolMessages: boolean;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({
	messages,
	isLoading,
	error,
	mcpError,
	hideToolMessages,
}) => {
	return (
		<Box flexDirection="column">
			<Box flexDirection="column">
				{messages
					.filter(
						msg =>
							msg.role !== 'developer' &&
							!(hideToolMessages && msg.role === 'tool'),
					)
					.map((message, index) => (
						<Box key={index} flexDirection="column" marginBottom={1}>
							<Box flexDirection="row">
								<RoleBadge role={message.role} name={message.name} />
								<Text wrap="wrap">{message.content}</Text>
							</Box>
							{message.tool_calls && (
								<Box flexDirection="column" marginLeft={2} marginTop={1}>
									{message.tool_calls.map((toolCall, i) => (
										<Box key={i} flexDirection="column" marginBottom={1}>
											<Box>
												<Text color="cyan" bold>
													Tool Call:{' '}
												</Text>
												<Text color="cyan">{toolCall.function.name}</Text>
											</Box>
											<Box marginLeft={2}>
												<Text color="gray" wrap="wrap">
													Args: {toolCall.function.arguments}
												</Text>
											</Box>
										</Box>
									))}
								</Box>
							)}
						</Box>
					))}
				{isLoading && (
					<Box>
						<Spinner type="dots" label="Thinking..." />
					</Box>
				)}
			</Box>

			<AlertError error={error} />
			<AlertError error={mcpError} />
		</Box>
	);
};
