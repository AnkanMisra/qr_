import { useState, useEffect } from "react";
import { CreateTicket } from "./CreateTicket";
import { AdminTicketsView } from "./AdminTicketsView";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<"create" | "view">("create");
    const [sessionToken, setSessionToken] = useState<string | null>(null);

    const authenticateAdmin = useMutation(api.admin.authenticateAdmin);
    const validateSession = useQuery(api.admin.validateAdminSession, 
        sessionToken ? { sessionToken } : "skip"
    );
    const invalidateSession = useMutation(api.admin.invalidateAdminSession);

    // Check if user has a valid session on load
    useEffect(() => {
        const storedToken = localStorage.getItem("admin_session_token");
        if (storedToken) {
            setSessionToken(storedToken);
        }
    }, []);

    // Validate session when token is available
    useEffect(() => {
        if (validateSession?.isValid) {
            setIsAuthenticated(true);
        } else if (validateSession?.isValid === false) {
            // Session invalid, clear local storage
            localStorage.removeItem("admin_session_token");
            setSessionToken(null);
            setIsAuthenticated(false);
            if (validateSession.message === "Session expired") {
                toast.error("Session expired. Please log in again.");
            }
        }
    }, [validateSession]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const result = await authenticateAdmin({ password });
            
            if (result.success && result.sessionToken) {
                setIsAuthenticated(true);
                setSessionToken(result.sessionToken);
                localStorage.setItem("admin_session_token", result.sessionToken);
                toast.success("Successfully logged in to admin panel");
                setPassword("");
            } else {
                toast.error(result.message || "Authentication failed");
                setPassword("");
            }
        } catch (error) {
            toast.error("Authentication error. Please try again.");
            setPassword("");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        if (sessionToken) {
            try {
                await invalidateSession({ sessionToken });
            } catch (error) {
                console.error("Error invalidating session:", error);
            }
        }
        
        setIsAuthenticated(false);
        setSessionToken(null);
        localStorage.removeItem("admin_session_token");
        toast.success("Logged out successfully");
    };

    // Show login form if not authenticated
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
                <div className="w-full max-w-md">
                    {/* Back to Scanner Link */}
                    <div className="mb-8 text-center">
                        <Link 
                            to="/" 
                            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            <span>Back to Scanner</span>
                        </Link>
                    </div>

                    {/* Login Card */}
                    <div className="bg-white rounded-lg shadow-lg border border-red-200 overflow-hidden">
                        {/* Header */}
                        <div className="bg-red-600 text-white p-6 text-center">
                            <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold">Secure Admin Access</h1>
                            <p className="text-red-100 mt-2">Server-side authentication required</p>
                        </div>

                        {/* Login Form */}
                        <div className="p-6">
                            <form onSubmit={handleLogin} className="space-y-6">
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                        Admin Password
                                    </label>
                                    <input
                                        type="password"
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors"
                                        placeholder="Enter admin password"
                                        required
                                        disabled={isLoading}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading || !password.trim()}
                                    className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center space-x-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span>Authenticating...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                            </svg>
                                            <span>Secure Access</span>
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Security Notice */}
                            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-start space-x-3">
                                    <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.586-4.414A2 2 0 0019 5.586L16.414 3A2 2 0 0015 2H9a2 2 0 00-1.414.586L4.586 6A2 2 0 004 7.414V16a2 2 0 001.414 1.414L9 21a2 2 0 001.414 0l3.586-3.586A2 2 0 0015 16V7.414a2 2 0 00-1.414-1.414z" />
                                    </svg>
                                    <div>
                                        <p className="text-sm font-medium text-green-800">🔒 Secure Authentication</p>
                                        <p className="text-sm text-green-700 mt-1">Server-side validation with encrypted sessions and environment-based credentials.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Show admin interface if authenticated
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            {/* Streamlined Admin header for mobile */}
            <header className="sticky top-0 z-10 bg-white border-b shadow-sm">
                <div className="px-4 py-3">
                    {/* Top row - Title and Actions */}
                    <div className="flex items-center justify-between mb-3">
                        <h1 className="text-lg sm:text-2xl font-bold text-red-600">Secure Admin Panel</h1>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={handleLogout}
                                className="flex items-center space-x-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                <span className="hidden sm:inline">Logout</span>
                            </button>
                            <Link 
                                to="/" 
                                className="flex items-center space-x-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                <span className="hidden sm:inline">Back</span>
                            </Link>
                        </div>
                    </div>
                    
                    {/* Auth status - simplified for mobile */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-3 sm:hidden">
                        <div className="flex items-center space-x-2">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                            <span className="text-green-800 text-sm font-medium">🔒 Secure Session</span>
                        </div>
                    </div>

                    {/* Desktop auth status */}
                    <div className="hidden sm:block bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                        <div className="flex items-center space-x-2">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                            <span className="text-green-800 text-sm font-medium">🔒 Authenticated Secure Session</span>
                        </div>
                        <p className="text-green-700 text-sm mt-1">Server-side validated with automatic expiration</p>
                    </div>

                    {/* Improved Mobile-friendly Tabs */}
                    <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                        <button
                            onClick={() => setActiveTab("create")}
                            className={`flex-1 py-4 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === "create"
                                ? "bg-white text-red-600 shadow-md"
                                : "text-gray-600 hover:text-gray-800"
                                }`}
                        >
                            <div className="flex flex-col items-center space-y-2">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                <span className="text-xs font-medium">Create</span>
                            </div>
                        </button>

                        <button
                            onClick={() => setActiveTab("view")}
                            className={`flex-1 py-4 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === "view"
                                ? "bg-white text-red-600 shadow-md"
                                : "text-gray-600 hover:text-gray-800"
                                }`}
                        >
                            <div className="flex flex-col items-center space-y-2">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="text-xs font-medium">View All</span>
                            </div>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="flex-1 overflow-hidden">
                <div className="h-full">
                    {activeTab === "create" && <CreateTicket />}
                    {activeTab === "view" && <AdminTicketsView />}
                </div>
            </main>
        </div>
    );
} 