import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AuraToast({ isVisible, onClose }) {
  const [phase, setPhase] = useState('spinner'); // 'spinner' | 'check'

  useEffect(() => {
    if (isVisible) {
      setPhase('spinner');
      const timer1 = setTimeout(() => {
        setPhase('check');
      }, 650);

      const timer2 = setTimeout(() => {
        if (onClose) onClose();
      }, 2600);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="aura-toast-stack">
      <motion.div
        initial={{ scale: 0, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 450, damping: 25 }}
        className="aura-toast-stage"
      >
        {/* Glowing Dynamic Organic Radial Aura Mesh */}
        <motion.div
          animate={{
            scale: [1, 1.25, 1.1],
            rotate: [0, 180, 360],
            opacity: [0.85, 1, 0.9],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="preloader-style-aura"
        />

        {/* Center Dynamic Orb Glass Icon Box */}
        <div className="aura-center-icon-box">
          <AnimatePresence mode="wait">
            {phase === 'spinner' ? (
              <motion.div
                key="spinner-phase"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.15 }}
                className="aura-spinner-wrapper"
              >
                <div className="aura-spinner-ring" />
              </motion.div>
            ) : (
              <motion.div
                key="check-phase"
                initial={{ opacity: 0, scale: 0.3, rotate: -45 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                className="aura-check-wrapper"
              >
                <svg
                  className="aura-check-svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <motion.path
                    d="M20 6L9 17l-5-5"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                  />
                </svg>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
