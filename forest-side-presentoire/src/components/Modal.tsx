import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 animate-modal-open"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-[#4361ee]">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-3xl font-bold">&times;</button>
        </div>
        <div>{children}</div>
      </div>
      <style>{`
        @keyframes modal-open {
            from { opacity: 0; transform: translateY(-50px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-modal-open { animation: modal-open 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default Modal;
