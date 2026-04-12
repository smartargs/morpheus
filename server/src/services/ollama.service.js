import OpenAI from 'openai';

let ollamaClient = null;
let cachedBaseURL = null;

export function getOllamaClient(baseURL) {
  if (!ollamaClient || cachedBaseURL !== baseURL) {
    ollamaClient = new OpenAI({
      baseURL: baseURL + '/v1',
      apiKey: 'ollama',
    });
    cachedBaseURL = baseURL;
  }
  return ollamaClient;
}

/**
 * Convert Anthropic tool format to OpenAI function-calling format.
 */
export function convertToolsToOpenAI(tools) {
  return tools.map((t) => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description || '',
      parameters: t.input_schema || { type: 'object', properties: {} },
    },
  }));
}

/**
 * Convert Anthropic-format conversation history to OpenAI messages.
 */
export function convertMessagesToOpenAI(messages, systemPrompt) {
  const result = [{ role: 'system', content: systemPrompt }];

  for (const msg of messages) {
    if (msg.role === 'user') {
      // String content passes through directly
      if (typeof msg.content === 'string') {
        result.push({ role: 'user', content: msg.content });
      } else if (Array.isArray(msg.content)) {
        // Array content: could be tool_result blocks or mixed content
        for (const block of msg.content) {
          if (block.type === 'tool_result') {
            result.push({
              role: 'tool',
              tool_call_id: block.tool_use_id,
              content: typeof block.content === 'string' ? block.content : JSON.stringify(block.content),
            });
          } else if (block.type === 'text') {
            result.push({ role: 'user', content: block.text });
          }
        }
      }
    } else if (msg.role === 'assistant') {
      if (typeof msg.content === 'string') {
        result.push({ role: 'assistant', content: msg.content });
      } else if (Array.isArray(msg.content)) {
        const textParts = [];
        const toolCalls = [];

        for (const block of msg.content) {
          if (block.type === 'text') {
            textParts.push(block.text);
          } else if (block.type === 'tool_use') {
            toolCalls.push({
              id: block.id,
              type: 'function',
              function: {
                name: block.name,
                arguments: JSON.stringify(block.input),
              },
            });
          }
        }

        const assistantMsg = { role: 'assistant' };
        assistantMsg.content = textParts.join('\n') || null;
        if (toolCalls.length > 0) {
          assistantMsg.tool_calls = toolCalls;
        }
        result.push(assistantMsg);
      }
    }
  }

  return result;
}

/**
 * Normalize OpenAI response to Anthropic-like shape for the agent loop.
 */
export function parseOllamaResponse(response) {
  const choice = response.choices[0];
  const message = choice.message;
  const content = [];

  if (message.content) {
    content.push({ type: 'text', text: message.content });
  }

  if (message.tool_calls && message.tool_calls.length > 0) {
    for (const tc of message.tool_calls) {
      let input = {};
      try {
        input = JSON.parse(tc.function.arguments);
      } catch {
        input = { _parse_error: `Failed to parse tool arguments: ${tc.function.arguments}` };
      }
      content.push({
        type: 'tool_use',
        id: tc.id,
        name: tc.function.name,
        input,
      });
    }
  }

  // Map OpenAI finish_reason to Anthropic stop_reason
  const stopReasonMap = { stop: 'end_turn', tool_calls: 'tool_use', length: 'max_tokens' };
  const stop_reason = stopReasonMap[choice.finish_reason] || 'end_turn';

  return { content, stop_reason, model: response.model };
}

/**
 * Fetch available models from Ollama instance.
 */
export async function fetchOllamaModels(baseURL) {
  const res = await fetch(`${baseURL}/api/tags`);
  if (!res.ok) throw new Error(`Ollama returned ${res.status}`);
  const data = await res.json();
  return (data.models || []).map((m) => ({
    id: `ollama:${m.name}`,
    name: m.name,
    size: m.size,
    parameter_size: m.details?.parameter_size,
  }));
}
