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
  // 1. الذكاء الاصطناعي والحارس الأمني
  {
    key: 'openai',
    label: 'مفتاح الذكاء الاصطناعي (OpenAI API Key)',
    envVar: 'OPENAI_API_KEY',
    category: 'ai',
    categoryTitle: 'مفاتيح الذكاء الاصطناعي والحارس الأمني',
    description: 'المحرك الأساسي لتوليد اسكربتات الفيديوهات، العناوين، الأفكار الإبداعية، بالإضافة لتشغيل الحارس الأمني للدردشة وحماية المنصة.',
    helpUrl: 'https://platform.openai.com/api-keys',
    placeholder: 'sk-proj-xxxxxxxxxxxxxxxxxxxx',
    required: true,
  },
  {
    key: 'anthropic',
    label: 'مفتاح كلود (Anthropic Claude API Key)',
    envVar: 'ANTHROPIC_API_KEY',
    category: 'ai',
    categoryTitle: 'مفاتيح الذكاء الاصطناعي والحارس الأمني',
    description: 'محرك ذكاء اصطناعي بديل ممتاز لصياغة النصوص الطويلة والترجمة والتحليلات المعمقة.',
    helpUrl: 'https://console.anthropic.com/settings/keys',
    placeholder: 'sk-ant-api03-xxxxxxxxxxxxxxxxxxxx',
    required: false,
  },
  {
    key: 'gemini',
    label: 'مفتاح جوجل جيميني (Google Gemini API Key)',
    envVar: 'GEMINI_API_KEY',
    category: 'ai',
    categoryTitle: 'مفاتيح الذكاء الاصطناعي والحارس الأمني',
    description: 'محرك جوجل الذكي السريع لتحليل البيانات وفحص محتوى القنوات واكتشاف التريندات.',
    helpUrl: 'https://aistudio.google.com/app/apikey',
    placeholder: 'AIzaSyxxxxxxxxxxxxxxxxxxxx',
    required: false,
  },

  // 2. إنتاج الفيديو والصوتيات
  {
    key: 'higgsfield',
    label: 'مفتاح هيكسفيلد لإنتاج الفيديو (Higgsfield AI Key)',
    envVar: 'HIGGSFIELD_API_KEY',
    category: 'media',
    categoryTitle: 'إنتاج الفيديو والصوتيات (Video & Voice AI)',
    description: 'محرك هيكسفيلد لتوليد وإنتاج مقاطع الفيديو بالذكاء الاصطناعي وصناعة الصور المصغرة (Thumbnails) التلقائية لقناتك.',
    helpUrl: 'https://higgsfield.ai',
    placeholder: 'hf_live_xxxxxxxxxxxxxxxxxxxx',
    required: true,
  },
  {
    key: 'elevenlabs',
    label: 'مفتاح الذكاء الاصطناعي للصوت (ElevenLabs Voice AI Key)',
    envVar: 'ELEVENLABS_API_KEY',
    category: 'media',
    categoryTitle: 'إنتاج الفيديو والصوتيات (Video & Voice AI)',
    description: 'يُستخدم لتحويل الاسكربتات المكتوبة إلى تعليق صوتي بشري (Voiceover) طبيعي وواقعي باللغة العربية والإنجليزية بجودة استوديو.',
    helpUrl: 'https://elevenlabs.io',
    placeholder: 'xi_api_key_xxxxxxxxxxxxxxxxxxxx',
    required: true,
  },
  {
    key: 'higgsfield_url',
    label: 'رابط خادم هيكسفيلد المخصص (اختياري)',
    envVar: 'HIGGSFIELD_API_URL',
    category: 'media',
    categoryTitle: 'إنتاج الفيديو والصوتيات (Video & Voice AI)',
    description: 'اتركه فارغاً للاعتماد على الرابط الرسمي الافتراضي (https://api.higgsfield.ai/v1).',
    helpUrl: 'https://api.higgsfield.ai',
    placeholder: 'https://api.higgsfield.ai/v1',
    required: false,
  },

  // 3. ربط قنوات يوتيوب وحسابات جوجل
  {
    key: 'youtube_api',
    label: 'مفتاح يوتيوب للبيانات (YouTube Data API Key)',
    envVar: 'YOUTUBE_API_KEY',
    category: 'youtube',
    categoryTitle: 'ربط يوتيوب وجوجل (YouTube & Google Integrations)',
    description: 'يُستخدم لقراءة إحصائيات قنوات يوتيوب، الكلمات المفتاحية الرائجة، ومراقبة عدد المشتركين والمشاهدات.',
    helpUrl: 'https://console.cloud.google.com/apis/credentials',
    placeholder: 'AIzaSyxxxxxxxxxxxxxxxxxxxx',
    required: true,
  },
  {
    key: 'google_client_id',
    label: 'معرف تطبيق جوجل (Google OAuth Client ID)',
    envVar: 'GOOGLE_CLIENT_ID',
    category: 'youtube',
    categoryTitle: 'ربط يوتيوب وجوجل (YouTube & Google Integrations)',
    description: 'يُمكّن أصحاب القنوات من تسجيل الدخول بحسابات Google وربط قنواتهم بيوتيوب بضغطة زر وبأمان تام.',
    helpUrl: 'https://console.cloud.google.com/apis/credentials',
    placeholder: '123456789-xxxxxxxx.apps.googleusercontent.com',
    required: true,
  },
  {
    key: 'google_client_secret',
    label: 'السر لتطبيق جوجل (Google OAuth Client Secret)',
    envVar: 'GOOGLE_CLIENT_SECRET',
    category: 'youtube',
    categoryTitle: 'ربط يوتيوب وجوجل (YouTube & Google Integrations)',
    description: 'الرمز السري التابع لتطبيق جوجل لإتمام المصادقة وربط القنوات.',
    helpUrl: 'https://console.cloud.google.com/apis/credentials',
    placeholder: 'GOCSPX-xxxxxxxxxxxxxxxxxxxx',
    required: true,
  },

  // 4. أبحاث النيش والبحث في السوق
  {
    key: 'search',
    label: 'مفتاح محرك البحث الذكي (Search API / Tavily)',
    envVar: 'SEARCH_API_KEY',
    category: 'research',
    categoryTitle: 'البحث وتحليل المنافسين والنيش (Market & Niche Research)',
    description: 'يُستخدم في الزحف اليومي والبحث عن أحدث الأخبار والمحتوى الرائج في تخصص القناة لتزويدها بأفكار حصرية ومنافسة.',
    helpUrl: 'https://tavily.com',
    placeholder: 'tvly-xxxxxxxxxxxxxxxxxxxx',
    required: false,
  },

  // 5. البنية التحتية والبريد (اختياري)
  {
    key: 'email_provider',
    label: 'مفتاح إرسال البريد الإلكتروني (Email Provider Key)',
    envVar: 'EMAIL_API_KEY',
    category: 'infra',
    categoryTitle: 'خدمات البنية التحتية والبريد (اختياري)',
    description: 'يُستخدم لإرسال روابط تسجيل الدخول السحرية ورسائل التحقق البريدية للمستخدمين.',
    helpUrl: 'https://resend.com',
    placeholder: 're_xxxxxxxxxxxxxxxxxxxx',
    required: false,
  },
  {
    key: 'redis_url',
    label: 'رابط قاعدة الذاكرة السريعة (Upstash Redis REST URL)',
    envVar: 'UPSTASH_REDIS_REST_URL',
    category: 'infra',
    categoryTitle: 'خدمات البنية التحتية والبريد (اختياري)',
    description: 'رابط الذاكرة السريعة السحابية لتخزين الجلسات ومنع الهجمات الموجهة.',
    helpUrl: 'https://console.upstash.com',
    placeholder: 'https://xxxxxxxx.upstash.io',
    required: false,
  },
  {
    key: 'redis_token',
    label: 'رمز وصول الذاكرة السريعة (Upstash Redis REST Token)',
    envVar: 'UPSTASH_REDIS_REST_TOKEN',
    category: 'infra',
    categoryTitle: 'خدمات البنية التحتية والبريد (اختياري)',
    description: 'رمز المرور للاتصال بقاعدة Upstash Redis.',
    helpUrl: 'https://console.upstash.com',
    placeholder: 'AXxxxxxxxxxxxxxxxxxxx',
    required: false,
  },
];
