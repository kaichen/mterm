export interface ToolCall {
	id: string;
	type: 'function';
	function: {
		name: string;
		arguments: string;
	};
}

// Define tool interface
export interface Tool {
	type: 'function';
	function: {
		name: string;
		description: string;
		parameters: Record<string, any>;
	};
}

export interface Message {
	role: 'system' | 'user' | 'assistant' | 'developer' | 'tool';
	content: string;
	name?: string;
	tool_calls?: ToolCall[];
	tool_call_id?: string;
}

export interface FlatTool {
	name: string;
	description?: string;
	inputSchema: any;
	serverId?: string; // ID of the server this tool belongs to
}
