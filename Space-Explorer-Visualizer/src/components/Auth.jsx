import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { Rocket, Unlock } from 'lucide-react';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';

const Auth = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [msg, setMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { playAudio } = useContext(ThemeContext);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
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
                setTimeout(() => navigate('/home'), 500);
            } else {
                const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
                const user = userCredential.user;

                await updateProfile(user, {
                    displayName: formData.name
                });

                playAudio('success');
                setMsg('Registration successful! Launching systems...');
                setIsLogin(true); // Switch to login view
                setFormData({ ...formData, password: '' }); // clear password
            }
        } catch (err) {
            playAudio('error');
            setError(err.message || 'Firebase Auth failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div className="glass-panel" style={styles.panel}>
                <h1 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <img src="/logo.png" alt="Logo" style={{ height: '40px', width: 'auto', objectFit: 'contain' }} /> STAR-COMMAND
                </h1>
                <p style={{ marginBottom: '2rem' }}>
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
                        required
                    />
                    <input
                        type="password"
                        name="password"
                        placeholder="Passcode"
                        value={formData.password}
                        onChange={handleChange}
                        style={styles.input}
                        required
                    />

                    {error && <div style={styles.error}>{error}</div>}
                    {msg && <div style={{ color: 'var(--success-color)', textShadow: '0 0 5px var(--success-color)' }}>{msg}</div>}

                    <button type="submit" className="btn-primary" disabled={loading} style={styles.button}>
                        {loading ? 'Processing...' : <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><Unlock size={18} /> {isLogin ? 'LOGIN' : 'REGISTER'}</span>}
                    </button>

                    <p style={{ marginTop: '15px', fontSize: '0.9rem', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setIsLogin(!isLogin)}>
                        {isLogin ? "Need access? Request clearance." : "Already enlisted? Login."}
                    </p>
                </form>
            </div>
        </div>
    );
};

const styles = {
    container: {
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px'
    },
    panel: {
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
    },
    input: {
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid var(--accent-primary)',
        background: 'rgba(0,0,0,0.2)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-body)',
        fontSize: '1rem',
        outline: 'none'
    },
    button: {
        padding: '12px',
        display: 'flex',
        justifyContent: 'center'
    },
    error: {
        color: 'var(--error-color)',
        fontSize: '0.9rem',
        textShadow: '0 0 5px var(--error-color)'
    }
};

export default Auth;
