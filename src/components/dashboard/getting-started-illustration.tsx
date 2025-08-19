"use client";

import { motion } from "motion/react";

export function GettingStartedIllustration() {
  return (
    <div className="relative w-full h-48 bg-gradient-to-r from-main/20 via-main/10 to-main/20 rounded-2xl overflow-hidden border border-main/20">
      <svg
        viewBox="0 0 800 200"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background elements */}
        <defs>
          <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="oklch(85% 0.05 350)" />
            <stop offset="100%" stopColor="oklch(75% 0.1 350)" />
          </linearGradient>
          <linearGradient id="groundGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="oklch(70% 0.15 350)" />
            <stop offset="100%" stopColor="oklch(60% 0.2 350)" />
          </linearGradient>
        </defs>

        {/* Sky background */}
        <rect width="800" height="120" fill="url(#skyGradient)" />
        
        {/* Ground */}
        <rect y="120" width="800" height="80" fill="url(#groundGradient)" />

        {/* Clouds */}
        <motion.g
          animate={{ x: [0, 10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        >
          <ellipse cx="150" cy="40" rx="25" ry="12" fill="white" opacity="0.8" />
          <ellipse cx="170" cy="35" rx="30" ry="15" fill="white" opacity="0.8" />
          <ellipse cx="190" cy="40" rx="20" ry="10" fill="white" opacity="0.8" />
        </motion.g>

        <motion.g
          animate={{ x: [0, -8, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        >
          <ellipse cx="600" cy="30" rx="20" ry="8" fill="white" opacity="0.6" />
          <ellipse cx="615" cy="28" rx="25" ry="10" fill="white" opacity="0.6" />
        </motion.g>

        {/* Money/coins floating */}
        <motion.g
          animate={{ y: [0, -5, 0], rotate: [0, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <circle cx="300" cy="80" r="8" fill="oklch(75% 0.15 60)" stroke="oklch(65% 0.2 60)" strokeWidth="2" />
          <text x="300" y="85" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold">$</text>
        </motion.g>

        <motion.g
          animate={{ y: [0, -3, 0], rotate: [0, -3, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        >
          <circle cx="350" cy="60" r="6" fill="oklch(75% 0.15 60)" stroke="oklch(65% 0.2 60)" strokeWidth="1.5" />
          <text x="350" y="64" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">$</text>
        </motion.g>

        {/* Mobile phone with notification */}
        <motion.g
          animate={{ x: [0, 2, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <rect x="580" y="100" width="25" height="40" rx="4" fill="oklch(20% 0.02 350)" />
          <rect x="582" y="105" width="21" height="25" fill="oklch(85% 0.05 350)" />
          
          {/* Notification dot */}
          <motion.circle
            cx="600" cy="95" r="3" fill="oklch(65% 0.15 0)"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        </motion.g>

        {/* Success checkmark */}
        <motion.g
          animate={{ scale: [0.8, 1, 0.8] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <circle cx="650" cy="70" r="12" fill="oklch(70% 0.15 140)" />
          <path d="M 645 70 L 648 73 L 655 66" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </motion.g>

        {/* Decorative elements */}
        <motion.g
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <circle cx="100" cy="50" r="2" fill="oklch(65% 0.15 350)" opacity="0.6" />
          <circle cx="700" cy="40" r="1.5" fill="oklch(65% 0.15 350)" opacity="0.4" />
        </motion.g>

        {/* Text elements */}
        <motion.text
          x="400" y="50" textAnchor="middle" fontSize="14" fill="oklch(65% 0.15 350)" fontWeight="bold"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Create • Share • Earn
        </motion.text>
      </svg>

      {/* Overlay text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <p className="text-foreground/60 text-sm font-medium">
            Start your journey with Relynk today! ✨
          </p>
        </motion.div>
      </div>
    </div>
  );
}
