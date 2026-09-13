import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import logoImg from '../assets/logo';

export default function Preloader({ onComplete }) {
  const [textIndex, setTextIndex] = useState(0);

  const preloaderTexts = [
    'Hello',
    'Welcome to Kodevio',
  ];

  useEffect(() => {
    // Switch from "Hello" to "Welcome to Kodevio" after 1.2s
    const textTimer = setTimeout(() => {
      setTextIndex(1);
    }, 1200);

    // Complete preloader after 2.6s
    const completeTimer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 2600);

    return () => {
      clearTimeout(textTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.03 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="preloader-overlay"
    >
      {/* Top Left Kodevio Brand Logo */}
      <div className="preloader-brand">
        <img src={logoImg} alt="Kodevio Logo" className="brand-logo-img" />
        <span className="brand-name-text">Kodevio</span>
      </div>

      {/* Animated Glowing Radial Gradient Aura Circle */}
      <div className="preloader-center-stage">
        <motion.div
          animate={{
            scale: [0.88, 1.12, 1],
            rotate: [0, 90, 180],
            borderRadius: ['40% 60% 70% 30%', '60% 40% 30% 70%', '50% 50% 50% 50%'],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: 'mirror',
            ease: 'easeInOut',
          }}
          className="gradient-aura-circle"
        />

        {/* Hello -> Welcome to Kodevio Text Reveal */}
        <AnimatePresence mode="wait">
          <motion.h1
            key={textIndex}
            initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -12, filter: 'blur(4px)' }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="preloader-welcome-title"
          >
            {preloaderTexts[textIndex]}
          </motion.h1>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
