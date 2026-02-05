import { Outlet } from 'react-router-dom';
import { useUIStore } from '../../core/store/useUIStore';

/**
 * Dashboard Layout
 * Main layout for authenticated users with sidebar and header
 */
export const DashboardLayout = () => {
    const { isSidebarOpen, toggleSidebar } = useUIStore();

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside
                className={`
          bg-indigo-900 text-white transition-all duration-300
          ${isSidebarOpen ? 'w-64' : 'w-20'}
        `}
            >
                <div className="p-4">
                    <button
                        onClick={toggleSidebar}
                        className="w-full text-left text-xl font-bold hover:text-indigo-200 transition-colors"
                    >
                        {isSidebarOpen ? 'Finanzas' : 'F'}
                    </button>
                </div>

                {/* Sidebar navigation will be added by modules */}
                <nav className="mt-8 px-4 space-y-2">
                    {isSidebarOpen && (
                        <>
                            <div className="text-sm text-indigo-300 uppercase tracking-wider mb-2">
                                Navegación
                            </div>
                            <p className="text-sm text-indigo-400">
                                [Módulos agregarán sus rutas aquí]
                            </p>
                        </>
                    )}
                </nav>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <header className="bg-white shadow-sm border-b border-gray-200">
                    <div className="px-6 py-4 flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-800">Dashboard</h2>

                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600">
                                [User menu placeholder]
                            </span>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 p-6 overflow-auto">
                    <div className="max-w-7xl mx-auto">
                        {/* Child routes will render here */}
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};
