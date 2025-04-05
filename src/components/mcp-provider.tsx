import React, {useEffect} from 'react';
import {useAtom} from 'jotai';
import {
	mcpClientAtom,
	mcpToolsAtom,
	mcpErrorAtom,
	mcpConnectedAtom,
	initializeMcpClient,
} from '../store/mcp.js';
import {currentScreenAtom} from '../store/ui.js';
import {logger} from '../logger.js';

interface McpProviderProps {
	children: React.ReactNode;
}

export const McpProvider: React.FC<McpProviderProps> = ({children}) => {
	const [, setMcpClient] = useAtom(mcpClientAtom);
	const [, setMcpTools] = useAtom(mcpToolsAtom);
	const [, setMcpError] = useAtom(mcpErrorAtom);
	const [mcpConnected, setMcpConnected] = useAtom(mcpConnectedAtom);
	const [currentScreen] = useAtom(currentScreenAtom);

	// Initialize MCP client when entering chat mode
	useEffect(() => {
		if (currentScreen === 'chat' && !mcpConnected) {
			const connect = async () => {
				try {
					const {client, tools} = await initializeMcpClient();
					setMcpClient(client);
					setMcpTools(tools);
					setMcpConnected(true);
					logger.info('MCP client connected successfully');
					logger.info('Available MCP tools:', tools);
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : 'Unknown error';
					setMcpError(`Failed to initialize MCP client: ${errorMessage}`);
					logger.error('MCP connection error:', error);
				}
			};

			connect();
		}

		// Clean up when leaving chat mode
		return () => {
			if (mcpConnected) {
				setMcpClient(client => {
					if (client) {
						logger.info('Closing MCP client connection');
						client.close();
					}
					return null;
				});
				setMcpConnected(false);
				setMcpTools([]);
			}
		};
	}, [currentScreen, mcpConnected]);

	return <>{children}</>;
};