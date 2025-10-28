import { Toaster } from "sonner";
import { useState } from "react";
import { QrScanner } from "./QrScanner";
import { TicketList } from "./TicketList";
import { useScannerAuth } from "../contexts/ScannerAuthContext";
import { LogOut, User } from "lucide-react";

export function HomePage() {
  const [activeTab, setActiveTab] = useState<"scan" | "list">("scan");
  const { scannerName, logout } = useScannerAuth();

  return (
    <div className="h-full w-full flex flex-col bg-gray-50">
      {/* Mobile-optimized header with proper safe area */}
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b shadow-sm flex-shrink-0">
        <div className="pt-safe-top px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl sm:text-2xl font-bold text-blue-600 flex-1 text-center">
              QR Ticket Scanner
            </h1>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-lg">
                <User className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  {scannerName}
                </span>
              </div>
              <button
                onClick={logout}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mobile scanner name display */}
          <div className="flex sm:hidden items-center justify-center gap-2 mb-4 px-3 py-1 bg-blue-50 rounded-lg">
            <User className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              {scannerName}
            </span>
          </div>

          {/* Mobile-optimized tab navigation */}
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => setActiveTab("scan")}
              className={`flex-1 py-3 px-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === "scan"
                  ? "bg-white text-blue-600 shadow-md scale-105"
                  : "text-gray-600 active:scale-95"
              }`}
            >
              <div className="flex flex-col items-center space-y-1">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                  />
                </svg>
                <span className="text-xs">Scan QR</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("list")}
              className={`flex-1 py-3 px-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === "list"
                  ? "bg-white text-blue-600 shadow-md scale-105"
                  : "text-gray-600 active:scale-95"
              }`}
            >
              <div className="flex flex-col items-center space-y-1">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 10h16M4 14h16M4 18h16"
                  />
                </svg>
                <span className="text-xs">All Tickets</span>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile-optimized main content with proper spacing */}
      <main className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 w-full h-full">
          {activeTab === "scan" && <QrScanner />}
          {activeTab === "list" && <TicketList />}
        </div>
      </main>

      {/* Mobile-optimized toaster */}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            margin: "0 16px",
            maxWidth: "calc(100vw - 32px)",
          },
        }}
      />
    </div>
  );
}
