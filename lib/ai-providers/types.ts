export interface GenerateScriptParams {
  title: string;
  niche: string;
  tone?: string;
  targetDurationSeconds?: number;
  language?: string;
}

export interface ScriptResult {
  title: string;
  scriptText: string;
  estimatedDurationSeconds: number;
  keyTopics: string[];
  provider: string;
}

export interface GenerateVideoParams {
  scriptText: string;
  style?: string;
  aspectRatio?: '16:9' | '9:16' | '1:1';
}

export interface VideoResult {
  videoUrl: string;
  durationSeconds: number;
  status: 'COMPLETED' | 'PROCESSING';
  jobId: string;
  provider: string;
}

export interface GenerateThumbnailParams {
  title: string;
  niche?: string;
  prompt?: string;
}

export interface ThumbnailResult {
  thumbnailUrl: string;
  provider: string;
}

export interface AnalyzeTrendsParams {
  niche: string;
  language?: string;
}

export interface TrendTopic {
  title: string;
  score: number;
  reason: string;
}

export interface TrendAnalysisResult {
  niche: string;
  topics: TrendTopic[];
  provider: string;
}

export interface AIProviderAdapter {
  name: string;
  generateScript(params: GenerateScriptParams): Promise<ScriptResult>;
  generateVideo(params: GenerateVideoParams): Promise<VideoResult>;
  generateThumbnail(params: GenerateThumbnailParams): Promise<ThumbnailResult>;
  analyzeTrends(params: AnalyzeTrendsParams): Promise<TrendAnalysisResult>;
}
