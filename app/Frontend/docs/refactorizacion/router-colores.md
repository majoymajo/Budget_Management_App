# Refactorización - Router y Tema de Categorías

## F-03: Router Sucio y Colores Hardcoded 🟡 MEDIO

### Problemas Identificados

**1. Router con Componentes Inline**
Los componentes de página se definían directamente en las rutas, ensuciando la arquitectura.

**2. Colores Hardcoded en DataTable**
El mapa de colores de categorías estaba enterrado en `DataTable.tsx`, impediendo reutilización.

**Evidencia:**

- **Router:** `src/core/router/AppRouter.tsx`
- **DataTable:** `src/modules/transactions/components/DataTable.tsx`

---

### ¿Qué es React.lazy?

`React.lazy()` permite definir componentes que se cargan **solo cuando se necesitan**, no al inicio de la app.

```typescript
// ❌ ANTES: Carga inmediata (todo el JS se baja al iniciar)
import { LoginPage } from '../../modules/auth/pages/LoginPage';

// ✅ AHORA: Carga diferida (solo cuando se visita la ruta)
const LoginPage = lazy(() => import('../../modules/auth/pages/LoginPage').then(m => ({ default: m.LoginPage })));
```

**Beneficios:**

| Aspecto | Sin lazy | Con lazy |
|---------|----------|----------|
| Bundle inicial | Grande | Pequeño |
| Tiempo de carga inicial | Lento | Rápido |
| Carga bajo demanda | No | Sí |

---

### Comparación: Antes vs Después

**ANTES (Router Sucio)**

```typescript
// AppRouter.tsx
import { TransactionPage } from '@/modules/transactions/pages/TransactionPage';
import { ReportsPage } from '@/modules/reports/pages/ReportsPage';

// ❌ Componente inline - MAL PRACTICA
const HomePage = () => (
    <div className="text-center">
        <h1>Bienvenido</h1>
    </div>
);

export const AppRouter = () => (
    <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/transactions" element={<TransactionPage />} />
    </Routes>
);
```

Problemas:

- HomePage definido inline ensucia el router
- Todas las páginas se cargan al inicio
- Difícil de mantener

---

**AHORA (Router Limpio con Lazy Loading)**

```typescript
// AppRouter.tsx
import { Suspense, lazy } from "react";

const HomePage = lazy(() => import("../../modules/home/pages/HomePage").then(m => ({ default: m.HomePage })));
const TransactionPage = lazy(() => import("../../modules/transactions/pages/TransactionPage").then(m => ({ default: m.TransactionPage })));
const ReportsPage = lazy(() => import("../../modules/reports/pages/ReportsPage").then(m => ({ default: m.ReportsPage })));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
  </div>
);

export const AppRouter = () => (
  <BrowserRouter>
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* ... rutas */}
      </Routes>
    </Suspense>
  </BrowserRouter>
);
```

---

**ANTES (Colores Hardcoded)**

```typescript
// DataTable.tsx
const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    "Alimentación": "bg-blue-100 text-blue-800",
    "Transporte": "bg-green-100 text-green-800",
    // ... hardcoded
  }
  return colors[category] || colors["Otros"]
}
```

Problemas:

- Duplicación en gráficos, formularios, etc.
- Sin tipado - cualquier string funciona
- Cambio de color = modificar varios archivos

---

**AHORA (Single Source of Truth)**

```typescript
// src/core/theme/categoryColors.ts
export const TRANSACTION_CATEGORIES = [
  "ALIMENTACION",
  "TRANSPORTE",
  // ...
] as const;

export type TransactionCategory = (typeof TRANSACTION_CATEGORIES)[number];

export const CATEGORY_COLORS: Record<TransactionCategory, string> = {
  ALIMENTACION: "bg-blue-100 text-blue-800",
  TRANSPORTE: "bg-green-100 text-green-800",
  // ...
};

export const getCategoryColor = (category: string): string => {
  const normalized = category.toUpperCase() as TransactionCategory;
  return CATEGORY_COLORS[normalized] || CATEGORY_COLORS.OTROS;
};
```

---

### Estructura Final

```
src/
├── core/
│   ├── theme/
│   │   └── categoryColors.ts          # ✅ Single Source of Truth
│   └── router/
│       └── AppRouter.tsx              # ✅ Lazy Loading
├── components/ui/
│   └── category-badge.tsx             # ✅ Componente reutilizable
└── modules/
    ├── home/                          # ✅ Nuevo módulo
    │   └── pages/
    │       └── HomePage.tsx
    ├── auth/
    ├── reports/
    └── transactions/
        └── components/
            └── DataTable.tsx          # ✅ Usa colores centralizados
```

---

### Componente CategoryBadge

```tsx
// Uso en cualquier parte de la app
import { CategoryBadge } from "@/components/ui/category-badge";

// Gráficos
<CategoryBadge category="ALIMENTACION" />

// Tablas
<CategoryBadge category="TRANSPORTE" />

// Formularios
<CategoryBadge category="SALARIO" />
```

---

### Métricas de Mejora

| Métrica | Antes | Después |
|---------|-------|---------|
| Carga inicial | 100% bundle | Solo rutas visitadas |
| Archivos con colores | 1 | 1 (toda la app) |
| Tipado categorías | No | Sí (TypeScript) |
| Componentes inline | 1 | 0 |

---

### Beneficios Obtenidos

1. **Rendimiento**: Carga bajo demanda con Lazy Loading
2. **DRY**: Colores centralizados - un solo archivo para cambiar
3. **Mantenibilidad**: Tipado estricto previene errores
4. **Escalabilidad**: Módulo `home` separado, fácil de extender
5. **Reutilización**: `CategoryBadge` para cualquier parte de la app
