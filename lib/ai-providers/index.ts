import { AIProviderAdapter } from './types';
import { HiggsfieldAdapter } from './higgsfield';

export * from './types';
export * from './higgsfield';

class AIIntegrationLayer {
  private activeProvider: AIProviderAdapter;
  private providers: Map<string, AIProviderAdapter> = new Map();

  constructor() {
    const higgsfield = new HiggsfieldAdapter();
    this.providers.set('higgsfield', higgsfield);
    // Higgsfield is our primary video & image engine as requested
    this.activeProvider = higgsfield;
  }

  public getProvider(name?: string): AIProviderAdapter {
    if (name && this.providers.has(name)) {
      return this.providers.get(name)!;
    }
    return this.activeProvider;
  }

  public setProvider(name: string): void {
    if (this.providers.has(name)) {
      this.activeProvider = this.providers.get(name)!;
    }
  }

  public async generateScript(params: Parameters<AIProviderAdapter['generateScript']>[0]) {
    return this.activeProvider.generateScript(params);
  }

  public async generateVideo(params: Parameters<AIProviderAdapter['generateVideo']>[0]) {
    return this.activeProvider.generateVideo(params);
  }

  public async generateThumbnail(params: Parameters<AIProviderAdapter['generateThumbnail']>[0]) {
    return this.activeProvider.generateThumbnail(params);
  }

  public async analyzeTrends(params: Parameters<AIProviderAdapter['analyzeTrends']>[0]) {
    return this.activeProvider.analyzeTrends(params);
  }
}

export const aiEngine = new AIIntegrationLayer();
