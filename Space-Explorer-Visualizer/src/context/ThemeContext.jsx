import React, { createContext, useState, useEffect, useRef, useContext } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [theme, setThemeState] = useState(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem('space_theme');
            if (stored === 'night' || stored === 'day') return stored;
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'night' : 'day';
        }
        return 'night';
    });

    const audioCtxRef = useRef(null);

    const setTheme = (newTheme) => {
        setThemeState(newTheme);
        localStorage.setItem('space_theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        const metaColor = document.getElementById('meta-theme-color');
        if (metaColor) {
            metaColor.setAttribute('content', newTheme === 'night' ? '#0B0C10' : '#F0F4F8');
        }
    };

    const toggleTheme = () => {
        const target = theme === 'night' ? 'day' : 'night';
        setTheme(target);
        playAudio('toggle');
    };

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    // Listen for OS-level theme changes
    useEffect(() => {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = (e) => {
            // Only auto-switch if user hasn't manually set a preference
            if (!localStorage.getItem('space_theme')) {
                setTheme(e.matches ? 'night' : 'day');
            }
        };
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    const playAudio = (type) => {
        try {
            if (!audioCtxRef.current) {
                const AudioClass = window.AudioContext || window.webkitAudioContext;
                if (AudioClass) audioCtxRef.current = new AudioClass();
            }

            const audioCtx = audioCtxRef.current;
            if (!audioCtx) return;
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }

            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            const now = audioCtx.currentTime;

            if (type === 'toggle') {
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(440, now);
                oscillator.frequency.exponentialRampToValueAtTime(880, now + 0.08);
                gainNode.gain.setValueAtTime(0.2, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
                oscillator.start(now);
                oscillator.stop(now + 0.08);
            } else if (type === 'click') {
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(600, now);
                gainNode.gain.setValueAtTime(0.08, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
                oscillator.start(now);
                oscillator.stop(now + 0.04);
            } else if (type === 'success') {
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(523.25, now);
                oscillator.frequency.setValueAtTime(659.25, now + 0.08);
                oscillator.frequency.setValueAtTime(783.99, now + 0.16);
                gainNode.gain.setValueAtTime(0.25, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
                oscillator.start(now);
                oscillator.stop(now + 0.28);
            } else if (type === 'error') {
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(160, now);
                oscillator.frequency.exponentialRampToValueAtTime(90, now + 0.18);
                gainNode.gain.setValueAtTime(0.25, now);
                gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
                oscillator.start(now);
                oscillator.stop(now + 0.18);
            }
        } catch {
            // Gracefully silence audio policy blocks
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, playAudio }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error('useTheme must be used within a ThemeProvider');
    return context;
};
