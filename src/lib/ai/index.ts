import { AIProvider } from './types';
import { MockAIProvider } from './mockProvider';

// Singleton instance of the active AI Provider
const activeProvider: AIProvider = new MockAIProvider();

export function getAIProvider(): AIProvider {
  return activeProvider;
}

export * from './types';
export * from './mockProvider';
