import {
  AIProviderAdapter,
  GenerateScriptParams,
  ScriptResult,
  GenerateVideoParams,
  VideoResult,
  GenerateThumbnailParams,
  ThumbnailResult,
  AnalyzeTrendsParams,
  TrendAnalysisResult,
} from './types';
import { resolveRuntimeKey } from '@/lib/admin/runtime-keys';

export class HiggsfieldAdapter implements AIProviderAdapter {
  name = 'Higgsfield AI';

  private async resolve(): Promise<{ apiKey?: string; apiBaseUrl: string }> {
    const apiKey = await resolveRuntimeKey('higgsfield', 'HIGGSFIELD_API_KEY');
    const apiBaseUrl =
      (await resolveRuntimeKey('higgsfield_url', 'HIGGSFIELD_API_URL')) ||
      'https://api.higgsfield.ai/v1';
    return { apiKey, apiBaseUrl };
  }

  /**
   * Generate an engaging video script using Higgsfield script engine.
   */
  async generateScript(params: GenerateScriptParams): Promise<ScriptResult> {
    const { apiKey, apiBaseUrl } = await this.resolve();
    if (apiKey) {
      try {
        const response = await fetch(`${apiBaseUrl}/script/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(params),
        });
        if (response.ok) {
          const data = await response.json();
          return {
            title: data.title || params.title,
            scriptText: data.script_text || data.scriptText,
            estimatedDurationSeconds: data.estimated_duration || 180,
            keyTopics: data.key_topics || ['AI', 'Tech', 'Strategy'],
            provider: this.name,
          };
        }
      } catch (err) {
        console.warn('[Higgsfield AI] Live API script call failed, falling back:', err);
      }
    }

    // Fallback response compliant with Higgsfield contract
    return {
      title: params.title,
      scriptText: `[HOOK]\nWelcome back! In today's video, we're diving deep into ${params.title}.\n\n[SECTION 1: THE FOUNDATION]\nFirst, let's explore why this trend matters and how top creators leverage AI automation.\n\n[OUTRO]\nDon't forget to like, subscribe, and hit the notification bell for daily insights!`,
      estimatedDurationSeconds: params.targetDurationSeconds || 300,
      keyTopics: [params.niche, 'AI Automation', 'Growth Strategy'],
      provider: `${this.name} (Fallback Mode)`,
    };
  }

  /**
   * Generate a video from script text using Higgsfield video engine.
   */
  async generateVideo(params: GenerateVideoParams): Promise<VideoResult> {
    const { apiKey, apiBaseUrl } = await this.resolve();
    if (!apiKey) {
      throw new Error('HIGGSFIELD_NOT_CONFIGURED: Video generation engine API key is not configured.');
    }

    try {
      const response = await fetch(`${apiBaseUrl}/video/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          prompt: params.scriptText,
          aspect_ratio: params.aspectRatio || '16:9',
          style: params.style || 'cinematic',
        }),
      });
      if (response.ok) {
        const data = await response.json();
        return {
          videoUrl: data.video_url || data.videoUrl,
          durationSeconds: data.duration || 60,
          status: 'COMPLETED',
          jobId: data.job_id || `hf_${Date.now()}`,
          provider: this.name,
        };
      }
      throw new Error(`Video API error: ${response.statusText}`);
    } catch (err) {
      console.error('[Higgsfield AI] Live API video call failed:', err);
      throw err;
    }
  }

  /**
   * Generate a thumbnail image using Higgsfield image generation.
   */
  async generateThumbnail(params: GenerateThumbnailParams): Promise<ThumbnailResult> {
    const { apiKey, apiBaseUrl } = await this.resolve();
    if (!apiKey) {
      throw new Error('HIGGSFIELD_NOT_CONFIGURED: Thumbnail generation engine API key is not configured.');
    }

    try {
      const response = await fetch(`${apiBaseUrl}/image/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          prompt: params.prompt || `High-CTR YouTube thumbnail for: ${params.title}`,
          aspect_ratio: '16:9',
        }),
      });
      if (response.ok) {
        const data = await response.json();
        return {
          thumbnailUrl: data.image_url || data.imageUrl,
          provider: this.name,
        };
      }
      throw new Error(`Thumbnail API error: ${response.statusText}`);
    } catch (err) {
      console.error('[Higgsfield AI] Live API thumbnail call failed:', err);
      throw err;
    }
  }

  /**
   * Analyze niche trends.
   */
  async analyzeTrends(params: AnalyzeTrendsParams): Promise<TrendAnalysisResult> {
    const { apiKey, apiBaseUrl } = await this.resolve();
    if (!apiKey) {
      return {
        niche: params.niche,
        topics: [],
        provider: this.name,
      };
    }

    try {
      const response = await fetch(`${apiBaseUrl}/trends/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(params),
      });
      if (response.ok) {
        const data = await response.json();
        return {
          niche: params.niche,
          topics: data.topics || [],
          provider: this.name,
        };
      }
    } catch (err) {
      console.error('[Higgsfield AI] Live API trend analysis call failed:', err);
    }

    return {
      niche: params.niche,
      topics: [],
      provider: this.name,
    };
  }
}
