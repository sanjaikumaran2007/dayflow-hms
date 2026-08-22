import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/hrms';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Lock,
  Mail,
  ShieldCheck,
  UserCheck,
  Sparkles,
  Building2,
  KeyRound,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  UserPlus,
  LogIn,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type AuthMode = 'SIGN_IN' | 'REGISTER' | 'VERIFY_CODE';

export const Login: React.FC = () => {
  const { login, signUp, sendVerificationCode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<AuthMode>('SIGN_IN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('EMPLOYEE');
  const [jobTitle, setJobTitle] = useState('');
  
  // Verification code state (6 digits)
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [codeCopied, setCodeCopied] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const demoAccounts = [
    {
      name: 'Alexander Reed',
      email: 'admin@dayflow.com',
      role: 'ADMIN' as UserRole,
      title: 'VP Technology / Admin',
      badgeColor: 'bg-purple-100 text-purple-700 border-purple-200',
    },
    {
      name: 'Eleanor Vance',
      email: 'hr@dayflow.com',
      role: 'HR' as UserRole,
      title: 'Head of People & Culture',
      badgeColor: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    },
    {
      name: 'John Doe',
      email: 'john.doe@dayflow.com',
      role: 'EMPLOYEE' as UserRole,
      title: 'Staff Full-Stack Architect',
      badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    },
    {
      name: 'Jane Smith',
      email: 'jane.smith@dayflow.com',
      role: 'EMPLOYEE' as UserRole,
      title: 'Principal Product Designer',
      badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    },
  ];

  // Handle countdown for resend code
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleQuickSelect = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setError('');
    setInfoMessage('');
  };

  // Direct Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your work email');
      return;
    }
    setLoading(true);
    setError('');
    setInfoMessage('');

    try {
      await login(email, password);
      if (email.includes('admin')) navigate('/admin/dashboard');
      else if (email.includes('hr')) navigate('/hr/dashboard');
      else navigate('/employee/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  // Start registration and request 6-digit email code
  const handleRequestRegistrationCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !fullName) {
      setError('Please provide your full name and work email');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await sendVerificationCode(email);
      setSimulatedCode(res.code);
      setResendCooldown(60);
      setMode('VERIFY_CODE');
      setInfoMessage(`A 6-digit verification code was generated for ${email}`);
    } catch (err: any) {
      setError(err.message || 'Could not send verification code');
    } finally {
      setLoading(false);
    }
  };

  // Resend code handler
  const handleResendCode = async () => {
    if (resendCooldown > 0 || !email) return;
    setLoading(true);
    setError('');
    try {
      const res = await sendVerificationCode(email);
      setSimulatedCode(res.code);
      setResendCooldown(60);
      setInfoMessage(`New verification code sent to ${email}`);
    } catch (err: any) {
      setError(err.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  // OTP input keystrokes
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Paste handling
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newDigits = [...otpDigits];
      digits.forEach((d, idx) => {
        if (index + idx < 6) newDigits[index + idx] = d;
      });
      setOtpDigits(newDigits);
      const nextIdx = Math.min(index + digits.length, 5);
      inputRefs.current[nextIdx]?.focus();
      return;
    }

    const digit = value.replace(/\D/g, '');
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Auto-fill code from simulation banner
  const handleAutofillCode = () => {
    if (!simulatedCode) return;
    const digits = simulatedCode.split('').slice(0, 6);
    setOtpDigits(digits);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2500);
  };

  // Final verification & account creation
  const handleVerifyAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = otpDigits.join('');
    if (fullCode.length < 6) {
      setError('Please enter all 6 digits of your verification code');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await signUp({
        name: fullName,
        email,
        password,
        role,
        code: fullCode,
        jobTitle,
      });

      // Redirect based on role
      if (role === 'ADMIN') navigate('/admin/dashboard');
      else if (role === 'HR') navigate('/hr/dashboard');
      else navigate('/employee/dashboard');
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* Left Branding Showcase */}
      <div className="hidden md:flex flex-1 flex-col justify-between p-12 bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center font-black text-2xl text-indigo-300 border border-white/20">
              D
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Dayflow HRMS</h1>
              <p className="text-xs text-indigo-200 font-medium">Secure Workplace & Identity Management</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-lg space-y-6 my-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-indigo-200 text-xs font-semibold backdrop-blur-xs border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            <span>Enterprise Security & Email Verification</span>
          </div>

          <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight text-white">
            Transforming workforce operations with verified security.
          </h2>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <Building2 className="w-5 h-5 text-indigo-300 mb-2" />
              <h4 className="text-sm font-semibold">Department Governance</h4>
              <p className="text-xs text-indigo-200/70 mt-1">Hierarchical team directories and budget controls.</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <ShieldCheck className="w-5 h-5 text-indigo-300 mb-2" />
              <h4 className="text-sm font-semibold">Email Code Authentication</h4>
              <p className="text-xs text-indigo-200/70 mt-1">6-digit verification codes for secure account sign-up.</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-indigo-300/80">
          © 2026 Dayflow Technologies Inc. All rights reserved.
        </div>
      </div>

      {/* Right Auth Forms */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-6"
        >
          {/* Mobile Logo */}
          <div className="md:hidden text-center mb-4">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg mb-2">
              D
            </div>
            <h2 className="text-xl font-bold text-slate-900">Dayflow HRMS</h2>
            <p className="text-xs text-slate-500">Sign in to your workplace account</p>
          </div>

          {/* Mode Switch Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              id="auth-tab-signin"
              onClick={() => {
                setMode('SIGN_IN');
                setError('');
                setInfoMessage('');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'SIGN_IN'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              id="auth-tab-register"
              onClick={() => {
                setMode('REGISTER');
                setError('');
                setInfoMessage('');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                mode === 'REGISTER' || mode === 'VERIFY_CODE'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
          </div>

          {/* Header Title */}
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              {mode === 'SIGN_IN'
                ? 'Welcome back'
                : mode === 'REGISTER'
                ? 'Create your HRMS account'
                : 'Verify your work email'}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {mode === 'SIGN_IN'
                ? 'Sign in with your email & password or select a demo profile.'
                : mode === 'REGISTER'
                ? 'Enter your details. We will send a 6-digit verification code to your email.'
                : `Enter the 6-digit code sent to ${email} to activate your profile.`}
            </p>
          </div>

          {/* Simulated Email Verification Code Box */}
          {simulatedCode && (
            <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start justify-between gap-3 animate-in fade-in">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-blue-950">
                  <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Incoming Email Simulation</span>
                </div>
                <p className="text-[11px] text-blue-800">
                  Your 6-digit verification code is: <strong className="font-mono text-sm tracking-widest text-blue-950">{simulatedCode}</strong>
                </p>
              </div>
              <button
                type="button"
                id="btn-autofill-otp"
                onClick={handleAutofillCode}
                className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] cursor-pointer shadow-xs transition-colors"
              >
                {codeCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{codeCopied ? 'Filled' : 'Fill Code'}</span>
              </button>
            </div>
          )}

          {/* Error & Info Alerts */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {infoMessage && !error && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* MODE 1: SIGN IN */}
          {mode === 'SIGN_IN' && (
            <div className="space-y-5">
              {/* Demo Persona Quick Switchers */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Quick Demo Personas (1-Click Autofill)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {demoAccounts.map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      id={`demo-user-${acc.role.toLowerCase()}-${acc.name.split(' ')[0].toLowerCase()}`}
                      onClick={() => handleQuickSelect(acc.email)}
                      className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                        email === acc.email
                          ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {acc.name}
                        </span>
                        <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md border ${acc.badgeColor}`}>
                          {acc.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {acc.email}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSignIn} className="space-y-4">
                <Input
                  id="login-email-input"
                  label="Work Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. admin@dayflow.com"
                  leftIcon={<Mail className="w-4 h-4" />}
                  required
                />

                <Input
                  id="login-password-input"
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  leftIcon={<Lock className="w-4 h-4" />}
                  helperText="Default password is prefilled (password123)"
                  required
                />

                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!email) {
                        setError('Please enter your email above to reset password');
                        return;
                      }
                      try {
                        const res = await sendVerificationCode(email);
                        setSimulatedCode(res.code);
                        setMode('VERIFY_CODE');
                        setInfoMessage(`Verification code sent to reset password for ${email}`);
                      } catch (err: any) {
                        setError(err.message || 'Failed to send reset code');
                      }
                    }}
                    className="text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>

                <Button
                  id="login-submit-btn"
                  type="submit"
                  size="lg"
                  className="w-full mt-2"
                  isLoading={loading}
                  rightIcon={<UserCheck className="w-4 h-4" />}
                >
                  Sign In to Dayflow
                </Button>
              </form>
            </div>
          )}

          {/* MODE 2: REGISTER (EMAIL + PASSWORD + REQUEST CODE) */}
          {mode === 'REGISTER' && (
            <form onSubmit={handleRequestRegistrationCode} className="space-y-4">
              <Input
                id="register-name-input"
                label="Full Name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Sarah Jenkins"
                leftIcon={<UserCheck className="w-4 h-4" />}
                required
              />

              <Input
                id="register-email-input"
                label="Work Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. sarah.jenkins@company.com"
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Account Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['EMPLOYEE', 'HR', 'ADMIN'] as UserRole[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      id={`register-role-${r.toLowerCase()}`}
                      onClick={() => setRole(r)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        role === r
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <Input
                id="register-job-input"
                label="Job Title (Optional)"
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
                leftIcon={<Building2 className="w-4 h-4" />}
              />

              <Input
                id="register-password-input"
                label="Create Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />

              <Button
                id="register-send-code-btn"
                type="submit"
                size="lg"
                className="w-full mt-2"
                isLoading={loading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Send 6-Digit Email Code
              </Button>
            </form>
          )}

          {/* MODE 3: ENTER 6-DIGIT VERIFICATION CODE */}
          {mode === 'VERIFY_CODE' && (
            <form onSubmit={handleVerifyAndSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-center text-xs font-bold uppercase tracking-wider text-slate-600">
                  Enter 6-Digit Verification Code
                </label>
                <div className="flex justify-between gap-2 sm:gap-2.5">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (inputRefs.current[idx] = el)}
                      id={`otp-input-${idx}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      className="w-12 h-13 sm:w-13 sm:h-14 text-center text-xl font-mono font-bold text-black bg-white border-2 border-slate-300 rounded-xl focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all shadow-xs"
                      autoFocus={idx === 0}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <button
                  type="button"
                  onClick={() => setMode('REGISTER')}
                  className="text-slate-600 hover:text-slate-900 font-semibold cursor-pointer"
                >
                  &larr; Back to edit details
                </button>

                <button
                  type="button"
                  id="btn-resend-otp"
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0 || loading}
                  className={`font-semibold flex items-center gap-1 cursor-pointer ${
                    resendCooldown > 0
                      ? 'text-slate-400 cursor-not-allowed'
                      : 'text-indigo-600 hover:text-indigo-700'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}</span>
                </button>
              </div>

              <Button
                id="verify-submit-btn"
                type="submit"
                size="lg"
                className="w-full"
                isLoading={loading}
                rightIcon={<KeyRound className="w-4 h-4" />}
              >
                Verify Code & Activate Account
              </Button>
            </form>
          )}

          {/* Clean Security Badge footer */}
          <div className="p-3 rounded-xl bg-slate-50 text-slate-600 text-[11px] leading-relaxed border border-slate-200/80 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              <strong>Verified Authentication:</strong> Email verification code with secure session token and local database persistence.
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

