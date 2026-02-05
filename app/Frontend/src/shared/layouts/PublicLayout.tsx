import { Outlet } from 'react-router-dom';

/**
 * Public Layout
 * Used for public pages like Login, Register, Landing
 */
export const PublicLayout = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <Outlet />
            </main>
        </div>
    );
};
