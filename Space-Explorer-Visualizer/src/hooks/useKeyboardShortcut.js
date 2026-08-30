/**
 * src/hooks/useKeyboardShortcut.js
 * Global keyboard shortcut dispatcher (Cmd+K, Escape, Alt+T)
 */
import { useEffect } from 'react';

export function useKeyboardShortcut(handlers) {
    useEffect(() => {
        const handleKeyDown = (event) => {
            const target = event.target;
            const isInput = target && (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable
            );

            // Escape — always fires (close modals, drawers, dropdowns)
            if (event.key === 'Escape') {
                if (handlers.onEscape) {
                    event.preventDefault();
                    handlers.onEscape();
                }
                return;
            }

            // Cmd+K / Ctrl+K — global search / command palette
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
                if (handlers.onSearchOpen) {
                    event.preventDefault();
                    handlers.onSearchOpen();
                }
                return;
            }

            // Alt+T — toggle theme
            if (event.altKey && event.key.toLowerCase() === 't') {
                if (handlers.onToggleTheme) {
                    event.preventDefault();
                    handlers.onToggleTheme();
                }
                return;
            }

            // Space — simulation play/pause (only when not typing)
            if (event.code === 'Space' && !isInput) {
                if (handlers.onRunSimulation) {
                    event.preventDefault();
                    handlers.onRunSimulation();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handlers]);
}

export default useKeyboardShortcut;
