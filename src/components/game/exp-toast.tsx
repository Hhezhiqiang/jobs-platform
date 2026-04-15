"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ExpToastProps {
  message: string;
  exp: number;
  isLevelUp?: boolean;
  newLevel?: {
    level: number;
    title: string;
    icon: string;
  };
  onClose: () => void;
}

export function ExpToast({ message, exp, isLevelUp, newLevel, onClose }: ExpToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          className={`fixed bottom-4 right-4 z-50 p-4 rounded-xl shadow-2xl ${
            isLevelUp
              ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
              : "bg-white border border-gray-200"
          }`}
        >
          {isLevelUp && newLevel ? (
            <div className="flex items-center gap-3">
              <div className="text-4xl">{newLevel.icon}</div>
              <div>
                <p className="font-bold text-lg">🎉 升级啦！</p>
                <p className="text-sm opacity-90">
                  Lv.{newLevel.level} {newLevel.title}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-green-500 text-xl">+</span>
              <span className="font-bold text-green-600">{exp}</span>
              <span className="text-gray-600">{message}</span>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
