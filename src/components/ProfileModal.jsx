import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Shield, Lock, Check } from 'lucide-react';

export default function ProfileModal({ isOpen, user, onClose, onSave, onShowToast }) {
  const [fullName, setFullName] = useState(user?.full_name || 'Super Admin');
  const [email, setEmail] = useState(user?.email || 'admin@kodevio.com');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setSaving(true);

    setTimeout(() => {
      setSaving(false);

      const updatedUser = {
        ...user,
        full_name: fullName,
        email: email,
      };

      // Save to localStorage
      localStorage.setItem('kodevio_user', JSON.stringify(updatedUser));

      if (onSave) {
        onSave(updatedUser);
      }

      if (onShowToast) {
        onShowToast();
      }

      onClose();
    }, 600);
  };

  return (
    <AnimatePresence>
      <div className="modal-overlay">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="modal-card-styled profile-modal-card"
        >
          {/* Close Icon Button */}
          <button type="button" onClick={onClose} className="modal-close-icon-btn">
            <X size={16} />
          </button>

          {/* Modal Header */}
          <div className="profile-modal-header mb-5">
            <div className="avatar-header-row mb-3">
              <div className="avatar-circle-lg">
                {fullName ? fullName.charAt(0) : 'A'}
              </div>
              <div>
                <h3 className="profile-modal-title">Edit Account Profile</h3>
                <p className="profile-modal-subtitle">
                  Update your Kodevio administrator credentials and preferences
                </p>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="folk-inputs-form">
            <div className="folk-field">
              <label className="folk-label flex items-center gap-1.5">
                <User size={14} className="text-slate-400" />
                <span>Full Name</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter full name"
                className="folk-input"
              />
            </div>

            <div className="folk-field">
              <label className="folk-label flex items-center gap-1.5">
                <Mail size={14} className="text-slate-400" />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email address"
                className="folk-input"
              />
            </div>

            <div className="folk-field">
              <label className="folk-label flex items-center gap-1.5">
                <Shield size={14} className="text-slate-400" />
                <span>Account Role</span>
              </label>
              <div className="role-read-badge">
                <span>{user?.role === 'super_admin' ? 'Super Admin' : 'Agency Admin'}</span>
                <span className="read-only-pill">SYSTEM MANAGED</span>
              </div>
            </div>

            <div className="folk-field">
              <label className="folk-label flex items-center gap-1.5">
                <Lock size={14} className="text-slate-400" />
                <span>New Password (Optional)</span>
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Leave blank to keep current password"
                className="folk-input"
              />
            </div>

            {/* Action Buttons */}
            <div className="profile-modal-footer mt-4">
              <button type="button" onClick={onClose} className="dash-secondary-btn">
                Cancel
              </button>
              <motion.button
                type="submit"
                disabled={saving}
                whileHover={{ scale: 1.01, backgroundColor: '#000000' }}
                whileTap={{ scale: 0.98 }}
                className="folk-primary-btn save-profile-btn"
              >
                {saving ? 'Saving...' : 'Save Profile Changes'}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
