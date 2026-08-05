import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Lock, Mail, AlertCircle, User } from 'lucide-react';
import { useToast } from '../../context/ToastContext.js';
import { api, ApiError } from '../../lib/apiClient.js';

interface LoginProps {
  onLogin: (token: string, email: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const { showToast } = useToast();
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const onSubmit = async (data: any) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const endpoint = isSignUp ? '/api/auth/register' : '/api/auth/login';
      const response = await api.post<{ token: string; user: { id: string; email: string; role: string; name: string } }>(
        endpoint,
        {
          email: data.email,
          password: data.password,
          name: data.name || data.email.split('@')[0]
        }
      );

      onLogin(response.token, data.email);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'github') => {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocalhost) {
      showToast(`ℹ ${provider} login initiated. Redirecting to OAuth callback...`, 'info');
      onLogin(`mock-${provider}-token`, `${provider}-user@jobmonitor.com`);
      return;
    }

    try {
      const origin = window.location.origin;
      const response = await api.get<{ url: string }>(`/api/auth/oauth/${provider}?origin=${encodeURIComponent(origin)}`);
      if (response.url) {
        window.location.href = response.url;
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to generate OAuth redirect link');
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0b0f19] px-4">
      <div className="w-full max-w-md bg-[#131a26] border border-[#232d3f] rounded-2xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-fluid-title font-extrabold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-sm text-[#94a3b8]">
            {isSignUp ? 'Register to start tracking jobs' : 'Sign in to access your Job Monitor Dashboard'}
          </p>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {isSignUp && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 w-5 h-5 text-[#94a3b8]" />
                <input
                  type="text"
                  placeholder="John Doe"
                  {...register('name', { required: 'Name is required' })}
                  className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-indigo-600"
                />
              </div>
              {errors.name && <span className="text-xs text-red-500">{String(errors.name.message)}</span>}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-5 h-5 text-[#94a3b8]" />
              <input
                type="email"
                placeholder="you@domain.com"
                {...register('email', { required: 'Email is required' })}
                className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-indigo-600"
              />
            </div>
            {errors.email && <span className="text-xs text-red-500">{String(errors.email.message)}</span>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#94a3b8] uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-5 h-5 text-[#94a3b8]" />
              <input
                type="password"
                placeholder="••••••••"
                {...register('password', { required: 'Password is required' })}
                className="w-full bg-[#1b2535] border border-[#232d3f] rounded-xl py-3 pl-10 pr-4 text-sm text-white placeholder-[#6b7280] focus:outline-none focus:border-indigo-600"
              />
            </div>
            {errors.password && <span className="text-xs text-red-500">{String(errors.password.message)}</span>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 py-3 rounded-xl font-bold text-sm text-white transition duration-200 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-[#232d3f]"></div>
          <span className="flex-shrink mx-4 text-[#94a3b8] text-xs">Or continue with</span>
          <div className="flex-grow border-t border-[#232d3f]"></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleOAuth('google')}
            className="flex items-center justify-center gap-2 bg-[#1b2535] hover:bg-[#232d3f] border border-[#232d3f] text-white py-2.5 rounded-xl text-xs font-bold transition duration-200 cursor-pointer"
          >
            <svg className="w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="currentColor"><path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.466 0-6.277-2.85-6.277-6.36s2.811-6.358 6.277-6.358c1.554 0 2.966.577 4.056 1.524l3.136-3.136C19.24 2.128 15.96 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c6.478 0 11.753-4.664 11.753-11.24 0-.765-.088-1.503-.235-2.215H12.24z"/></svg> Google
          </button>
          <button
            onClick={() => handleOAuth('github')}
            className="flex items-center justify-center gap-2 bg-[#1b2535] hover:bg-[#232d3f] border border-[#232d3f] text-white py-2.5 rounded-xl text-xs font-bold transition duration-200 cursor-pointer"
          >
            <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.11.82-.26.82-.577v-2.234c-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22v3.293c0 .319.22.694.825.576C20.565 21.795 24 17.3 24 12c0-6.63-5.37-12-12-12z"/></svg> GitHub
          </button>
        </div>

        <div className="text-center pt-2">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-bold transition duration-200 cursor-pointer"
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
};
