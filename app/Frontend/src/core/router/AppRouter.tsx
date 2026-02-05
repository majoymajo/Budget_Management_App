import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from '../../shared/layouts/PublicLayout';
import { DashboardLayout } from '../../shared/layouts/DashboardLayout';

/**
 * Temporary placeholder components
 * These will be replaced by actual module components
 */
const HomePage = () => (
    <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Bienvenido a Finanzas Personales
        </h1>
        <p className="text-gray-600">
            Sistema de gestión financiera personal
        </p>
    </div>
);

const DashboardHome = () => (
    <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Panel Principal
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="font-semibold text-gray-700 mb-2">Transacciones</h3>
                <p className="text-gray-500 text-sm">Módulo en desarrollo</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="font-semibold text-gray-700 mb-2">Presupuestos</h3>
                <p className="text-gray-500 text-sm">Módulo en desarrollo</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="font-semibold text-gray-700 mb-2">Reportes</h3>
                <p className="text-gray-500 text-sm">Módulo en desarrollo</p>
            </div>
        </div>
    </div>
);

/**
 * App Router
 * Main routing configuration with public and protected routes
 */
export const AppRouter = () => {
    return (
        <BrowserRouter>
            <Routes>
                {/* Public Routes */}
                <Route element={<PublicLayout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<div>Login Page (TODO)</div>} />
                    <Route path="/register" element={<div>Register Page (TODO)</div>} />
                </Route>

                {/* Protected Routes */}
                <Route element={<DashboardLayout />}>
                    <Route path="/dashboard" element={<DashboardHome />} />
                    <Route path="/transactions" element={<div>Transactions Module (TODO)</div>} />
                    <Route path="/budgets" element={<div>Budgets Module (TODO)</div>} />
                    <Route path="/reports" element={<div>Reports Module (TODO)</div>} />
                </Route>

                {/* Catch all - redirect to home */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
};
