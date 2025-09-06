import React from 'react';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

const AuthDebug: React.FC = () => {
    const { employee, loading } = useAdminAuth();

    if (process.env.NODE_ENV !== 'development') {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-4 rounded-lg text-xs max-w-xs">
            <div className="font-bold text-yellow-300 mb-2">🔍 Auth Debug</div>
            <div className="space-y-1">
                <div>Loading: <span className={loading ? 'text-red-300' : 'text-green-300'}>{loading.toString()}</span></div>
                <div>Employee: <span className={employee ? 'text-green-300' : 'text-red-300'}>{employee ? 'Yes' : 'No'}</span></div>
                {employee && (
                    <>
                        <div>Email: <span className="text-blue-300">{employee.email}</span></div>
                        <div>Role: <span className="text-purple-300">{employee.role}</span></div>
                        <div>Status: <span className="text-green-300">{employee.status}</span></div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AuthDebug; 