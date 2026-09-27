export interface ServiceKeyDef {
  key: string;
  label: string;
  envVar: string;
  category: 'ai' | 'media' | 'youtube' | 'research' | 'infra';
  categoryTitle: string;
  description: string;
  helpUrl: string;
  placeholder: string;
  required: boolean;
}

export const SERVICE_KEYS_DEF: ServiceKeyDef[] = [
  // 1. AI & security guardian
  {
    key: 'openai',
    label: 'AI key (OpenAI API Key)',
    envVar: 'OPENAI_API_KEY',
    category: 'ai',
    categoryTitle: 'AI & security guardian keys',
    description: 'The primary engine for generating video scripts, titles, and creative ideas, and for powering the security guardian chat and platform protection.',
    helpUrl: 'https://platform.openai.com/api-keys',
    placeholder: 'sk-proj-xxxxxxxxxxxxxxxxxxxx',
    required: true,
  },
  {
    key: 'anthropic',
    label: 'Claude key (Anthropic Claude API Key)',
    envVar: 'ANTHROPIC_API_KEY',
    category: 'ai',
    categoryTitle: 'AI & security guardian keys',
    description: 'An excellent alternative AI engine for long-form writing, translation, and deep analysis.',
    helpUrl: 'https://console.anthropic.com/settings/keys',
    placeholder: 'sk-ant-api03-xxxxxxxxxxxxxxxxxxxx',
    required: false,
  },
  {
    key: 'gemini',
    label: 'Google Gemini key (Gemini API Key)',
    envVar: 'GEMINI_API_KEY',
    category: 'ai',
    categoryTitle: 'AI & security guardian keys',
    description: 'Google\'s fast AI engine for data analysis, channel content scanning, and trend discovery.',
    helpUrl: 'https://aistudio.google.com/app/apikey',
    placeholder: 'AIzaSyxxxxxxxxxxxxxxxxxxxx',
    required: false,
  },

  // 2. Video & audio production
  {
    key: 'higgsfield',
    label: 'Higgsfield video production key (Higgsfield AI Key)',
    envVar: 'HIGGSFIELD_API_KEY',
    category: 'media',
    categoryTitle: 'Video & voice production (Video & Voice AI)',
    description: 'The Higgsfield engine for AI video generation and automatic thumbnail creation for your channel.',
    helpUrl: 'https://higgsfield.ai',
    placeholder: 'hf_live_xxxxxxxxxxxxxxxxxxxx',
    required: true,
  },
  {
    key: 'elevenlabs',
    label: 'Voice AI key (ElevenLabs Voice AI Key)',
    envVar: 'ELEVENLABS_API_KEY',
    category: 'media',
    categoryTitle: 'Video & voice production (Video & Voice AI)',
    description: 'Used to turn written scripts into natural, realistic human voiceover with studio quality.',
    helpUrl: 'https://elevenlabs.io',
    placeholder: 'xi_api_key_xxxxxxxxxxxxxxxxxxxx',
    required: true,
  },
  {
    key: 'higgsfield_url',
    label: 'Custom Higgsfield server URL (optional)',
    envVar: 'HIGGSFIELD_API_URL',
    category: 'media',
    categoryTitle: 'Video & voice production (Video & Voice AI)',
    description: 'Leave empty to use the official default URL (https://api.higgsfield.ai/v1).',
    helpUrl: 'https://api.higgsfield.ai',
    placeholder: 'https://api.higgsfield.ai/v1',
    required: false,
  },

  // 3. YouTube & Google integrations
  {
    key: 'youtube_api',
    label: 'YouTube Data API key',
    envVar: 'YOUTUBE_API_KEY',
    category: 'youtube',
    categoryTitle: 'YouTube & Google integrations',
    description: 'Used to read YouTube channel statistics, trending keywords, and monitor subscribers and views.',
    helpUrl: 'https://console.cloud.google.com/apis/credentials',
    placeholder: 'AIzaSyxxxxxxxxxxxxxxxxxxxx',
    required: true,
  },
  {
    key: 'google_client_id',
    label: 'Google OAuth Client ID',
    envVar: 'GOOGLE_CLIENT_ID',
    category: 'youtube',
    categoryTitle: 'YouTube & Google integrations',
    description: 'Lets channel owners sign in with Google and connect their YouTube channels in one secure click.',
    helpUrl: 'https://console.cloud.google.com/apis/credentials',
    placeholder: '123456789-xxxxxxxx.apps.googleusercontent.com',
    required: true,
  },
  {
    key: 'google_client_secret',
    label: 'Google OAuth Client Secret',
    envVar: 'GOOGLE_CLIENT_SECRET',
    category: 'youtube',
    categoryTitle: 'YouTube & Google integrations',
    description: 'The secret belonging to your Google app, used to complete authentication and connect channels.',
    helpUrl: 'https://console.cloud.google.com/apis/credentials',
    placeholder: 'GOCSPX-xxxxxxxxxxxxxxxxxxxx',
    required: true,
  },

  // 4. Niche & market research
  {
    key: 'search',
    label: 'Smart search engine key (Search API / Tavily)',
    envVar: 'SEARCH_API_KEY',
    category: 'research',
    categoryTitle: 'Market & niche research',
    description: 'Used in the daily crawl to find the latest news and trending content in the channel\'s niche, providing exclusive and competitive ideas.',
    helpUrl: 'https://tavily.com',
    placeholder: 'tvly-xxxxxxxxxxxxxxxxxxxx',
    required: false,
  },

  // 5. Infrastructure & email (optional)
  {
    key: 'email_provider',
    label: 'Email provider key',
    envVar: 'EMAIL_API_KEY',
    category: 'infra',
    categoryTitle: 'Infrastructure & email services (optional)',
    description: 'Used to send magic sign-in links and email verification messages to users.',
    helpUrl: 'https://resend.com',
    placeholder: 're_xxxxxxxxxxxxxxxxxxxx',
    required: false,
  },
  {
    key: 'redis_url',
    label: 'Upstash Redis REST URL',
    envVar: 'UPSTASH_REDIS_REST_URL',
    category: 'infra',
    categoryTitle: 'Infrastructure & email services (optional)',
    description: 'Cloud fast-memory URL for storing sessions and preventing targeted attacks.',
    helpUrl: 'https://console.upstash.com',
    placeholder: 'https://xxxxxxxx.upstash.io',
    required: false,
  },
  {
    key: 'redis_token',
    label: 'Upstash Redis REST Token',
    envVar: 'UPSTASH_REDIS_REST_TOKEN',
    category: 'infra',
    categoryTitle: 'Infrastructure & email services (optional)',
    description: 'The access token used to connect to the Upstash Redis database.',
    helpUrl: 'https://console.upstash.com',
    placeholder: 'AXxxxxxxxxxxxxxxxxxxx',
    required: false,
  },
];
