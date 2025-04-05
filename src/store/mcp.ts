import {atom} from 'jotai';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import {logger} from '../logger.js';
import { FlatTool, Message, ToolCall, Tool } from '../types.js';

// Atom for MCP client instance
export const mcpClientAtom = atom<Client | null>(null);

// Store for available MCP tools
export const mcpToolsAtom = atom<Array<FlatTool>>([]);

// Error state for MCP
export const mcpErrorAtom = atom<string>('');

// Connection status
export const mcpConnectedAtom = atom<boolean>(false);

// Initialize MCP client with memory server
export const initializeMcpClient = async () => {
	try {
		logger.info('Initializing MCP client...');

		// Create client transport for memory server
		const transport = new StdioClientTransport({
			command: 'npx',
			args: ['-y', '@modelcontextprotocol/server-memory'],
		});

		// Create client
		const client = new Client({
			name: 'mterm-mcp-client',
			version: '1.0.0',
		});

		await client.connect(transport);

		// Get tools from server
		const tools = await client.listTools();

		return {
			client,
			tools: tools.tools.map(tool => ({
				name: tool.name,
				description: tool.description,
				inputSchema: tool.inputSchema,
			})),
		};
	} catch (error) {
		logger.error('Failed to initialize MCP client:' + JSON.stringify(error));
		throw error;
	}
};

// Function to call an MCP tool
export const callMcpTool = async (
	client: Client | null,
	name: string,
	args: Record<string, any>,
) => {
	if (!client) {
		throw new Error('MCP client not initialized');
	}
	try {
		const result = await client.callTool({
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
		logger.error(`Error calling MCP tool ${name}:` + JSON.stringify(error));
		throw error;
	}
};

export const handleToolCalls = async (mcpClient: Client | null, flatTools: FlatTool[], toolCalls: ToolCall[]) => {
	const toolResults: Message[] = [];

	for (const toolCall of toolCalls) {
		try {
			const args = JSON.parse(toolCall.function.arguments);

			if (mcpClient && flatTools.some((tool: {name: string}) => tool.name === toolCall.function.name)) {
				try {
					logger.info(`Calling MCP tool: ${toolCall.function.name} with args: ${JSON.stringify(args)}`);
					const mcpResult = await callMcpTool(mcpClient, toolCall.function.name, args);
					toolResults.push({
						role: 'tool',
						tool_call_id: toolCall.id,
						name: toolCall.function.name,
						content: mcpResult,
					});
				} catch (error) {
					logger.error(`Error calling MCP tool ${toolCall.function.name}:` + JSON.stringify(error));
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


// Available tools
export const availableTools: Tool[] = [
	{
		type: 'function',
		function: {
			name: 'get_weather',
			description: 'Get the current weather in a given location',
			parameters: {
				type: 'object',
				properties: {
					location: {
						type: 'string',
						description: 'The city and state, e.g. San Francisco, CA',
					},
				},
				required: ['location'],
			},
		},
	},
	// MCP tools will be dynamically added from mcpToolsAtom
];