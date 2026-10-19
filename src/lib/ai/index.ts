import { AIProvider } from './types';
import { MockAIProvider } from './mockProvider';
import { GroqAIProvider } from './groqProvider';

const mockProvider = new MockAIProvider();

// When GROQ_API_KEY is configured, AI work runs on Groq and quietly falls back
// to the local deterministic provider on any failure. Otherwise the local
// provider is used directly.
const activeProvider: AIProvider = process.env.GROQ_API_KEY
  ? new GroqAIProvider(mockProvider)
  : mockProvider;

export function getAIProvider(): AIProvider {
  return activeProvider;
}
