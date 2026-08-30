import React, { useEffect, useContext, useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, ThemeContext } from './context/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useKeyboardShortcut } from './hooks/useKeyboardShortcut';
import Auth from './components/Auth';
import Navbar from './components/Navbar';
import Chatbot from './components/Chatbot';
import Home from './pages/Home';
import Visualizer from './components/Visualizer';
import './index.css';

// Toast notification listener component
const ToastManager = () => {
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        const handler = (e) => {
            const { message, type } = e.detail;
            const id = Date.now();
            setToasts(prev => [...prev, { id, message, type }]);
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, 4000);
        };
        window.addEventListener('ui:toast', handler);
        return () => window.removeEventListener('ui:toast', handler);
    }, []);

    if (toasts.length === 0) return null;

    return (
        <div className="toast-container">
            {toasts.map(t => (
                <div key={t.id} className={`toast toast-${t.type || 'error'}`}>
                    {t.message}
                </div>
            ))}
        </div>
    );
};

// Protected route guard with auth hydration
const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('spaceToken');
    const location = useLocation();

    if (!token) {
        const returnUrl = encodeURIComponent(location.pathname + location.search);
        return <Navigate to={`/?returnUrl=${returnUrl}`} replace />;
    }

    return (
        <>
            <Navbar />
            {children}
            <Chatbot />
        </>
    );
};

const ScrollToTop = () => {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);
    return null;
};

// Global keyboard shortcut wiring
const GlobalShortcuts = () => {
    const themeCtx = useContext(ThemeContext);

    const handlers = {
        onEscape: useCallback(() => {
            // Close any open modals/drawers by dispatching custom event
            window.dispatchEvent(new CustomEvent('ui:escape'));
        }, []),
        onToggleTheme: useCallback(() => {
            themeCtx?.toggleTheme();
        }, [themeCtx]),
    };

    useKeyboardShortcut(handlers);
    return null;
};

const App = () => {
    return (
        <ErrorBoundary>
            <ThemeProvider>
                <Router>
                    <GlobalShortcuts />
                    <ScrollToTop />
                    <ToastManager />
                    <Routes>
                        <Route path="/" element={<Auth />} />
                        <Route
                            path="/home"
                            element={
                                <ProtectedRoute>
                                    <Home />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/visualizer"
                            element={
                                <ProtectedRoute>
                                    <Visualizer />
                                </ProtectedRoute>
                            }
                        />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Router>
            </ThemeProvider>
        </ErrorBoundary>
    );
};

export default App;
