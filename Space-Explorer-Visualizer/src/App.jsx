import React, { useEffect, useContext, useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, ThemeContext } from './context/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useKeyboardShortcut } from './hooks/useKeyboardShortcut';
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

// Global App Layout with navigation and AI assistance (no login required)
const AppLayout = ({ children }) => {
    return (
        <>
            <Navbar />
            <main id="main-content" tabIndex={-1}>
                {children}
            </main>
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
                        <Route
                            path="/"
                            element={
                                <AppLayout>
                                    <Home />
                                </AppLayout>
                            }
                        />
                        <Route
                            path="/home"
                            element={
                                <AppLayout>
                                    <Home />
                                </AppLayout>
                            }
                        />
                        <Route
                            path="/visualizer"
                            element={
                                <AppLayout>
                                    <Visualizer />
                                </AppLayout>
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
