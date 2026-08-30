import React, { useState, useContext } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { Unlock, Loader } from 'lucide-react';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [msg, setMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { playAudio } = useContext(ThemeContext);

    // Check if already authenticated
    const token = localStorage.getItem('spaceToken');
    if (token) {
        const returnUrl = searchParams.get('returnUrl') || '/home';
        navigate(returnUrl.startsWith('/') ? returnUrl : '/home', { replace: true });
        return null;
    }

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return; // Idempotency guard: prevent double submission
        setLoading(true);
        setError('');
        setMsg('');
        playAudio('click');

        try {
            if (isLogin) {
                const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
                const user = userCredential.user;
                playAudio('success');
                localStorage.setItem('spaceToken', user.uid);
                localStorage.setItem('spaceUserName', user.displayName || user.email);
                const returnUrl = searchParams.get('returnUrl') || '/home';
                setTimeout(() => navigate(returnUrl.startsWith('/') ? returnUrl : '/home'), 400);
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
                const user = userCredential.user;

                await updateProfile(user, {
                    displayName: formData.name
                });

                playAudio('success');
                setMsg('Registration successful! Launching systems...');
                setIsLogin(true);
                setFormData({ ...formData, password: '' });
            }
        } catch (err) {
            playAudio('error');
            // Map Firebase errors to human-readable messages
            const code = err.code;
            const errorMap = {
                'auth/user-not-found': 'No account found with this email.',
                'auth/wrong-password': 'Incorrect passcode. Try again.',
                'auth/invalid-credential': 'Invalid credentials. Check email and password.',
                'auth/email-already-in-use': 'This email is already registered. Try logging in.',
                'auth/weak-password': 'Passcode must be at least 6 characters.',
                'auth/invalid-email': 'Please enter a valid email address.',
                'auth/too-many-requests': 'Too many attempts. Please wait and try again.',
            };
            setError(errorMap[code] || err.message || 'Authentication failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div className="glass-panel" style={styles.panel}>
                <h1 style={styles.heading}>
                    <img src="/logo.png" alt="Logo" style={{ height: '36px', width: 'auto', objectFit: 'contain' }} /> STAR-COMMAND
                </h1>
                <p style={styles.subtitle}>
                    {isLogin ? 'Terminal Locked. Authenticate to access mission logs.' : 'New Recruit. Register for fleet access.'}
                </p>

                <form onSubmit={handleSubmit} style={styles.form}>
                    {!isLogin && (
                        <input
                            type="text"
                            name="name"
                            placeholder="Commander Name"
                            value={formData.name}
                            onChange={handleChange}
                            style={styles.input}
                            autoComplete="name"
                            required
                        />
                    )}
                    <input
                        type="email"
                        name="email"
                        placeholder="Holonet ID (Email)"
                        value={formData.email}
                        onChange={handleChange}
                        style={styles.input}
                        inputMode="email"
                        autoComplete="email"
                        required
                    />
                    <input
                        type="password"
                        name="password"
                        placeholder="Passcode"
                        value={formData.password}
                        onChange={handleChange}
                        style={styles.input}
                        autoComplete={isLogin ? 'current-password' : 'new-password'}
                        minLength={6}
                        required
                    />

                    {error && <div style={styles.error} role="alert">{error}</div>}
                    {msg && <div style={styles.success} role="status">{msg}</div>}

                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                        style={styles.button}
                        aria-busy={loading}
                    >
                        {loading ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Processing...
                            </span>
                        ) : (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Unlock size={18} /> {isLogin ? 'LOGIN' : 'REGISTER'}
                            </span>
                        )}
                    </button>

                    <p
                        style={styles.switchLink}
                        onClick={() => { setIsLogin(!isLogin); setError(''); setMsg(''); }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsLogin(!isLogin); setError(''); setMsg(''); } }}
                    >
                        {isLogin ? "Need access? Request clearance." : "Already enlisted? Login."}
                    </p>
                </form>
            </div>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

const styles = {
    container: {
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 'clamp(16px, 4vw, 24px)',
    },
    panel: {
        maxWidth: '460px',
        width: '100%',
        textAlign: 'center',
    },
    heading: {
        marginBottom: '0.75rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        fontSize: 'clamp(1.2rem, 4vw, 1.6rem)',
    },
    subtitle: {
        marginBottom: '1.5rem',
        fontSize: 'clamp(0.85rem, 2.5vw, 1rem)',
        opacity: 0.85,
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    input: {
        padding: '12px 14px',
        borderRadius: '8px',
        border: '1px solid var(--glass-border)',
        background: 'rgba(0,0,0,0.15)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-body)',
        fontSize: '1rem',
        outline: 'none',
        transition: 'border-color 0.2s',
    },
    button: {
        padding: '12px',
        display: 'flex',
        justifyContent: 'center',
    },
    error: {
        color: 'var(--error-color)',
        fontSize: '0.88rem',
        textShadow: '0 0 5px var(--error-color)',
    },
    success: {
        color: 'var(--success-color)',
        fontSize: '0.88rem',
        textShadow: '0 0 5px var(--success-color)',
    },
    switchLink: {
        marginTop: '8px',
        fontSize: '0.88rem',
        cursor: 'pointer',
        textDecoration: 'underline',
        color: 'var(--accent-primary)',
    },
};

export default Auth;
