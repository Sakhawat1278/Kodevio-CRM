import React from 'react';
import { motion } from 'framer-motion';

export default function GeometricMosaic() {
  return (
    <div className="mosaic-panel">
      <svg className="mosaic-svg" viewBox="0 0 600 700" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4F46E5" />
            <stop offset="100%" stopColor="#312E81" />
          </linearGradient>

          <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06B6D4" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>

          <pattern id="dotsPattern" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="4" cy="4" r="2" fill="rgba(255, 255, 255, 0.25)" />
          </pattern>

          <pattern id="stripesPattern" x="0" y="0" width="10" height="10" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="10" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="3" />
          </pattern>
        </defs>

        {/* Mosaic Grid Base */}
        <rect width="600" height="700" fill="#1E1B4B" />

        {/* Top Left Arch / Flower Shape */}
        <path d="M 0 0 C 150 0, 150 150, 0 150 Z" fill="#8B5CF6" opacity="0.8" />
        <path d="M 150 0 C 150 150, 300 150, 300 0 Z" fill="#6366F1" opacity="0.9" />

        {/* Top Center Grid Blocks & Diamonds */}
        <rect x="300" y="0" width="150" height="150" fill="#090D16" />
        <polygon points="340,30 360,50 340,70 320,50" fill="#EF4444" />
        <polygon points="380,30 400,50 380,70 360,50" fill="#F59E0B" />
        {/* Horizontal Bars */}
        <rect x="320" y="90" width="110" height="8" fill="#06B6D4" />
        <rect x="320" y="105" width="110" height="8" fill="#6366F1" />
        <rect x="320" y="120" width="110" height="8" fill="#FFFFFF" opacity="0.8" />

        {/* Top Right Isometric 3D Cube Pattern */}
        <rect x="450" y="0" width="150" height="150" fill="url(#stripesPattern)" />

        {/* Middle Section Left: Floating Triangles & Arch */}
        <polygon points="60,200 100,260 20,260" fill="#3B82F6" />
        <polygon points="60,240 100,300 20,300" fill="#60A5FA" opacity="0.7" />

        {/* Middle Sparkle & Dots Grid */}
        <g transform="translate(180, 220)">
          <path d="M 20 0 L 25 15 L 40 20 L 25 25 L 20 40 L 15 25 L 0 20 L 15 15 Z" fill="#E0E7FF" />
        </g>
        <rect x="230" y="200" width="60" height="60" fill="url(#dotsPattern)" />

        {/* Central Star Badge */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '370px 330px' }}
        >
          <polygon
            points="370,290 380,315 405,305 395,330 420,340 395,350 405,375 380,365 370,390 360,365 335,375 345,350 320,340 345,330 335,305 360,315"
            fill="#F59E0B"
          />
        </motion.g>

        {/* Center Horizontal Teal & Blue Block */}
        <rect x="0" y="350" width="300" height="80" fill="url(#grad1)" />
        <rect x="20" y="360" width="60" height="100" fill="#06B6D4" />

        {/* Radial Rays Circle */}
        <g transform="translate(480, 360)">
          <circle cx="0" cy="0" r="8" fill="#8B5CF6" />
          {[...Array(12)].map((_, i) => (
            <line
              key={i}
              x1="0"
              y1="0"
              x2={35 * Math.cos((i * Math.PI) / 6)}
              y2={35 * Math.sin((i * Math.PI) / 6)}
              stroke="#A5B4FC"
              strokeWidth="3"
            />
          ))}
        </g>

        {/* Large Lower Right Geometric Curve Assembly */}
        <path d="M 400 400 A 150 150 0 0 1 550 550 L 400 550 Z" fill="#3730A3" />
        <path d="M 400 550 A 150 150 0 0 1 550 700 L 400 700 Z" fill="#312E81" />

        <circle cx="450" cy="520" r="60" fill="#4338CA" />
        <circle cx="450" cy="520" r="10" fill="#FFFFFF" />

        {/* Bottom Left Circle Arch */}
        <path d="M 0 550 C 120 550, 120 700, 0 700 Z" fill="#8B5CF6" />
        <circle cx="0" cy="700" r="80" stroke="#E0E7FF" strokeWidth="2" fill="none" />

        {/* Bottom Decorative Wave Lines */}
        <path
          d="M 180 650 Q 200 640 220 650 T 260 650 T 300 650"
          fill="none"
          stroke="#06B6D4"
          strokeWidth="4"
        />
        <path
          d="M 180 665 Q 200 655 220 665 T 260 665 T 300 665"
          fill="none"
          stroke="#06B6D4"
          strokeWidth="4"
        />

        {/* Bottom Right Dot Grid Container */}
        <rect x="500" y="600" width="100" height="100" fill="#0284C7" />
        <rect x="510" y="610" width="80" height="80" fill="url(#dotsPattern)" />
      </svg>
    </div>
  );
}
