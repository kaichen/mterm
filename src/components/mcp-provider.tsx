import React, {useEffect} from 'react';
import {useAtom} from 'jotai';
import {
	mcpClientsAtom,
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
	const [, setMcpClients] = useAtom(mcpClientsAtom);
	const [, setMcpTools] = useAtom(mcpToolsAtom);
	const [, setMcpError] = useAtom(mcpErrorAtom);
	const [mcpConnected, setMcpConnected] = useAtom(mcpConnectedAtom);
	const [currentScreen] = useAtom(currentScreenAtom);

	// Initialize MCP clients when entering chat mode
	useEffect(() => {
	if (currentScreen === 'chat' && !mcpConnected) {
		const connect = async () => {
		try {
			const {clients, tools} = await initializeMcpClient();
			setMcpClients(clients);
			setMcpTools(tools);
			setMcpConnected(true);
			logger.info(`MCP: Connected to ${clients.length} servers with ${tools.length} total tools`);
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			setMcpError(`Failed to initialize MCP clients: ${errorMessage}`);
			logger.error('MCP connection error:', error);
		}
		};

		connect();
	}

	// Clean up when leaving chat mode
	return () => {
		if (mcpConnected) {
		setMcpClients(clients => {
			// Close all client connections
			for (const clientWithTools of clients) {
			try {
				logger.info(`Closing MCP client connection for ${clientWithTools.id}`);
				clientWithTools.client.close();
			} catch (error) {
				logger.error(`Error closing MCP client for ${clientWithTools.id}:`, error);
			}
			}
			return [];
		});
		setMcpConnected(false);
		setMcpTools([]);
		}
	};
	}, [currentScreen, mcpConnected]);

	return <>{children}</>;
};