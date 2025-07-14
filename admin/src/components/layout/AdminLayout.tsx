import React from 'react';
import Navigation from './Navigation';

interface AdminLayoutProps {
    children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen bg-gray-50">
            <Navigation />
            <main>
                {children}
            </main>
        </div>
    );
};

export default AdminLayout; 