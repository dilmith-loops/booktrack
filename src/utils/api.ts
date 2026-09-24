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

export const apiFetch = async (url: string, options?: RequestInit): Promise<Response> => {
  const res = await fetch(getApiUrl(url), options);

  // If server returns 403 Forbidden due to account suspension / disabled status
  if (res.status === 403 && typeof window !== 'undefined') {
    try {
      const clone = res.clone();
      const data = await clone.json();
      if (
        data &&
        (data.isDisabled === true ||
          (typeof data.error === 'string' &&
            (data.error.toLowerCase().includes('disabled') ||
              data.error.toLowerCase().includes('suspended'))))
      ) {
        window.dispatchEvent(
          new CustomEvent('account-disabled', {
            detail: {
              message:
                data.error ||
                'Your spotter account has been disabled by an administrator. You have been logged out automatically.'
            }
          })
        );
      }
    } catch {
      // Ignore JSON parse errors on unexpected body
    }
  }

  return res;
};

