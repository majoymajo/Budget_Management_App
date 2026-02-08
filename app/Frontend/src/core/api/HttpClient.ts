import axios, { type AxiosInstance, AxiosError, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';

export type ServiceType = 'transactions' | 'reports';

class HttpClient {
    private static instances: Map<ServiceType, AxiosInstance> = new Map();

    static getInstance(serviceType: ServiceType): AxiosInstance {
        if (this.instances.has(serviceType)) {
            return this.instances.get(serviceType)!;
        }

        const baseURL = this.getBaseURL(serviceType);
        const instance: AxiosInstance = axios.create({
            baseURL,
            timeout: 15000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        this.setupInterceptors(instance, serviceType);
        this.instances.set(serviceType, instance);
        return instance;
    }

    private static getBaseURL(serviceType: ServiceType): string {
        switch (serviceType) {
            case 'transactions':
                return import.meta.env.VITE_API_TRANSACTIONS_URL || 'http://localhost:8081/api';
            case 'reports':
                return import.meta.env.VITE_API_REPORTS_URL || 'http://localhost:8082/api';
            default:
                throw new Error(`Service type '${serviceType}' not supported`);
        }
    }

    private static setupInterceptors(instance: AxiosInstance, serviceType: ServiceType): void {
        // Request Interceptor
        instance.interceptors.request.use(
            (config: InternalAxiosRequestConfig) => {
                console.log(`[${serviceType.toUpperCase()}] ${config.method?.toUpperCase()} ${config.url}`);
                return config;
            },
            (error: AxiosError) => {
                console.error(`[${serviceType.toUpperCase()} Request Error]`, error);
                return Promise.reject(error);
            }
        );

        // Response Interceptor
        instance.interceptors.response.use(
            (response: AxiosResponse) => {
                console.log(`[${serviceType.toUpperCase()} Response] ${response.status} ${response.config.url}`);
                return response;
            },
            (error: AxiosError) => {
                if (!error.response) {
                    console.error(`[${serviceType.toUpperCase()} Network Error]`, {
                        message: error.message,
                        code: error.code,
                    });
                    return Promise.reject({
                        message: 'Error de conexión. Verifica tu internet.',
                        code: 'NETWORK_ERROR',
                    });
                }

                const status = error.response.status;
                const errorData = error.response.data;

                console.error(`[${serviceType.toUpperCase()} Error ${status}]`, {
                    url: error.config?.url,
                    method: error.config?.method,
                    data: errorData,
                });

                switch (status) {
                    case 401:
                        console.warn(`[${serviceType.toUpperCase()}] Unauthorized - User needs to login`);
                        break;
                    case 403:
                        console.warn(`[${serviceType.toUpperCase()}] Forbidden - Insufficient permissions`);
                        break;
                    case 404:
                        console.warn(`[${serviceType.toUpperCase()}] Resource not found`);
                        break;
                    case 500:
                        console.error(`[${serviceType.toUpperCase()}] Internal Server Error`);
                        break;
                    case 503:
                        console.error(`[${serviceType.toUpperCase()}] Service Unavailable`);
                        break;
                }

                return Promise.reject(error);
            }
        );
    }

    static clearInstances(): void {
        this.instances.clear();
    }
}

export default HttpClient;