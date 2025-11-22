import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface LoginScreenProps {
  API_BASE_URL: string;
  onLoginSuccess: (userId: string, userName: string) => void;
}

interface ParticleStyle {
  left: string;
  top: string;
  animationDelay: string;
  animationDuration: string;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ API_BASE_URL, onLoginSuccess }) => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [particleStyles, setParticleStyles] = useState<ParticleStyle[]>([]); 

  useEffect(() => {
    const styles: ParticleStyle[] = [...Array(20)].map(() => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 5}s`,
      animationDuration: `${5 + Math.random() * 10}s`
    }));
    setParticleStyles(styles);
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const endpoint = isRegister ? 'register' : 'login';
    
    try {
      const response = await axios.post(`${API_BASE_URL}/${endpoint}`, { name, password });
      
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

  const handleSwitchMode = (mode: 'login' | 'register') => {
    if (mode === 'login') {
        setIsRegister(false);
    } else {
        setIsRegister(true);
    }
    setError(null);
    setName('');
    setPassword('');
  }

  return (
    <div className="relative flex items-center justify-center min-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        
        {particleStyles.map((style, i) => ( 
          <div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full opacity-20 animate-float"
            style={style}
          />
        ))}
      </div>

      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"></div>

      <div className="relative z-10 w-full max-w-md px-6 animate-[fadeInUp_0.8s_ease-out]">
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl blur-2xl opacity-60 animate-pulse"></div>
            <div className="relative w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 via-purple-600 to-pink-600 rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-110 transition-all duration-300">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
                <path d="M7 9h10v2H7zm0-3h10v2H7z"/>
              </svg>
            </div>
          </div>
          <h1 className="text-5xl font-black mb-2 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-[shimmer_3s_ease-in-out_infinite]">
            ChatFlow
          </h1>
          <p className="text-gray-400 text-sm font-medium">Connect, Chat, Communicate</p>
        </div>

        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl blur-xl opacity-25 group-hover:opacity-40 transition duration-300 animate-pulse"></div>
          
          <div className="relative bg-white/10 backdrop-blur-2xl p-8 rounded-3xl shadow-2xl border border-white/20">
            
            <div className="flex gap-2 mb-8 bg-white/5 p-1.5 rounded-2xl backdrop-blur-xl relative">
                <div 
                    className={`absolute top-1.5 bottom-1.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg transition-all duration-300 ease-in-out z-0 ${
                        !isRegister ? 'left-1.5 w-[calc(50%-6px)]' : 'left-[calc(50%+3px)] w-[calc(50%-6px)] bg-gradient-to-r from-purple-500 to-pink-600'
                    }`}
                ></div>

              <button
                type="button"
                onClick={() => handleSwitchMode('login')}
                className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-300 relative z-10 ${
                  !isRegister
                    ? 'text-white scale-105'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Login
              </button>
              
              <button
                type="button"
                onClick={() => handleSwitchMode('register')}
                className={`flex-1 py-3 rounded-xl font-semibold transition-all duration-300 relative z-10 ${
                  isRegister
                    ? 'text-white scale-105'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-200 ml-1">
                  Username
                </label>
                <div className="relative group/input">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl opacity-0 group-focus-within/input:opacity-20 blur transition-opacity"></div>
                  <div className="relative flex items-center">
                    <div className="absolute left-4 text-gray-400 group-focus-within/input:text-blue-400 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your username"
                      required
                      className="relative w-full pl-12 pr-4 py-4 bg-white/10 border-2 border-white/20 rounded-2xl focus:outline-none focus:border-blue-500 focus:bg-white/15 transition-all duration-300 text-white placeholder:text-gray-400"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-200 ml-1">
                  Password
                </label>
                <div className="relative group/input">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl opacity-0 group-focus-within/input:opacity-20 blur transition-opacity"></div>
                  <div className="relative flex items-center">
                    <div className="absolute left-4 text-gray-400 group-focus-within/input:text-purple-400 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      className="relative w-full pl-12 pr-12 py-4 bg-white/10 border-2 border-white/20 rounded-2xl focus:outline-none focus:border-purple-500 focus:bg-white/15 transition-all duration-300 text-white placeholder:text-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 text-gray-400 hover:text-white transition-colors"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="relative animate-[shake_0.5s_ease-in-out]">
                  <div className="absolute inset-0 bg-red-500 rounded-2xl blur opacity-30"></div>
                  <div className="relative flex items-center gap-3 p-4 bg-red-500/20 border border-red-500/30 rounded-2xl backdrop-blur-xl">
                    <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-red-200 text-sm font-medium">{error}</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full py-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-bold rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-[1.02] active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
              >
                <div className={`absolute inset-0 transition-opacity duration-500 ${isRegister ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600'} opacity-0 group-hover:opacity-100`}></div>
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 blur-xl transition-opacity"></div>
                <span className="relative flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                      {isRegister ? 'Creating Account...' : 'Signing In...'}
                    </>
                  ) : (
                    <>
                      {isRegister ? 'Create Account' : 'Sign In'}
                      <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </span>
              </button>
            </form>

            <div className="mt-6 text-center">
              <button 
                type="button" 
                onClick={() => handleSwitchMode(isRegister ? 'login' : 'register')}
                className="text-gray-400 text-sm hover:text-white transition-colors"
              >
                {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <div className="px-4 py-2 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 text-white text-sm font-medium flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            Secure & Encrypted
          </div>
          <div className="px-4 py-2 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 text-white text-sm font-medium flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
            Real-time Chat
          </div>
          <div className="px-4 py-2 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 text-white text-sm font-medium flex items-center gap-2">
            <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></span>
            100% Free
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;