import Anthropic from '@anthropic-ai/sdk';
import { callTool } from './mcp.service.js';
import { addMessage, addEvent } from './session.service.js';
import { getSelectedWallets } from './wallet.service.js';
import { CRITICAL_TOOLS } from '../config/constants.js';
import { LOCAL_TOOL_DEFINITIONS } from '../tools/definitions.js';
import { executeLocalTool } from '../tools/handlers.js';

let anthropic = null;

function getClient() {
  if (!anthropic) {
    anthropic = new Anthropic();
  }
  return anthropic;
}

function buildSystemPrompt(session) {
  const agentWallets = getSelectedWallets();
  const walletInfo =
    agentWallets.length > 0
      ? agentWallets
          .map((w) => `- ${w.label}: ${w.address}`)
          .join('\n')
      : 'No wallets selected. Ask the user to select a wallet on the Wallets page.';

  const customInstructions = session.settings.systemInstructions
    ? `\n\nUser Instructions:\n${session.settings.systemInstructions}`
    : '';

  const network = session.settings.network || 'testnet';

  console.log(`[LLM] Building system prompt | network: ${network} | wallets: ${agentWallets.length} | sessionId: ${session.id}`);

  return `You are Morpheus, an AI guide for the Neo N3 blockchain.

CURRENT ENVIRONMENT (always use these, ignore any previous values from conversation history):
- Network: ${network}
- Available wallets:
${walletInfo}

IMPORTANT: Always use the network and wallet addresses listed above. These are the user's CURRENT settings and override anything mentioned earlier in the conversation. When calling tools, use network="${network}". When performing wallet operations, ONLY use addresses from the list above. If the user doesn't specify which wallet, use the first available one.

Be concise and helpful. Explain what you're doing at each step. If an operation fails, explain why and suggest alternatives.${customInstructions}`;
}

export async function runAgentLoop(session, userMessage, mcpTools, emitEvent) {
  const client = getClient();

  addMessage(session.id, 'user', userMessage);
  const userEvent = addEvent(session.id, { type: 'user_message', content: userMessage });
  emitEvent(userEvent);

  // Combine MCP tools with local-only tools
  const tools = [
    ...mcpTools.map((t) => ({
      name: t.name,
      description: t.description || '',
      input_schema: t.inputSchema || { type: 'object', properties: {} },
    })),
    ...LOCAL_TOOL_DEFINITIONS
  ];

  const abortController = new AbortController();
  session.abortController = abortController;

  try {
    let continueLoop = true;

    while (continueLoop) {
      if (abortController.signal.aborted) {
        emitEvent({ type: 'agent_stopped', reason: 'User cancelled' });
        break;
      }

      emitEvent({ type: 'thinking' });

      const response = await client.messages.create(
        {
          model: session.settings.model || 'claude-sonnet-4-6',
          max_tokens: 4096,
          system: buildSystemPrompt(session),
          tools,
          messages: session.conversationHistory,
        },
        { signal: abortController.signal }
      );

      const assistantContent = response.content;
      addMessage(session.id, 'assistant', assistantContent);

      let hasToolUse = false;
      const toolResults = [];

      for (const block of assistantContent) {
        if (abortController.signal.aborted) break;

        if (block.type === 'text') {
          const textEvent = addEvent(session.id, {
            type: 'agent_message',
            content: block.text,
          });
          emitEvent(textEvent);
        } else if (block.type === 'tool_use') {
          hasToolUse = true;
          const isCritical = CRITICAL_TOOLS.has(block.name);
          const needsApproval =
            isCritical && session.settings.mode === 'supervised';

          // Override AI's network arg with the session's actual network for display accuracy
          const displayArgs = block.input?.network !== undefined
            ? { ...block.input, network: session.settings.network }
            : block.input;

          const toolCallEvent = addEvent(session.id, {
            type: 'tool_call',
            toolName: block.name,
            toolArgs: displayArgs,
            critical: isCritical,
            needsApproval,
          });
          emitEvent(toolCallEvent);

          if (needsApproval) {
            const approvalEvent = addEvent(session.id, {
              type: 'approval_needed',
              toolName: block.name,
              toolArgs: block.input,
              eventId: toolCallEvent.id,
            });
            emitEvent(approvalEvent);

            try {
              await new Promise((resolve, reject) => {
                session.pendingApproval = {
                  resolve,
                  reject,
                  eventId: toolCallEvent.id,
                  toolCall: block,
                };
              });
            } catch (err) {
              const rejectedEvent = addEvent(session.id, {
                type: 'approval_rejected',
                toolName: block.name,
                eventId: toolCallEvent.id,
              });
              emitEvent(rejectedEvent);

              toolResults.push({
                type: 'tool_result',
                tool_use_id: block.id,
                content: 'User rejected this action.',
              });
              continue;
            }
          }

          try {
            let resultText;
            let success = true;

            // Check if it's a local-only tool first
            const isLocalTool = LOCAL_TOOL_DEFINITIONS.some(t => t.name === block.name);

            if (isLocalTool) {
              const result = await executeLocalTool(block.name, block.input, session);
              resultText = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
              success = result.success !== false;
            } else {
              // Fallback to MCP tools
              const result = await callTool(block.name, block.input);
              resultText =
                result.content
                  ?.map((c) => (c.type === 'text' ? c.text : JSON.stringify(c)))
                  .join('\n') || JSON.stringify(result);
              success = !result.isError;
            }

            const resultEvent = addEvent(session.id, {
              type: 'tool_result',
              toolName: block.name,
              result: resultText,
              success: success,
              callEventId: toolCallEvent.id,
            });
            emitEvent(resultEvent);

            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: resultText,
            });
          } catch (err) {
            const errorEvent = addEvent(session.id, {
              type: 'tool_error',
              toolName: block.name,
              error: err.message,
              callEventId: toolCallEvent.id,
            });
            emitEvent(errorEvent);

            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: `Error: ${err.message}`,
              is_error: true,
            });
          }
        }
      }

      if (hasToolUse && toolResults.length > 0) {
        addMessage(session.id, 'user', toolResults);
        continueLoop = true;
      } else {
        continueLoop = false;
      }

      if (response.stop_reason === 'end_turn' && !hasToolUse) {
        continueLoop = false;
      }
    }
  } catch (err) {
    if (err.name === 'AbortError' || abortController.signal.aborted) {
      emitEvent(
        addEvent(session.id, {
          type: 'agent_stopped',
          reason: 'Cancelled by user',
        })
      );
    } else {
      emitEvent(
        addEvent(session.id, {
          type: 'error',
          error: err.message,
        })
      );
    }
  } finally {
    session.abortController = null;
    session.pendingApproval = null;
    emitEvent({ type: 'agent_done' });
  }
}
