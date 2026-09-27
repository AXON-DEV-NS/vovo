export const SITE_NAME = 'VOVO Agent AI';
export const SITE_DESCRIPTION = 'Your autonomous AI-powered YouTube channel manager. AI handles research, content creation, publishing, and optimization — you just approve.';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const ADMIN_ROUTE_PREFIX = 'vovo-hq-secure-gateway' as const;
export const ADMIN_ROUTES = {
  base: `/${ADMIN_ROUTE_PREFIX}`,
  login: `/${ADMIN_ROUTE_PREFIX}/login`,
  overview: `/${ADMIN_ROUTE_PREFIX}/overview`,
  users: `/${ADMIN_ROUTE_PREFIX}/users`,
  plans: `/${ADMIN_ROUTE_PREFIX}/plans`,
  promoCodes: `/${ADMIN_ROUTE_PREFIX}/promo-codes`,
  securityChat: `/${ADMIN_ROUTE_PREFIX}/security-chat`,
  auditLogs: `/${ADMIN_ROUTE_PREFIX}/audit-logs`,
  finance: `/${ADMIN_ROUTE_PREFIX}/finance`,
} as const;

export const PROTECTED_ROUTES = [
  '/onboarding',
  '/dashboard',
  '/channels',
  '/niche',
  '/content-calendar',
  '/analytics',
  '/settings',
  '/support',
] as const;

export const PUBLIC_ROUTES = [
  '/',
  '/pricing',
  '/contact',
  '/legal',
  '/login',
] as const;
