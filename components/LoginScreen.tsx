import React, { useState } from 'react';
import axios from 'axios';
import styles from './LoginScreen.module.css';

interface LoginScreenProps {
  API_BASE_URL: string;
  onLoginSuccess: (userId: string, userName: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ API_BASE_URL: initialApiUrl, onLoginSuccess }) => {
  // Use relative path '/api' in production (Vercel), or localhost in dev
  // If initialApiUrl is passed (from props), use it. Otherwise default to relative path '/api' for Vercel
  // But for local dev, we might need http://localhost:3001
  // Let's use a smarter default: if we are on the same domain (production), use /api.
  // For now, let's stick to the prop passed from parent, but parent needs to be smart.
  // Actually, let's override it here for simplicity in this context.

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:3001' : '/api');

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isRegister && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const endpoint = isRegister ? 'register' : 'login';

    try {
      // Remove double slash if API_BASE_URL ends with /
      const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
      const response = await axios.post(`${baseUrl}/${endpoint}`, { name, password });

      if (response.status === 200 || response.status === 201) {
        const userId = response.data.userId;
        const userName = response.data.userName;
        onLoginSuccess(userId, userName);
      }
    } catch (err: any) {
      console.error(`${endpoint} error:`, err);
      const errorMessage = err.response?.data?.error || `Failed to ${endpoint}. Please try again.`;
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchMode = () => {
    setIsRegister(!isRegister);
    setError(null);
    setName('');
    setPassword('');
    setConfirmPassword('');
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.loginContainer}>
        <div className={styles.loginCard}>
          <div className={styles.loginTitle}>
            <span className={styles.loginText}>
              {isRegister ? 'REGISTER' : 'LOGIN'}
            </span>
          </div>
          <div className={styles.loginForm}>
            {error && <div className={styles.errorMsg}>{error}</div>}

            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
              <div className={styles.inputGroup}>
                <input
                  required
                  placeholder="Username"
                  className={styles.loginInput}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className={styles.inputGroup}>
                <input
                  required
                  placeholder="Password"
                  className={styles.loginInput}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {isRegister && (
                <div className={styles.inputGroup}>
                  <input
                    required
                    placeholder="Confirm Password"
                    className={styles.loginInput}
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              )}

              <button className={styles.loginBtn} type="submit" disabled={loading}>
                {loading ? 'LOADING...' : (isRegister ? 'CREATE ACCOUNT' : 'ENTER ZONE')}
              </button>
            </form>

            <button type="button" onClick={handleSwitchMode} className={styles.toggleBtn}>
              {isRegister ? 'Already have an account? Login' : 'New here? Create Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;