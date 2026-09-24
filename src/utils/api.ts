/**
 * API URL resolver supporting root domain (localhost) and subfolder deployments (/booktrack).
 */
export const getApiUrl = (endpoint: string): string => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // If explicitly specified in environment
  const envBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
  if (envBase) {
    return `${envBase.replace(/\/$/, '')}${cleanEndpoint}`;
  }

  // Detect /booktrack subpath dynamically from browser URL
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/booktrack')) {
    return `/booktrack${cleanEndpoint}`;
  }

  return cleanEndpoint;
};

export const apiFetch = (url: string, options?: RequestInit): Promise<Response> => {
  return fetch(getApiUrl(url), options);
};
