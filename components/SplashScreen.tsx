
import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Droplets } from 'lucide-react';

export const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-blue-600 flex flex-col items-center justify-center z-50 overflow-hidden">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, duration: 0.8 }}
        className="relative mb-8"
      >
        <div className="bg-white p-6 rounded-full shadow-2xl">
          <div className="flex space-x-2">
            <Zap className="w-16 h-16 text-blue-600" />
            <Droplets className="w-16 h-16 text-emerald-600" />
          </div>
        </div>
        
        {/* Animated background circles */}
        <motion.div 
          animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.1, 0.2] }}
          transition={{ repeat: Infinity, duration: 3 }}
          className="absolute -inset-10 border-4 border-white/20 rounded-full"
        />
      </motion.div>

      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-4xl font-bold text-white mb-2 tracking-tight"
      >
        JIRAMA Relevés
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-blue-100 font-medium"
      >
        Maintenance & Suivi Industriel
      </motion.p>
    </div>
  );
};
