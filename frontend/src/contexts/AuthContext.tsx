import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged, 
    updateProfile
} from 'firebase/auth';
import { auth } from '../firebase';
import { emotionAPI, AuthUser } from '../services/api';
import toast from 'react-hot-toast';

interface AuthContextType {
    user: AuthUser | null;
    token: string | null;
    isAuthenticated: boolean;
    isEmailVerified: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, fullName?: string) => Promise<void>;
    logout: () => Promise<void>;
    resendVerification: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Listen for Firebase auth state changes
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                // 1. Instantly set user details from cached user info (synchronously)
                const userData: AuthUser = {
                    email: firebaseUser.email || '',
                    full_name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User'
                };

                setUser(userData);
                setIsEmailVerified(firebaseUser.emailVerified);

                // Try to get token from localStorage first for instant API interceptor readiness
                const cachedToken = localStorage.getItem('auth_token');
                if (cachedToken) {
                    setToken(cachedToken);
                }

                // Unblock application rendering immediately (0ms wait)
                setIsLoading(false);

                // 2. Perform token retrieval and reload in the background
                (async () => {
                    try {
                        // Refresh the token in the background (resolves immediately if cached, or fetches if expired)
                        const idToken = await firebaseUser.getIdToken();
                        setToken(idToken);
                        localStorage.setItem('auth_token', idToken);
                        localStorage.setItem('auth_user', JSON.stringify(userData));

                        // Force refresh user profile to check for latest emailVerified status
                        await firebaseUser.reload();
                        const updatedUser = auth.currentUser;
                        
                        if (updatedUser) {
                            const newIdToken = await updatedUser.getIdToken();
                            const updatedUserData: AuthUser = {
                                email: updatedUser.email || '',
                                full_name: updatedUser.displayName || updatedUser.email?.split('@')[0] || 'User'
                            };

                            setToken(newIdToken);
                            setUser(updatedUserData);
                            setIsEmailVerified(updatedUser.emailVerified);
                            
                            localStorage.setItem('auth_token', newIdToken);
                            localStorage.setItem('auth_user', JSON.stringify(updatedUserData));
                        }
                    } catch (error) {
                        console.warn("Background auth profile refresh failed:", error);
                        const errStr = String(error);
                        if (errStr.includes('auth/user-token-expired') || errStr.includes('auth/user-not-found') || errStr.includes('auth/user-disabled')) {
                            handleLogout();
                        }
                    }
                })();
            } else {
                handleLogout();
                setIsLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const handleLogout = () => {
        setUser(null);
        setToken(null);
        setIsEmailVerified(false);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
    };

    const login = async (email: string, password: string) => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const firebaseUser = userCredential.user;
            
            if (!firebaseUser.emailVerified) {
                toast.error("Please verify your email before logging in.");
                // We let them "login" but the ProtectedRoute will handle the restriction
            }

            const idToken = await firebaseUser.getIdToken();
            const userData: AuthUser = {
                email: firebaseUser.email || '',
                full_name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User'
            };

            setToken(idToken);
            setUser(userData);
            setIsEmailVerified(firebaseUser.emailVerified);
        } catch (error) {
            console.error('Firebase Login failed:', error);
            throw error;
        }
    };

    const register = async (email: string, password: string, fullName?: string) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const firebaseUser = userCredential.user;
            
            // 1. Update Profile Name
            if (fullName) {
                await updateProfile(firebaseUser, { displayName: fullName });
            }

            // 2. Call FastAPI Backend to generate and send Premium Verification Email
            // Pass the local dev URL as the continue_url. 
            // When deployed, this should be the live app URL.
            const response = await emotionAPI.generateAndSendVerification(
                email, 
                "http://localhost:5173"
            );

            if (response.sent) {
                toast.success("Verification email sent! Please check your inbox.");
            } else {
                toast.error("Account created, but email failed. Try logging in to resend.");
            }

            const idToken = await firebaseUser.getIdToken();
            const userData: AuthUser = {
                email: firebaseUser.email || '',
                full_name: fullName || firebaseUser.email?.split('@')[0] || 'User'
            };

            setToken(idToken);
            setUser(userData);
            setIsEmailVerified(false); // New users are always unverified
        } catch (error: any) {
            console.error('Firebase Registration failed:', error);
            throw error;
        }
    };

    const resendVerification = async () => {
        if (auth.currentUser) {
            try {
                const response = await emotionAPI.generateAndSendVerification(
                    auth.currentUser.email || '', 
                    "http://localhost:5173"
                );
                
                if (response.sent) {
                    toast.success("Premium Verification email resent!");
                } else {
                    toast.error("Failed to send premium email. Try again later.");
                }
            } catch (error) {
                toast.error("Error connecting to email service.");
            }
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            handleLogout();
        } catch (error) {
            console.error('Firebase Logout failed:', error);
            throw error;
        }
    };

    const value: AuthContextType = {
        user,
        token,
        isAuthenticated: !!user && !!token,
        isEmailVerified,
        isLoading,
        login,
        register,
        logout,
        resendVerification
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};



