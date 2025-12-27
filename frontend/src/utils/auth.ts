/**
 * Auth utility functions
 */

export function authHeader(): Record<string, string> | undefined {
  const token = localStorage.getItem('token');
  if (!token) {
    return undefined;
  }
  return {
    'Authorization': `Bearer ${token}`
  };
}

export function authHeaderRequired(): Record<string, string> {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No auth token found');
  }
  return {
    'Authorization': `Bearer ${token}`
  };
}
