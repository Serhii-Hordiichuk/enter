/** Local in-browser AI through WebLLM and WebGPU. */
import type { ChatCompletionMessageParam, MLCEngine } from '@mlc-ai/web-llm';
import type { ChatMessage } from './apiClient';

export const DEFAULT_LOCAL_MODEL = 'Llama-3.2-1B-Instruct-q4f16_1-MLC';
export type LocalProgressHandler = (progress: number, status: string) => void;

let enginePromise: Promise<MLCEngine> | null = null;
let loadedModelId: string | null = null;

export function isLocalAiSupported(): boolean {
  return typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'gpu' in navigator;
}

function toWebLlmMessages(messages: ChatMessage[]): ChatCompletionMessageParam[] {
  return messages.map((message) => ({ role: message.role, content: message.content }) as ChatCompletionMessageParam);
}

async function getEngine(model: string, onProgress?: LocalProgressHandler): Promise<MLCEngine> {
  if (enginePromise && loadedModelId === model) return enginePromise;
  enginePromise = (async () => {
    const webLlm = await import('@mlc-ai/web-llm');
    const engine = await webLlm.CreateMLCEngine(model, {
      initProgressCallback: (report) => { try { onProgress?.(report.progress, report.text); } catch (error) { console.error('AI progress callback error:', error); } },
    });
    loadedModelId = model;
    return engine;
  })().catch((error) => { enginePromise = null; loadedModelId = null; console.error('Failed to load the local model:', error); throw error instanceof Error ? error : new Error('Failed to load the local model'); });
  return enginePromise;
}

export async function generateLocalResponse(messages: ChatMessage[], model: string = DEFAULT_LOCAL_MODEL, onProgress?: LocalProgressHandler): Promise<string> {
  try {
    if (!isLocalAiSupported()) throw new Error('WebGPU is unavailable in this browser. Enable WebGPU or switch to API mode.');
    const engine = await getEngine(model, onProgress);
    const response = await engine.chat.completions.create({ messages: toWebLlmMessages(messages), temperature: 0.7, max_tokens: 512 });
    const text = response.choices[0]?.message?.content;
    if (typeof text !== 'string' || text.length === 0) throw new Error('The local model returned an empty response');
    return text;
  } catch (error) {
    console.error('Local generation error:', error);
    throw error instanceof Error ? error : new Error('Local generation error');
  }
}

export async function unloadLocalModel(): Promise<void> {
  if (!enginePromise) return;
  try { (await enginePromise).unload(); } catch (error) { console.error('Failed to unload the local model:', error); } finally { enginePromise = null; loadedModelId = null; }
}
