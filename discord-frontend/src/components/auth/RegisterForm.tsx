// src/components/auth/RegisterForm.tsx
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { authService } from '@/services/authService';
import { useRouter } from 'next/navigation';
import { debounce } from '@/utils/debounce';
const RegisterForm = () => {
  const router = useRouter();
  // 💡 Same logic you already wrote...
  const [formData, setFormData] = useState({
    // name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'available' | 'taken' | 'checking' | null>(null);
  const [errors, setErrors] = useState<{
    // name?: string;
    email?: string;
    username?: string;
    password?: string;
    confirmPassword?: string;
    otp?: string;
    general?: string;
  }>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    if (name === 'username') {
      checkUsernameAvailability(value.trim());
    }
  };

  const validateStep1 = () => {
    const newErrors: typeof errors = {};

    // if (!formData.name) newErrors.name = 'Full name is required';
    // else if (formData.name.length < 3) newErrors.name = 'Min 3 characters';

    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

     if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // if (!formData.email) newErrors.email = 'Email is required';
    // else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email';
    // if (!formData.password) newErrors.password = 'Password is required';
    // else if (formData.password.length < 6) newErrors.password = 'Min 6 characters';
    // if (!formData.confirmPassword) newErrors.confirmPassword = 'Confirm password';
    // else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep1()) return;

    setIsLoading(true);
    setErrors({});

    try{
      // await new Promise((resolve)=> setTimeout(resolve, 2000)); // Simulate API call
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/send-otp`,{
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,

          // username: formData.username
        })
      })
      const result = await response.json();
      if (!result.success) {
        setErrors({ general: result.message || 'OTP sending failed' });
        return;
      }
      console.log("Sending Otp to email:", formData.email);
      setOtpSent(true);
    }catch(error){
      console.error('Error sending OTP:', error);
      setErrors({ general: 'Failed to send OTP. Please try again.' });
    }finally{
      setIsLoading(false);
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      setErrors({ otp: 'Please enter the 6-digit OTP code' });
      return;
    }
    
    setIsLoading(true);
    setErrors({});
    
    try {
      // Simulate API call to verify OTP and create account
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          otp: otp,
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setErrors({ general: result.message || 'Registration failed' });
        return;
      }

      // ✅ Navigate to login page or dashboard
      router.push('/auth/login');
      
      console.log('Verifying OTP and creating account:', {
        ...formData,
        otp
      }); 
      console.log('Success!');
    } catch (err) {
      console.error('Error verifying OTP:', err);
      setErrors({ general: 'Verification failed. Please try again' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      // Simulate API call to resend OTP
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Resending OTP to:', formData.email);
    } catch (error) {
      setErrors({ general: 'Failed to resend OTP. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const checkUsernameAvailability = debounce(async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameStatus(null);
      return;
    }

    setUsernameStatus('checking');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/user/check-username`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });
      const result = await res.json();

      if (result?.data?.available) {
        setUsernameStatus('available');
      } else {
        setUsernameStatus('taken');
      }
    } catch (err) {
      console.error('Username check failed', err);
      setUsernameStatus(null);
    }
  }, 500);

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white flex items-center justify-center px-6 py-12">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#9cbc9c]/5 via-transparent to-[#c9a896]/5"></div>
      
      {/* Main card */}
      <div className="relative w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-8 animate-fade-in">
          <Link 
            href="/" 
            className="text-[#9cbc9c] text-3xl font-light mb-6 block hover:opacity-80 transition-opacity duration-300"
          >
            ← Cone
          </Link>
          <h1 className="text-2xl font-semibold text-[#9cbc9c] mb-3">
            {otpSent ? 'Verify Your Email' : 'Join Cone'}
          </h1>
          <p className="text-white/60 text-sm">
            {otpSent 
              ? `We sent a verification code to ${formData.email}`
              : 'Create your account to begin connecting'
            }
          </p>
        </div>
        
        {/* Registration card with frosted glass effect */}
        <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl animate-scale-in">
          {/* Soft glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#9cbc9c]/10 to-[#c9a896]/10 rounded-2xl blur-xl -z-10"></div>
          
          {/* General error message */}
          {errors.general && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm animate-fade-in mb-6">
              {errors.general}
            </div>
          )}

          {!otpSent ? (
            /* Step 1: User Details Form */
            <form onSubmit={handleSendOtp} className="space-y-6">
              {/* Username field */}
              <div className="space-y-2">
                <label htmlFor="username" className="block text-sm font-medium text-white">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={`w-full bg-black/30 border ${
                    errors.username ? 'border-red-500/50' : 'border-white/20'
                  } rounded-md px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-[#9cbc9c]/50 focus:outline-none focus:ring-2 focus:ring-[#9cbc9c]/20 transition-all duration-300`}
                  placeholder="Choose a username"
                  disabled={isLoading}
                />
                {errors.username && (
                  <p className="text-red-400 text-sm animate-fade-in">{errors.username}</p>
                )}
                {/* {usernameStatus === 'checking' && (
                  <p className="text-sm text-yellow-400 animate-pulse">Checking availability...</p>
                )} */}
                {/* {usernameStatus === 'available' && (
                  <p className="text-sm text-green-500">Username is available </p>
                )} */}
                {usernameStatus === 'taken' && (
                  <p className="text-sm text-red-500">Username is already taken </p>
                )}
              </div>

              {/* Email field */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-white">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`w-full bg-black/30 border ${
                    errors.email ? 'border-red-500/50' : 'border-white/20'
                  } rounded-md px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-[#9cbc9c]/50 focus:outline-none focus:ring-2 focus:ring-[#9cbc9c]/20 transition-all duration-300`}
                  placeholder="Enter your email"
                  disabled={isLoading}
                />
                {errors.email && (
                  <p className="text-red-400 text-sm animate-fade-in">{errors.email}</p>
                )}
              </div>
              
              {/* Password field */}
              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-white">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`w-full bg-black/30 border ${
                      errors.password ? 'border-red-500/50' : 'border-white/20'
                    } rounded-md px-4 py-2 pr-10 text-sm text-white placeholder:text-white/40 focus:border-[#9cbc9c]/50 focus:outline-none focus:ring-2 focus:ring-[#9cbc9c]/20 transition-all duration-300`}
                    placeholder="Create a password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-400 text-sm animate-fade-in">{errors.password}</p>
                )}
              </div>
              
              {/* Confirm Password field */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-white">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`w-full bg-black/30 border ${
                      errors.confirmPassword ? 'border-red-500/50' : 'border-white/20'
                    } rounded-md px-4 py-2 pr-10 text-sm text-white placeholder:text-white/40 focus:border-[#9cbc9c]/50 focus:outline-none focus:ring-2 focus:ring-[#9cbc9c]/20 transition-all duration-300`}
                    placeholder="Confirm your password"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-400 text-sm animate-fade-in">{errors.confirmPassword}</p>
                )}
              </div>
              
              {/* Send OTP button */}
              <button
                type="submit"
                disabled={isLoading || usernameStatus === 'taken'}
                className="w-full bg-[#9cbc9c] hover:bg-[#8ca88c] text-black py-3 rounded-md font-medium text-sm hover:scale-105 hover:shadow-lg hover:shadow-[#9cbc9c]/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>Sending OTP...</span>
                  </>
                ) : (
                  <span>Send OTP</span>
                )}
              </button>
            </form>
          ) : (
            /* Step 2: OTP Verification */
            <div className="space-y-6">
              {/* Back button */}
              <button
                onClick={() => setOtpSent(false)}
                className="flex items-center space-x-2 text-white/60 hover:text-white transition-colors duration-200 mb-4"
                disabled={isLoading}
              >
                <ArrowLeft size={16} />
                <span className="text-sm">Back to details</span>
              </button>

              <form onSubmit={handleVerifyOtp} className="space-y-6">
                {/* OTP Input */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-white text-center">
                    Enter 6-digit verification code
                  </label>
                  <div className="flex justify-center">
                    <InputOTP
                      value={otp}
                      onChange={setOtp}
                      maxLength={6}
                      disabled={isLoading}
                      className="gap-2"
                    >
                      <InputOTPGroup>
                        <InputOTPSlot 
                          index={0} 
                          className="w-12 h-12 text-lg font-medium bg-black/30 border-white/20 text-white focus:border-[#9cbc9c] focus:ring-[#9cbc9c]/20"
                        />
                        <InputOTPSlot 
                          index={1} 
                          className="w-12 h-12 text-lg font-medium bg-black/30 border-white/20 text-white focus:border-[#9cbc9c] focus:ring-[#9cbc9c]/20"
                        />
                        <InputOTPSlot 
                          index={2} 
                          className="w-12 h-12 text-lg font-medium bg-black/30 border-white/20 text-white focus:border-[#9cbc9c] focus:ring-[#9cbc9c]/20"
                        />
                        <InputOTPSlot 
                          index={3} 
                          className="w-12 h-12 text-lg font-medium bg-black/30 border-white/20 text-white focus:border-[#9cbc9c] focus:ring-[#9cbc9c]/20"
                        />
                        <InputOTPSlot 
                          index={4} 
                          className="w-12 h-12 text-lg font-medium bg-black/30 border-white/20 text-white focus:border-[#9cbc9c] focus:ring-[#9cbc9c]/20"
                        />
                        <InputOTPSlot 
                          index={5} 
                          className="w-12 h-12 text-lg font-medium bg-black/30 border-white/20 text-white focus:border-[#9cbc9c] focus:ring-[#9cbc9c]/20"
                        />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  {errors.otp && (
                    <p className="text-red-400 text-sm text-center animate-fade-in">{errors.otp}</p>
                  )}
                </div>

                {/* Verify button */}
                <button
                  type="submit"
                  disabled={isLoading || otp.length !== 6}
                  className="w-full bg-[#9cbc9c] hover:bg-[#8ca88c] text-black py-3 rounded-md font-medium text-sm hover:scale-105 hover:shadow-lg hover:shadow-[#9cbc9c]/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>Verify and Create Account</span>
                  )}
                </button>

                {/* Resend OTP */}
                <div className="text-center">
                  <p className="text-white/60 text-sm mb-2">Didn't receive the code?</p>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="text-[#9cbc9c] hover:text-[#8ca88c] text-sm font-medium hover:underline transition-colors duration-200"
                  >
                    Resend OTP
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Login link */}
          {!otpSent && (
            <p className="text-center text-white/60 mt-8 text-sm">
              Already have an account?{' '}
              <Link 
                href="/auth/login" 
                className="text-[#9cbc9c] hover:underline hover:text-[#8ca88c] transition-colors duration-200 font-medium"
              >
                Sign in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
