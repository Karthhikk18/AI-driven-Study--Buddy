import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { authApi } from '../services/api';
import { ArrowRight, KeyRound, Mail, CheckCircle2, ShieldAlert, Cpu, BookOpen, ShieldCheck, Sparkles } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1); // 1: Send OTP, 2: Reset with OTP

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Forgot Password fields
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [demoOtp, setDemoOtp] = useState<string | null>(null);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const setAuth = useStore((s) => s.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isForgotMode) {
        if (forgotStep === 1) {
          // Send OTP
          const res = await authApi.forgotPassword(email);
          setSuccessMsg(res.data.message);
          if (res.data.otp_demo) {
            setDemoOtp(res.data.otp_demo);
            setOtpCode(res.data.otp_demo); // Auto-fill for instant seamless verification!
          }
          setForgotStep(2);
        } else {
          // Reset Password with OTP
          if (newPassword !== confirmPassword) {
            setError('New password and confirm password do not match.');
            setLoading(false);
            return;
          }
          const res = await authApi.resetPassword({
            email,
            otp: otpCode,
            new_password: newPassword
          });
          setSuccessMsg(res.data.message);
          setTimeout(() => {
            setIsForgotMode(false);
            setForgotStep(1);
            setSuccessMsg('Password updated successfully. Please sign in with your new password.');
          }, 1500);
        }
      } else if (isLogin) {
        const res = await authApi.login({ email, password });
        setAuth(res.data.access_token, { id: res.data.user_id, name: res.data.name, email });
      } else {
        const res = await authApi.register({ name, email, password });
        setAuth(res.data.access_token, { id: res.data.user_id, name, email });
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || 'Operation failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-notion-lightBg dark:bg-notion-darkBg p-4">
      <div className="w-full max-w-md bg-notion-lightSurface dark:bg-notion-darkSurface border border-notion-lightBorder dark:border-notion-darkBorder rounded-2xl shadow-xl p-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-notion-accent text-white flex items-center justify-center font-bold text-lg shadow-md">
            OS
          </div>
          <div>
            <h1 className="text-xl font-bold">AI Study Buddy</h1>
            <p className="text-xs text-notion-lightMuted dark:text-notion-darkMuted">AI Learning Operating System</p>
          </div>
        </div>

        {!isForgotMode ? (
          <div className="grid grid-cols-2 bg-notion-lightBg dark:bg-notion-darkBg p-1 rounded-lg mb-6 border border-notion-lightBorder dark:border-notion-darkBorder text-xs font-medium">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`py-1.5 rounded-md transition-colors ${isLogin ? 'bg-notion-lightSurface dark:bg-notion-darkSurface shadow-sm font-semibold' : 'text-notion-lightMuted dark:text-notion-darkMuted'}`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`py-1.5 rounded-md transition-colors ${!isLogin ? 'bg-notion-lightSurface dark:bg-notion-darkSurface shadow-sm font-semibold' : 'text-notion-lightMuted dark:text-notion-darkMuted'}`}
            >
              Register
            </button>
          </div>
        ) : (
          <div className="mb-6 flex items-center justify-between border-b border-notion-lightBorder dark:border-notion-darkBorder pb-3">
            <div className="flex items-center space-x-2">
              <KeyRound className="w-4 h-4 text-notion-accent" />
              <h3 className="font-bold text-sm">Reset Password via OTP</h3>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsForgotMode(false);
                setError('');
                setSuccessMsg('');
              }}
              className="text-xs text-notion-accent hover:underline font-medium"
            >
              Back to Sign In
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-lg flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs rounded-lg flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {demoOtp && isForgotMode && forgotStep === 2 && (
          <div className="mb-4 p-3 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/30 text-notion-accent text-xs rounded-xl flex items-center justify-between shadow-sm">
            <div>
              <div className="flex items-center space-x-1.5 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                <span>Verification OTP Code:</span>
              </div>
              <p className="text-[10px] text-notion-lightMuted dark:text-notion-darkMuted mt-0.5">
                Auto-filled & ready for instant reset
              </p>
            </div>
            <span className="font-mono text-base font-extrabold bg-notion-accent text-white px-3 py-1 rounded-lg tracking-widest shadow">
              {demoOtp}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {isForgotMode ? (
            forgotStep === 1 ? (
              <div>
                <label className="block font-medium mb-1">Registered Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@university.edu"
                    className="w-full px-3 py-2 pl-9 border rounded-lg bg-transparent border-notion-lightBorder dark:border-notion-darkBorder outline-none focus:border-notion-accent"
                  />
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-notion-lightMuted" />
                </div>
                <p className="text-[11px] text-notion-lightMuted dark:text-notion-darkMuted mt-1">
                  Enter your email address to generate an instant security OTP verification code.
                </p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block font-medium mb-1">6-Digit OTP Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    className="w-full px-3 py-2 border rounded-lg bg-transparent border-notion-lightBorder dark:border-notion-darkBorder outline-none focus:border-notion-accent font-mono text-center tracking-widest text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border rounded-lg bg-transparent border-notion-lightBorder dark:border-notion-darkBorder outline-none focus:border-notion-accent"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border rounded-lg bg-transparent border-notion-lightBorder dark:border-notion-darkBorder outline-none focus:border-notion-accent"
                  />
                </div>
              </>
            )
          ) : (
            <>
              {!isLogin && (
                <div>
                  <label className="block font-medium mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Johnson"
                    className="w-full px-3 py-2 border rounded-lg bg-transparent border-notion-lightBorder dark:border-notion-darkBorder outline-none focus:border-notion-accent"
                  />
                </div>
              )}

              <div>
                <label className="block font-medium mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@university.edu"
                  className="w-full px-3 py-2 border rounded-lg bg-transparent border-notion-lightBorder dark:border-notion-darkBorder outline-none focus:border-notion-accent"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-medium">Password</label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotMode(true);
                        setForgotStep(1);
                        setError('');
                        setSuccessMsg('');
                      }}
                      className="text-[11px] text-notion-accent hover:underline font-medium"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border rounded-lg bg-transparent border-notion-lightBorder dark:border-notion-darkBorder outline-none focus:border-notion-accent"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-notion-accent hover:bg-notion-accentHover text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm shadow-md"
          >
            <span>
              {loading
                ? 'Processing...'
                : isForgotMode
                ? forgotStep === 1
                  ? 'Send OTP Code'
                  : 'Reset Password'
                : isLogin
                ? 'Sign In to Workspace'
                : 'Create Account'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-notion-lightBorder dark:border-notion-darkBorder grid grid-cols-3 gap-2 text-center text-[10px] text-notion-lightMuted dark:text-notion-darkMuted">
          <div className="flex flex-col items-center">
            <Cpu className="w-4 h-4 mb-1 text-notion-accent" />
            <span>OpenCV OCR</span>
          </div>
          <div className="flex flex-col items-center">
            <BookOpen className="w-4 h-4 mb-1 text-emerald-500" />
            <span>RAG Engine</span>
          </div>
          <div className="flex flex-col items-center">
            <ShieldCheck className="w-4 h-4 mb-1 text-purple-500" />
            <span>OTP Security</span>
          </div>
        </div>
      </div>
    </div>
  );
};
