const DEFAULT_API_URL = 'https://oyedara17-stepyzoid-backend.hf.space';

export const getApiUrl = () => {
  return process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL;
};

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  const baseUrl = getApiUrl();
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const isFormData = options.body instanceof FormData;

  const headers: any = {
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...((options.headers as any) || {}),
  };

  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      console.warn('Unauthorized access detected. Redirecting to login...');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('adminToken');
        window.location.href = '/login';
      }
      throw new Error('Unauthorized');
    }

    return response;
  } catch (err) {
    console.error(`API Fetch Error [${url}]:`, err);
    throw err;
  }
};
