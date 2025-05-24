# mterm

A modern terminal interface for chatting with AI models.

## Features

- Chat with OpenAI and Anthropic models directly from your terminal
- Browse available models
- Modern terminal UI built with [Ink](https://github.com/vadimdemedes/ink)
- Optional Model Context Protocol (MCP) integration for enhanced tool support

## Install

```bash
$ npm install --global mterm
```

## CLI

```
$ mterm --help

  Usage
    $ mterm [screen_name]

  Options
    --enable-mcp  Enable MCP (Model Context Protocol) support

  Examples
    $ mterm chat
    $ mterm models
    $ mterm --enable-mcp
    $ mterm chat --enable-mcp
```

## Model Context Protocol (MCP)

MCP support is **disabled by default**. To enable MCP functionality, use the `--enable-mcp` flag when starting mterm.

### Enabling MCP

```bash
# Enable MCP for the current session
$ mterm --enable-mcp

# Navigate directly to chat with MCP enabled
$ mterm chat --enable-mcp
```

### MCP Configuration

Create a `mcp.json` file in your project directory to configure MCP servers:

```json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "fetch": {
      "command": "uvx",
      "args": ["mcp-server-fetch"]
    }
  }
}
```

If no `mcp.json` file is found, mterm will use a default memory server configuration.

### Available MCP Servers

- **memory**: Persistent memory storage for conversations
- **fetch**: Web content fetching capabilities
- And many more community-developed servers

## Screens

- **Main Screen**: The default landing page with navigation options
- **Chat Screen**: Interact with AI models in a chat interface (MCP tools available when enabled)
- **Models Screen**: Browse and select available AI models

## Navigation

- Direct screen access: `mterm chat` or `mterm models`
- From main screen: Type `/chat` or `/models` to navigate
- From any screen: Press `Esc` to return to main screen

## Development

```bash
# Install dependencies
$ npm install

# Run in development mode
$ npm run dev

# Run with MCP enabled in development
$ npm run dev -- --enable-mcp

# Build
$ npm run build
```

## Dependencies

- [Ink](https://github.com/vadimdemedes/ink) - React for CLI
- [Model Context Protocol](https://github.com/anthropics/model-context-protocol) - SDK for AI model interaction
- OpenAI and Anthropic SDKs