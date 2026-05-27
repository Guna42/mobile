import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { isAuthenticated, isLoading, isEmailVerified, resendVerification, logout } = useAuth();
    const location = useLocation();

    // Show loading spinner while checking auth state
    if (isLoading) {
        return (
            <div className="min-h-screen mirror-bg flex items-center justify-center">
                <div className="loading-spinner"></div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Show verification prompt if email is not verified
    if (!isEmailVerified) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px] -z-10 animate-pulse"></div>
                
                <div className="max-w-[400px] space-y-8">
                    <div className="space-y-4">
                        <h1 className="text-4xl font-heading font-black text-primary tracking-tighter italic">Verify your identity.</h1>
                        <p className="text-sm text-secondary/60 leading-relaxed">
                            We've sent a verification link to your email. Please click it to activate your Emolit account.
                        </p>
                    </div>

                    <div className="flex flex-col gap-4">
                        <button 
                            onClick={() => window.location.reload()}
                            className="w-full bg-primary text-white h-14 rounded-[1.2rem] font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all"
                        >
                            I've Verified
                        </button>
                        
                        <button 
                            onClick={resendVerification}
                            className="text-[10px] font-black uppercase tracking-widest text-primary/40 hover:text-primary transition-colors"
                        >
                            Resend Verification Link
                        </button>

                        <button 
                            onClick={logout}
                            className="text-[10px] font-black uppercase tracking-widest text-rose-400/40 hover:text-rose-500 transition-colors pt-4"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Render the protected component
    return children;
};

export default ProtectedRoute;
