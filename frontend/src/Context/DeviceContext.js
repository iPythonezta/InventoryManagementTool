import { createContext, useContext, useState, useEffect } from 'react';

const DeviceContext = createContext([]);

export default function DeviceProvider({ children }) {
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const all = await navigator.mediaDevices.enumerateDevices();
        setDevices(all.filter(d => d.kind === 'videoinput'));
      } catch {}
    };
    load();
  }, []);

  return (
    <DeviceContext.Provider value={devices}>
      {children}
    </DeviceContext.Provider>
  );
}

export const useDevices = () => useContext(DeviceContext);
