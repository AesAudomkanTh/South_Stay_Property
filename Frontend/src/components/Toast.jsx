import { createContext, useCallback, useContext, useState } from 'react';

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((type, msg, ms = 2500) => {
    const id = crypto.randomUUID();
    setToasts((t) => [...t, { id, type, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), ms);
  }, []);

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="fixed top-4 right-4 z-[5000] space-y-2">
        {toasts.map((t) => (
          <div key={t.id}
               style={{
                 background: t.type === 'error' ? '#fee2e2' : '#dcfce7',
                 color: t.type === 'error' ? '#991b1b' : '#166534',
                 border: '1px solid rgba(0,0,0,0.06)',
                 padding: '10px 12px',
                 borderRadius: 10,
                 minWidth: 260,
                 boxShadow: '0 6px 18px rgba(0,0,0,0.15)'
               }}>
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => useContext(ToastCtx);
