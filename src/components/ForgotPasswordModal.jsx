import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, KeyRound, CheckCircle2, ArrowRight } from 'lucide-react';

export default function ForgotPasswordModal({ isOpen, onClose, onShowToast }) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      onShowToast('Password reset link sent to your email!');
    }, 1000);
  };

  const handleClose = () => {
    setSubmitted(false);
    setEmail('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="modal-overlay"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: 'spring', stiffness: 450, damping: 32 }}
            className="modal-card-styled"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <motion.button
              whileHover={{ scale: 1.1, backgroundColor: '#E2E8F0' }}
              whileTap={{ scale: 0.95 }}
              className="modal-close-icon-btn"
              onClick={handleClose}
            >
              <X size={16} />
            </motion.button>

            {!submitted ? (
              <div>
                {/* Header Icon + Text */}
                <div className="modal-header-block">
                  <div className="modal-badge-icon">
                    <KeyRound size={20} />
                  </div>
                  <div className="modal-header-text">
                    <h3 className="modal-main-title">Reset your password</h3>
                    <p className="modal-sub-text">
                      Enter your email address below and we'll send you instructions to reset your password.
                    </p>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="modal-form-body">
                  <div className="modal-input-group">
                    <label className="modal-input-label">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="name@agency.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="modal-text-input"
                    />
                  </div>

                  {/* Actions Group */}
                  <div className="modal-actions-group">
                    <motion.button
                      type="button"
                      whileHover={{ backgroundColor: '#E2E8F0' }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleClose}
                      className="modal-btn-cancel"
                    >
                      Cancel
                    </motion.button>

                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileHover={{ scale: 1.02, backgroundColor: '#16a360' }}
                      whileTap={{ scale: 0.98 }}
                      className="modal-btn-submit"
                    >
                      {loading ? (
                        <span>Sending link...</span>
                      ) : (
                        <>
                          <span>Send Reset Link</span>
                          <ArrowRight size={14} />
                        </>
                      )}
                    </motion.button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="modal-success-block">
                <div className="modal-success-icon">
                  <CheckCircle2 size={28} />
                </div>
                <h3 className="modal-main-title">Check your inbox</h3>
                <p className="modal-sub-text">
                  We have sent a password reset link to <strong className="text-dark">{email}</strong>.
                </p>
                <motion.button
                  onClick={handleClose}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="modal-btn-submit full-width"
                >
                  Return to Sign In
                </motion.button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
