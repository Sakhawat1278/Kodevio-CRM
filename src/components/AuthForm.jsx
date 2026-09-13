import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ShieldAlert, ArrowLeft, AlertCircle } from 'lucide-react';
import { loginUser } from '../api/client';

export default function AuthForm({ onShowToast, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isForgotView, setIsForgotView] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setErrorMessage('');

    try {
      const data = await loginUser(email, password);
      setLoading(false);
      
      // Trigger Siri preloader-style green checkmark orb
      onShowToast();

      if (onLoginSuccess) {
        onLoginSuccess(data.user);
      }
    } catch (err) {
      setLoading(false);
      setErrorMessage(err.message || 'Invalid email or password');
    }
  };

  return (
    <div className="folk-form-stack">
      {/* Main Heading */}
      <div className="folk-header">
        <h1 className="folk-title">Welcome to Kodevio</h1>
        <p className="folk-subtitle">
          Fiverr agency automation designed for Kodevio Limited teams & workflows
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!isForgotView ? (
          /* Main Login Form View */
          <motion.form
            key="login-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            onSubmit={handleSubmit}
            className="folk-inputs-form"
          >
            {/* Live API Error Notice */}
            <AnimatePresence>
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="auth-error-banner"
                >
                  <AlertCircle size={15} className="text-red-600 shrink-0" />
                  <span>{errorMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="folk-field">
              <label className="folk-label">Email</label>
              <input
                type="email"
                required
                placeholder="Type your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrorMessage('');
                }}
                className="folk-input"
              />
            </div>

            <div className="folk-field">
              {/* Password Label Row with Explicit Flex Space-Between */}
              <div className="password-label-row">
                <label className="folk-label">Password</label>
                <button
                  type="button"
                  onClick={() => setIsForgotView(true)}
                  className="forgot-password-link"
                >
                  Forgot password?
                </button>
              </div>
              <div className="input-relative-box">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMessage('');
                  }}
                  className="folk-input"
                />
                <button
                  type="button"
                  className="password-eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Action Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.005, backgroundColor: '#000000' }}
              whileTap={{ scale: 0.985 }}
              className="folk-primary-btn"
            >
              {loading ? 'Authenticating...' : 'Sign in'}
            </motion.button>
          </motion.form>
        ) : (
          /* Unboxed Admin Reset Notice View */
          <motion.div
            key="forgot-admin-unboxed"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="unboxed-notice-stack"
          >
            <div className="unboxed-icon-badge">
              <ShieldAlert size={22} className="text-amber-600" />
            </div>

            <h3 className="unboxed-notice-title">Contact Administrator</h3>

            <p className="unboxed-notice-text">
              For security reasons, password resets for Kodevio Limited accounts are managed by your workspace administrator.
            </p>

            <p className="unboxed-email-text">
              Please contact your Kodevio admin or email <strong className="text-dark">admin@kodevio.com</strong>
            </p>

            <motion.button
              type="button"
              whileHover={{ scale: 1.005, backgroundColor: '#000000' }}
              whileTap={{ scale: 0.985 }}
              onClick={() => setIsForgotView(false)}
              className="folk-primary-btn back-to-signin-btn"
            >
              <ArrowLeft size={16} />
              <span>Back to Sign In</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
