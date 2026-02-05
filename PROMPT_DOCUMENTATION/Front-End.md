# ROLE
Actúa como Senior Frontend Architect. Tu objetivo es realizar el SETUP TÉCNICO de las librerías en `app/frontend` para el proyecto de Finanzas Personales. 

# ESTRATEGIA: CONFIGURACIÓN POR MÓDULOS E INFRAESTRUCTURA
No implementes vistas ni lógica de negocio. Configura el "Core" de cada librería para que queden listas para ser consumidas por los módulos del aplicativo.

# TAREAS DE CONFIGURACIÓN PASO A PASO

1. ARQUITECTURA MODULAR (Estructura de Carpetas)
Genera la estructura de directorios bajo una filosofía de módulos:
- `src/core/`: Configuraciones transversales (Firebase, Providers, API Client).
- `src/shared/`: Componentes UI (shadcn), utilidades, tipos globales y layouts base.
- `src/modules/`: Carpetas independientes por dominio (ej. `auth`, `transactions`, `budgets`). Cada módulo debe tener su propia subestructura: `/api`, `/hooks`, `/store` y `/components`.

2. SETUP DE LIBRERÍAS (Andamiaje Técnico)

A. FIREBASE (Auth Engine):
   - Configura `src/core/config/firebase.config.ts`. 
   - Inicializa el SDK de Firebase (Auth) utilizando variables de entorno para las credenciales.

B. ZUSTAND (State Engine):
   - Configura el store base en `src/core/store/useUIStore.ts` (para estados globales de la interfaz como sidebars o modales).
   - Crea un store base para el usuario en `src/modules/auth/store/useUserStore.ts` que escuche los cambios de estado de Firebase.

C. TANSTACK QUERY (Cache Engine):
   - Configura el `QueryClient` en `src/core/config/queryClient.ts` con una política de `staleTime` y `retry` definida para una aplicación financiera.

D. AXIOS (Network Engine):
   - Configura la instancia base en `src/core/api/httpClient.ts`.
   - Implementa solo interceptores de manejo de errores globales (ej. logs de errores de red o timeouts) y `baseURL` desde `.env`.

E. ROUTING (Navigation Engine):
   - Configura el esqueleto de rutas en `src/core/router/AppRouter.tsx`.
   - Define un `PublicLayout` y un `DashboardLayout` básico (solo la estructura de slots/outlets).

3. BOILERPLATE DE INTEGRACIÓN (main.tsx)
- Configura `main.tsx` envolviendo la aplicación únicamente con los Providers necesarios (QueryClient, Router).

# REQUISITOS TÉCNICOS
- Todo el código debe estar en TypeScript estricto.
- El diseño debe permitir que el "Producer" (API) y el Frontend escalen de forma independiente.

# FORMATO DE SALIDA
1. Árbol de archivos detallado.
2. Bloques de código para los archivos de configuración mencionados (firebase, queryClient, httpClient, useUserStore, AppRouter).