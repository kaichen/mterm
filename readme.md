# mterm

A modern terminal interface for chatting with AI models.

## Features

- Chat with OpenAI and Anthropic models directly from your terminal
- Browse available models
- Modern terminal UI built with [Ink](https://github.com/vadimdemedes/ink)
- Full Model Context Protocol integration

## Install

```bash
$ npm install --global mterm
```

## CLI

```
$ mterm --help

  Usage
    $ mterm [screen_name]

  Examples
    $ mterm chat
    $ mterm models
```

## Screens

- **Main Screen**: The default landing page with navigation options
- **Chat Screen**: Interact with AI models in a chat interface
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

# Build
$ npm run build
```

## Dependencies

- [Ink](https://github.com/vadimdemedes/ink) - React for CLI
- [Model Context Protocol](https://github.com/anthropics/model-context-protocol) - SDK for AI model interaction
- OpenAI and Anthropic SDKs