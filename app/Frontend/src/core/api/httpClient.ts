import axios, { type AxiosInstance, AxiosError, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';

/**
 * Base HTTP Client Configuration
 * Configured with interceptors for global error handling
 */
const httpClient: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 15000, // 15 seconds timeout for financial operations
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Request Interceptor
 * Add authentication token or common headers here
 */
httpClient.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        // Future: Add auth token from Zustand store
        // const token = useUserStore.getState().token;
        // if (token) {
        //   config.headers.Authorization = `Bearer ${token}`;
        // }

        console.log(`[HTTP] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
    },
    (error: AxiosError) => {
        console.error('[HTTP Request Error]', error);
        return Promise.reject(error);
    }
);

/**
 * Response Interceptor
 * Handle global errors (network, timeout, server errors)
 */
httpClient.interceptors.response.use(
    (response: AxiosResponse) => {
        console.log(`[HTTP Response] ${response.status} ${response.config.url}`);
        return response;
    },
    (error: AxiosError) => {
        // Network Error
        if (!error.response) {
            console.error('[HTTP Network Error]', {
                message: error.message,
                code: error.code,
            });
            return Promise.reject({
                message: 'Error de conexión. Verifica tu internet.',
                code: 'NETWORK_ERROR',
            });
        }

        // HTTP Error Responses
        const status = error.response.status;
        const errorData = error.response.data;

        console.error(`[HTTP Error ${status}]`, {
            url: error.config?.url,
            method: error.config?.method,
            data: errorData,
        });

        // Handle specific status codes
        switch (status) {
            case 401:
                // Unauthorized - redirect to login or refresh token
                console.warn('[HTTP 401] Unauthorized - User needs to login');
                // Future: Dispatch logout action
                break;
            case 403:
                console.warn('[HTTP 403] Forbidden - Insufficient permissions');
                break;
            case 404:
                console.warn('[HTTP 404] Resource not found');
                break;
            case 500:
                console.error('[HTTP 500] Internal Server Error');
                break;
            case 503:
                console.error('[HTTP 503] Service Unavailable');
                break;
        }

        return Promise.reject(error);
    }
);

export default httpClient;
