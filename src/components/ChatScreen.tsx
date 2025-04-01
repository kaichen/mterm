import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { ScrollArea } from './scrollarea.js';
import Spinner from 'ink-spinner';
import OpenAI from 'openai';

// Message type definition
interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatScreenProps {
  onExit: () => void;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ onExit }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'system',
      content: 'You are a helpful AI assistant. Be concise and clear in your responses.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle user input
  useInput((value, key) => {
    if (key.return) {
      if (input.trim() === '/exit') {
        onExit();
        return;
      }

      if (input.trim() === '') return;

      sendMessage(input);
      setInput('');
    } else if (key.backspace || key.delete) {
      setInput(prev => prev.slice(0, -1));
    } else if (key.escape) {
      setInput('');
    } else if (!key.ctrl && !key.meta && value.length > 0) {
      setInput(prev => prev + value);
    }
  });

  // Send message to OpenAI
  const sendMessage = async (content: string) => {
    try {
      setIsLoading(true);
      setError('');

      // Add user message to the chat
      const userMessage: Message = { role: 'user', content };
      setMessages(prev => [...prev, userMessage]);

      const apiKey = process.env['OPENAI_API_KEY'];
      if (!apiKey) {
        // Mock response for demo without API key
        setTimeout(() => {
          const mockResponse: Message = {
            role: 'assistant',
            content: 'This is a mock response because no API key was provided. In a real scenario, I would respond to your message: ' + content,
          };
          setMessages(prev => [...prev, mockResponse]);
          setIsLoading(false);
        }, 1000);
        return;
      }

      // Initialize OpenAI client
      const client = new OpenAI({
        apiKey,
      });

      // Send the request to OpenAI
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: messages.concat(userMessage),
      });

      // Add assistant response to the chat
      if (response.choices[0]?.message) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: response.choices[0].message.content || 'No response',
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Render role badge
  const RoleBadge = ({ role }: { role: string }) => {
    let color = 'white';
    switch (role) {
      case 'system':
        color = 'yellow';
        break;
      case 'user':
        color = 'blue';
        break;
      case 'assistant':
        color = 'green';
        break;
    }

    return (
      <Box marginRight={1}>
        <Text color={color} bold>
          {role.toUpperCase()}:
        </Text>
      </Box>
    );
  };

  return (
    <Box flexDirection="column" height={25}>
      <Box marginBottom={1}>
        <Text bold>
          Chat with OpenAI{' '}
          <Text color="gray">(Type '/exit' to return to main screen)</Text>
        </Text>
      </Box>

      {/* Chat messages */}
      <ScrollArea height={20}>
        <Box flexDirection="column">
          {messages
            .filter(msg => msg.role !== 'system')
            .map((message, index) => (
              <Box key={index} flexDirection="row" marginBottom={1}>
                <RoleBadge role={message.role} />
                <Text wrap="wrap">{message.content}</Text>
              </Box>
            ))}
          {isLoading && (
            <Box>
              <Text color="green">
                <Spinner type="dots" />
              </Text>
              <Text color="gray"> Thinking...</Text>
            </Box>
          )}
        </Box>
      </ScrollArea>

      {/* Error message */}
      {error && (
        <Box marginTop={1} marginBottom={1}>
          <Text color="red">Error: {error}</Text>
        </Box>
      )}

      {/* Input area */}
      <Box marginTop={1}>
        <Text bold>{'> '}</Text>
        <Text>{input}</Text>
      </Box>
    </Box>
  );
};

export default ChatScreen;