// API Configuration
const BASE_URL = (import.meta.env.PUBLIC_BACKEND_URL as string) || 'http://localhost:5000';

export const API_CONFIG = {
  BASE_URL,
  ENDPOINTS: {
    HEALTH: '/api/health',
    MESSAGES: '/api/messages',
    CHANNELS: '/api/channels',
    COURSES: '/api/courses',
    SUBSCRIPTIONS: '/api/subscriptions',
    ENROLLMENTS: '/api/enrollments',
    ROOT: '/',
    AUTH: {
      LOGIN: '/api/auth/login',
      REGISTER: '/api/auth/register'
    }
  },
  REQUEST_CONFIG: {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include' as RequestCredentials
  }
};

export const buildApiUrl = (endpoint: string): string => {
  const base = API_CONFIG.BASE_URL.endsWith('/') ? API_CONFIG.BASE_URL.slice(0, -1) : API_CONFIG.BASE_URL;
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
};

export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const url = buildApiUrl(endpoint);
  const config = {
    ...API_CONFIG.REQUEST_CONFIG,
    ...options,
    headers: {
      ...API_CONFIG.REQUEST_CONFIG.headers,
      ...options.headers,
    },
  };

  const response = await fetch(url, config);
  if (!response.ok) {
    let payload: any = undefined;
    try {
      payload = await response.json();
    } catch {
      try { payload = await response.text(); } catch { payload = ''; }
    }
    const message = typeof payload === 'string' && payload
      ? payload
      : (payload?.error || response.statusText || `HTTP ${response.status}`);
    throw new Error(JSON.stringify({ status: response.status, error: message }));
  }
  return response.json();
};

// Auth helpers
export type LoginResponse = {
  token: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    isApproved?: boolean;
  }
};
export const login = (email: string, password: string) =>
  apiRequest<LoginResponse>(API_CONFIG.ENDPOINTS.AUTH.LOGIN, {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });

export type RegisterResponse = LoginResponse;
// Preferred: registerUser (generic naming)
export const registerUser = (fullName: string, email: string, password: string, role: string = 'student', creatorType?: string) =>
  apiRequest<RegisterResponse>(API_CONFIG.ENDPOINTS.AUTH.REGISTER, {
    method: 'POST',
    body: JSON.stringify({ fullName, email, password, role, creatorType })
  });

// Backwards compatibility export
export const registerStudent = registerUser;
