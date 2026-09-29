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

export interface ApiFetchOptions extends RequestInit {
  timeoutMs?: number;
}

export const apiFetch = async (url: string, options?: ApiFetchOptions): Promise<Response> => {
  const timeoutMs = options?.timeoutMs ?? 15000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // If caller provided their own signal, listen to it
  if (options?.signal) {
    options.signal.addEventListener('abort', () => controller.abort());
  }

  try {
    const res = await fetch(getApiUrl(url), {
      ...options,
      signal: controller.signal
    });

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
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('Connection timed out. The server took too long to respond. Please check your connection and try again.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
};

