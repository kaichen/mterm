import {atom} from 'jotai';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import path from 'path';
import fs from 'fs';
import {logger} from '../logger.js';
import { FlatTool, Message, ToolCall, Tool } from '../types.js';

// Type for MCP server configuration
export interface McpServerConfig {
	command: string;
	args: string[];
	env?: Record<string, string>;
}

// Type for MCP servers configuration
export interface McpServersConfig {
	mcpServers: Record<string, McpServerConfig>;
}

// Type for storing both client and its tools
export interface McpClientWithTools {
	id: string; // Server ID
	client: Client;
	tools: FlatTool[];
}

// Atom for storing multiple MCP clients
export const mcpClientsAtom = atom<McpClientWithTools[]>([]);

// Store for MCP server configurations
export const mcpServersConfigAtom = atom<Record<string, McpServerConfig>>({});

// Store for all available MCP tools (from all servers)
export const mcpToolsAtom = atom<Array<FlatTool>>([]);

// Error state for MCP
export const mcpErrorAtom = atom<string>('');

// Connection status
export const mcpConnectedAtom = atom<boolean>(false);

// Load MCP server configurations from mcp.json
export const loadMcpServersConfig = (): Record<string, McpServerConfig> => {
	try {
	const configPath = path.resolve(process.cwd(), 'mcp.json');
	logger.info(`Loading MCP config from: ${configPath}`);
	
	if (!fs.existsSync(configPath)) {
		logger.warn('mcp.json not found, using default memory server only');
		return {
		memory: {
			command: 'npx',
			args: ['-y', '@modelcontextprotocol/server-memory'],
		},
		};
	}
	
	const configContent = fs.readFileSync(configPath, 'utf-8');
	const config = JSON.parse(configContent) as McpServersConfig;
	
	if (!config.mcpServers || Object.keys(config.mcpServers).length === 0) {
		logger.warn('No MCP servers found in config, using default memory server');
		return {
		memory: {
			command: 'npx',
			args: ['-y', '@modelcontextprotocol/server-memory'],
		},
		};
	}
	
	logger.info(`Loaded ${Object.keys(config.mcpServers).length} MCP servers from config`);
	return config.mcpServers;
	} catch (error) {
	logger.error('Error loading MCP config:', error);
	// Fall back to default configuration
	return {
		memory: {
		command: 'npx',
		args: ['-y', '@modelcontextprotocol/server-memory'],
		},
	};
	}
};

// Initialize MCP clients from configuration
export const initializeMcpClient = async () => {
	try {
	logger.info('Initializing MCP clients...');
	
	// Load server configurations
	const serversConfig = loadMcpServersConfig();
	
	// Array to hold all clients and their tools
	const clientsWithTools: McpClientWithTools[] = [];
	const allTools: FlatTool[] = [];
	
	// Initialize each client
	for (const [serverId, serverConfig] of Object.entries(serversConfig)) {
		try {
		logger.info(`Initializing MCP client for ${serverId}...`);
		
		// Create client transport
		const transport = new StdioClientTransport({
			command: serverConfig.command,
			args: serverConfig.args,
			env: serverConfig.env,
		});
		
		// Create client
		const client = new Client({
			name: `mterm-mcp-client-${serverId}`,
			version: '1.0.0',
		});
		
		await client.connect(transport);
		
		// Get tools from server
		const toolsResult = await client.listTools();
		const tools = toolsResult.tools.map(tool => ({
			name: tool.name,
			description: tool.description || `Tool from ${serverId}`,
			inputSchema: tool.inputSchema,
			serverId, // Add serverId to track which server this tool belongs to
		}));
		
		clientsWithTools.push({
			id: serverId,
			client,
			tools,
		});
		
		// Add tools to the combined list
		allTools.push(...tools);
		
		logger.info(`MCP client for ${serverId} initialized with ${tools.length} tools`);
		} catch (error) {
		logger.error(`Failed to initialize MCP client for ${serverId}:`, error);
		// Continue with other servers even if one fails
		}
	}
	
	if (clientsWithTools.length === 0) {
		throw new Error('Failed to initialize any MCP clients');
	}
	
	return {
		clients: clientsWithTools,
		tools: allTools,
	};
	} catch (error) {
	logger.error('Failed to initialize MCP clients:', error);
	throw error;
	}
};

// Function to call an MCP tool on the appropriate server
export const callMcpTool = async (
	clients: McpClientWithTools[],
	allTools: FlatTool[],
	name: string,
	args: Record<string, any>,
) => {
	// Find the tool to determine which server it belongs to
	const tool = allTools.find(t => t.name === name);
	if (!tool) {
	throw new Error(`Tool not found: ${name}`);
	}
	
	// Find the client for this tool
	const clientWithTools = clients.find(c => c.id === tool.serverId);
	if (!clientWithTools) {
	throw new Error(`Server not found for tool: ${name}`);
	}
	
	try {
	const result = await clientWithTools.client.callTool({
		name,
		arguments: args,
	});
	
	// Format the result
	return (result.content as Array<{type: string; text?: string}>).map(item => {
		if (item.type === 'text') {
		return item.text;
		}
		return JSON.stringify(item);
	}).join('\n');
	} catch (error) {
	logger.error(`Error calling MCP tool ${name}:`, error);
	throw error;
	}
};

export const handleToolCalls = async (clients: McpClientWithTools[], allTools: FlatTool[], toolCalls: ToolCall[]) => {
	const toolResults: Message[] = [];
	
	for (const toolCall of toolCalls) {
	try {
		const args = JSON.parse(toolCall.function.arguments);
		
		// Check if the tool exists in any of our MCP servers
		const toolExists = allTools.some(tool => tool.name === toolCall.function.name);
		
		if (clients.length > 0 && toolExists) {
		try {
			logger.info(`Calling MCP tool: ${toolCall.function.name} with args: ${JSON.stringify(args)}`);
			const mcpResult = await callMcpTool(clients, allTools, toolCall.function.name, args);
			toolResults.push({
			role: 'tool',
			tool_call_id: toolCall.id,
			name: toolCall.function.name,
			content: mcpResult,
			});
		} catch (error) {
			logger.error(`Error calling MCP tool ${toolCall.function.name}:`, error);
			toolResults.push({
			role: 'tool',
			tool_call_id: toolCall.id,
			name: toolCall.function.name,
			content: JSON.stringify({
				error: `Error calling MCP tool: ${error instanceof Error ? error.message : 'Unknown error'}`,
			}),
			});
		}
		}
		// Tool not found
		else {
		toolResults.push({
			role: 'tool',
			tool_call_id: toolCall.id,
			name: toolCall.function.name,
			content: JSON.stringify({
			error: `Tool not found: ${toolCall.function.name}`,
			}),
		});
		}
	} catch (error) {
		toolResults.push({
		role: 'tool',
		tool_call_id: toolCall.id,
		name: toolCall.function.name,
		content: JSON.stringify({
			error: `Failed to parse arguments: ${error instanceof Error ? error.message : 'Unknown error'}`,
		}),
		});
	}
	}
	
	return toolResults;
};