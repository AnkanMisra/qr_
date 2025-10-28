import { Routes, Route } from "react-router-dom";
import { HomePage } from "./components/HomePage";
import { AdminPage } from "./components/AdminPage";
import ScannerLogin from "./components/ScannerLogin";
import {
  ScannerAuthProvider,
  useScannerAuth,
} from "./contexts/ScannerAuthContext";

function AppContent() {
  const { isAuthenticated, login } = useScannerAuth();

  return (
    <div className="h-full w-full">
      <Routes>
        <Route path="/admin" element={<AdminPage />} />
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <HomePage />
            ) : (
              <ScannerLogin onLoginSuccess={login} />
            )
          }
        />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <ScannerAuthProvider>
      <AppContent />
    </ScannerAuthProvider>
  );
}
