import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

export default function SiriCircleToast({ isVisible, onComplete }) {
  const [status, setStatus] = useState('loading'); // 'loading' | 'success'

  useEffect(() => {
    if (isVisible) {
      setStatus('loading');

      const successTimer = setTimeout(() => {
        setStatus('success');
      }, 1100);

      const dismissTimer = setTimeout(() => {
        if (onComplete) onComplete();
      }, 2600);

      return () => {
        clearTimeout(successTimer);
        clearTimeout(dismissTimer);
      };
    }
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="aura-toast-stack">
          <motion.div
            initial={{ opacity: 0, scale: 0.6, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 10 }}
            transition={{ type: 'spring', stiffness: 450, damping: 28 }}
            className="aura-toast-stage"
          >
            {/* Organic Morphing Blurred Mesh Gradient Aura (Perfectly Centered) */}
            <motion.div
              animate={{
                scale: [0.92, 1.12, 1],
                rotate: [0, 120, 240, 360],
                borderRadius: ['40% 60% 70% 30%', '60% 40% 30% 70%', '50% 50% 50% 50%'],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatType: 'mirror',
                ease: 'easeInOut',
              }}
              className="preloader-style-aura"
            />

            {/* Mathematically Centered White Glass Icon Circle */}
            <div className="aura-center-icon-box">
              <AnimatePresence mode="wait">
                {status === 'loading' ? (
                  <motion.div
                    key="aura-loader"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1, rotate: 360 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{
                      rotate: { duration: 1, repeat: Infinity, ease: 'linear' },
                      opacity: { duration: 0.2 },
                    }}
                    className="aura-spinner-wrapper"
                  >
                    <div className="aura-spinner-ring" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="aura-check"
                    initial={{ opacity: 0, scale: 0.3 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 600, damping: 22 }}
                    className="aura-check-wrapper"
                  >
                    <Check size={22} className="aura-check-svg" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
