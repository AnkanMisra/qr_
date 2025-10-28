import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface ScannerAuthContextType {
  scannerName: string | null;
  isAuthenticated: boolean;
  login: (scannerName: string) => void;
  logout: () => void;
}

const ScannerAuthContext = createContext<ScannerAuthContextType | undefined>(
  undefined,
);

export const useScannerAuth = () => {
  const context = useContext(ScannerAuthContext);
  if (!context) {
    throw new Error("useScannerAuth must be used within a ScannerAuthProvider");
  }
  return context;
};

interface ScannerAuthProviderProps {
  children: ReactNode;
}

export function ScannerAuthProvider({ children }: ScannerAuthProviderProps) {
  const [scannerName, setScannerName] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if scanner is already logged in (from localStorage)
    const storedScannerName = localStorage.getItem("scannerName");
    if (storedScannerName) {
      setScannerName(storedScannerName);
      setIsAuthenticated(true);
    }
  }, []);

  const login = (name: string) => {
    setScannerName(name);
    setIsAuthenticated(true);
    localStorage.setItem("scannerName", name);
  };

  const logout = () => {
    setScannerName(null);
    setIsAuthenticated(false);
    localStorage.removeItem("scannerName");
  };

  return (
    <ScannerAuthContext.Provider
      value={{ scannerName, isAuthenticated, login, logout }}
    >
      {children}
    </ScannerAuthContext.Provider>
  );
}
