import React, { useEffect } from 'react';
import { NotificationState } from '../types';

interface NotificationProps {
  notification: NotificationState;
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ notification, onClose }) => {
  useEffect(() => {
    if (notification.visible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification.visible, onClose]);

  if (!notification.visible) return null;

  const baseClasses = 'fixed top-5 right-5 p-4 rounded-lg shadow-lg z-[100] text-sm md:text-base animate-slide-in';
  const typeClasses = {
    success: 'bg-[#06ffa5] text-gray-800',
    error: 'bg-[#fb5607] text-white',
    warning: 'bg-[#ffbe0b] text-gray-800',
  };

  return (
    <>
      <div className={`${baseClasses} ${typeClasses[notification.type]}`}>
        {notification.message}
      </div>
      <style>{`
        @keyframes slide-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in { animation: slide-in 0.3s ease-out forwards; }
      `}</style>
    </>
  );
};

export default Notification;
