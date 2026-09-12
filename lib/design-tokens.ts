export const designTokens = {
  colors: {
    brand: {
      primary: '#4F46E5',
      light: '#818CF8',
      dark: '#3730A3',
    },
    accent: {
      primary: '#10B981',
      light: '#34D399',
      dark: '#047857',
    },
    background: {
      primary: '#FAFAFA',
      secondary: '#F4F4F5',
      tertiary: '#E4E4E7',
    },
    text: {
      primary: '#18181B',
      secondary: '#52525B',
      muted: '#A1A1AA',
      inverse: '#FAFAFA',
    },
    border: {
      light: '#E4E4E7',
      DEFAULT: '#D4D4D8',
      dark: '#A1A1AA',
    },
    status: {
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
    },
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },
  radius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '0.875rem',
    '2xl': '1rem',
    full: '9999px',
  },
  typography: {
    fontFamily: {
      sans: 'var(--font-plus-jakarta), system-ui, sans-serif',
      mono: 'var(--font-jet-brains-mono), monospace',
    },
    scale: {
      xs: { size: '0.75rem', lineHeight: '1rem' },
      sm: { size: '0.875rem', lineHeight: '1.25rem' },
      base: { size: '1rem', lineHeight: '1.5rem' },
      lg: { size: '1.125rem', lineHeight: '1.75rem' },
      xl: { size: '1.25rem', lineHeight: '1.75rem' },
      '2xl': { size: '1.5rem', lineHeight: '2rem' },
      '3xl': { size: '1.875rem', lineHeight: '2.25rem' },
      '4xl': { size: '2.25rem', lineHeight: '2.5rem' },
      '5xl': { size: '3rem', lineHeight: '1' },
    },
  },
  shadows: {
    soft: '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
    'soft-lg': '0 10px 40px -10px rgba(0, 0, 0, 0.1)',
  },
  transitions: {
    fast: '150ms ease',
    normal: '200ms ease',
    slow: '300ms ease',
    cinematic: '500ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

export type DesignTokens = typeof designTokens;
