import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);
let idCounter = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = 'success') => {
    const id = ++idCounter;
    setToasts(prev => {
      const current = [...prev, { id, message, type }];
      if (current.length > 3) current.shift();
      return current;
    });

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

const ToastContainer = ({ toasts }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 pointer-events-none">
      {toasts.map(t => {
        const typeStyles = {
          success: 'bg-[#141e1a] border-[#1a7a5e]/50 text-green-200',
          error: 'bg-[#1e1414] border-red-500/30 text-red-200',
          info: 'bg-[#1e2128] border-[#2d3240] text-gray-200',
        };

        const icons = {
          success: (
            <svg className="w-5 h-5 text-[#1a7a5e] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ),
          error: (
            <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          info: (
             <svg className="w-5 h-5 text-[#6366f1] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
          )
        };

        return (
          <div 
            key={t.id} 
            className={`px-4 py-3 rounded-lg shadow-lg border flex items-center space-x-3 pointer-events-auto transform transition-all duration-300 animate-[slideInRight_0.3s_ease-out] ${typeStyles[t.type] || typeStyles.info}`}
          >
            {icons[t.type] || icons.info}
            <span className="text-sm font-medium">{t.message}</span>
          </div>
        );
      })}
    </div>
  );
};
