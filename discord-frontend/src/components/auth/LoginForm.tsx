// src/components/auth/LoginForm.tsx
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { authService } from '@/services/authService';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const LoginForm = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Please enter a valid email';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    setErrors({});
    try {
      const response = await authService.login(formData);
      // if (!response.ok) throw new Error('Invalid credentials');
      console.log('Login successful');
      router.push('/chat');
    } catch (error) {
      setErrors({ general: 'Invalid email or password. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0f0f0f] text-white flex items-center justify-center px-6 py-12">
      <div className="absolute inset-0 bg-gradient-to-br from-[#9cbc9c]/5 via-transparent to-[#c9a896]/5" />
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <Link href="/" className="text-[#9cbc9c] text-3xl font-light mb-6 block hover:opacity-80 transition-opacity duration-300">
            ← Cone
          </Link>
          <h1 className="text-4xl font-light mb-3 bg-gradient-to-b from-white to-gray-300 bg-clip-text text-transparent">
            Welcome Back
          </h1>
          <p className="text-gray-400 text-lg">Sign in to continue your conversations</p>
        </div>

        <div className="bg-gray-900/40 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 shadow-2xl animate-scale-in relative">
          <div className="absolute inset-0 bg-gradient-to-r from-[#9cbc9c]/10 to-[#c9a896]/10 rounded-2xl blur-xl -z-10" />
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.general && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm animate-fade-in">
                {errors.general}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full bg-gray-800/50 border ${
                  errors.email ? 'border-red-500/50' : 'border-gray-600/50'
                } rounded-xl px-4 py-4 text-white placeholder-gray-400 focus:border-[#9cbc9c]/50 focus:outline-none focus:ring-2 focus:ring-[#9cbc9c]/20 transition-all duration-300 backdrop-blur-sm`}
                placeholder="Enter your email"
                disabled={isLoading}
              />
              {errors.email && <p className="text-red-400 text-sm animate-fade-in">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-gray-300">Password</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`w-full bg-gray-800/50 border ${
                    errors.password ? 'border-red-500/50' : 'border-gray-600/50'
                  } rounded-xl px-4 py-4 pr-12 text-white placeholder-gray-400 focus:border-[#9cbc9c]/50 focus:outline-none focus:ring-2 focus:ring-[#9cbc9c]/20 transition-all duration-300 backdrop-blur-sm`}
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors duration-200"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-sm animate-fade-in">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#9cbc9c] to-[#8ca88c] text-black py-4 rounded-xl font-medium text-lg hover:scale-105 hover:shadow-lg hover:shadow-[#9cbc9c]/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          <p className="text-center text-gray-400 mt-8 text-sm">
            Don't have an account?{' '}
            <Link href="/auth/register" className="text-[#9cbc9c] hover:underline hover:text-[#8ca88c] transition-colors duration-200 font-medium">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
