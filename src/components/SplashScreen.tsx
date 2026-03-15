import React from 'react';
import { motion } from 'motion/react';

export const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-luxury-black flex flex-col items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative"
      >
        <div className="w-32 h-32 rounded-full border-4 border-gold-primary animate-pulse flex items-center justify-center">
          <span className="text-5xl font-display gold-text-gradient font-bold">BL</span>
        </div>
      </motion.div>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="mt-8 text-center"
      >
        <h1 className="text-3xl font-display font-bold gold-text-gradient tracking-widest">
          BIG LOVA-FASHION
        </h1>
        <p className="text-gold-light/60 uppercase tracking-[0.3em] text-xs mt-2">
          Onde a moda encontra o luxo
        </p>
      </motion.div>
    </div>
  );
};
