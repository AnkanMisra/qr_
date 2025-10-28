import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

interface ScannerLoginProps {
  onLoginSuccess: (scannerName: string) => void;
}

export default function ScannerLogin({ onLoginSuccess }: ScannerLoginProps) {
  const [scannerName, setScannerName] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const authenticateScanner = useMutation(api.scanners.authenticateScanner);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (!scannerName.trim() || !password.trim()) {
      setErrorMessage("Enter scanner name and password to continue.");
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    authenticateScanner({
      scannerName: scannerName.trim(),
      scannerPassword: password,
    })
      .then((result) => {
        if (result.success && result.scannerName) {
          // Store scanner info in localStorage
          localStorage.setItem("scannerName", result.scannerName);
          setErrorMessage(null);
          onLoginSuccess(result.scannerName);
        } else {
          setErrorMessage("Unable to sign in. Please try again.");
        }
      })
      .catch((error: any) => {
        setErrorMessage(error.message || "Invalid credentials. Check your details.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm space-y-5 text-center"
      >
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-gray-900">Scanner login</h1>
          <p className="text-sm text-gray-500">Enter your assigned credentials.</p>
        </div>

        {errorMessage && (
          <div className="mx-auto w-full rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
            {errorMessage}
          </div>
        )}

        <input
          id="scannerName"
          type="text"
          value={scannerName}
          onChange={(e) => setScannerName(e.target.value)}
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Scanner name"
          required
        />

        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Password"
          required
        />

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}
