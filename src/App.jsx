import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Preloader from './components/Preloader';
import AuthForm from './components/AuthForm';
import Dashboard from './components/Dashboard';
import ForgotPasswordModal from './components/ForgotPasswordModal';
import LegalModal from './components/LegalModal';
import SiriCircleToast from './components/SiriCircleToast';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('kodevio_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });
  // If already logged in, enter dashboard immediately on reload
  const [isLoading, setIsLoading] = useState(() => {
    try {
      const savedUser = localStorage.getItem('kodevio_user');
      return !savedUser;
    } catch (e) {
      return true;
    }
  });
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState('terms');
  const [isSiriToastVisible, setIsSiriToastVisible] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('kodevio_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed) setCurrentUser(parsed);
      } catch (e) {
        localStorage.removeItem('kodevio_user');
      }
    }
  }, []);

  const triggerSiriToast = () => {
    setIsSiriToastVisible(true);
  };

  const handleLoginSuccess = (user) => {
    if (user) {
      try {
        localStorage.setItem('kodevio_user', JSON.stringify(user));
      } catch (err) {
        console.warn('Could not persist user session:', err.message);
      }
    }
    // Brief delay to let the green checkmark Siri orb play before opening the Dashboard
    setTimeout(() => {
      setCurrentUser(user);
    }, 1500);
  };

  const handleSignOut = () => {
    localStorage.removeItem('kodevio_token');
    localStorage.removeItem('kodevio_user');
    setCurrentUser(null);
  };

  const handleUpdateUser = (updatedUser) => {
    if (updatedUser) {
      try {
        localStorage.setItem('kodevio_user', JSON.stringify(updatedUser));
      } catch (err) {
        console.warn('Could not update user session in storage:', err.message);
      }
    }
    setCurrentUser(updatedUser);
  };

  const openLegalModal = (tab) => {
    setLegalTab(tab);
    setIsLegalModalOpen(true);
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {isLoading ? (
          <Preloader key="preloader" onComplete={() => setIsLoading(false)} />
        ) : currentUser ? (
          /* Live Admin Dashboard View */
          <motion.div
            key="admin-dashboard"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <Dashboard
              user={currentUser}
              onSignOut={handleSignOut}
              onShowToast={triggerSiriToast}
              onUpdateUser={handleUpdateUser}
            />
          </motion.div>
        ) : (
          /* Minimalist Auth Page View */
          <motion.div
            key="auth-page"
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="folk-minimal-page"
          >
            {/* Top Left Kodevio Brand Logo */}
            <a href="#" className="folk-brand-logo">
              <img src="/icon.webp" alt="Kodevio Logo" className="brand-logo-img" />
              <span className="brand-name-text">Kodevio</span>
            </a>

            {/* Centered Folk Form Container */}
            <main className="folk-center-container">
              <AuthForm
                onShowToast={triggerSiriToast}
                onLoginSuccess={handleLoginSuccess}
                onOpenForgotModal={() => setIsForgotModalOpen(true)}
              />
            </main>

            {/* Bottom Centered Terms Footer */}
            <footer className="folk-terms-footer">
              <p>
                Kodevio Limited © {new Date().getFullYear()} • Powered by Kodevio Agency OS <br />
                By clicking "Sign in" you agree to our{' '}
                <button
                  type="button"
                  onClick={() => openLegalModal('terms')}
                  className="legal-footer-link"
                >
                  Terms of Use
                </button>{' '}
                and{' '}
                <button
                  type="button"
                  onClick={() => openLegalModal('privacy')}
                  className="legal-footer-link"
                >
                  Privacy policy
                </button>
              </p>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        onShowToast={triggerSiriToast}
      />

      <LegalModal
        isOpen={isLegalModalOpen}
        initialTab={legalTab}
        onClose={() => setIsLegalModalOpen(false)}
      />

      {/* Apple Siri Circular Loading & Checkmark Orb */}
      <SiriCircleToast
        isVisible={isSiriToastVisible}
        onComplete={() => setIsSiriToastVisible(false)}
      />
    </>
  );
}
