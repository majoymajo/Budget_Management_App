import { Outlet } from 'react-router-dom';

/**
 * Public Layout
 * Used for public pages like Login, Register, Landing
 */
export const PublicLayout = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <header className="py-6 px-8">
                <div className="max-w-7xl mx-auto">
                    <h1 className="text-2xl font-bold text-indigo-600">
                        Finanzas Personales
                    </h1>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Child routes will render here */}
                <Outlet />
            </main>

            <footer className="py-6 text-center text-gray-600 text-sm">
                <p>&copy; 2026 Finanzas Personales. Todos los derechos reservados.</p>
            </footer>
        </div>
    );
};
