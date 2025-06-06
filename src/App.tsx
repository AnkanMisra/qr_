import { Toaster } from "sonner";
import { useState } from "react";
import { CreateTicket } from "./components/CreateTicket";
import { QrScanner } from "./components/QrScanner";
import { TicketList } from "./components/TicketList";

export default function App() {
  const [activeTab, setActiveTab] = useState<"create" | "scan" | "list">("list");

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Mobile-optimized header with proper safe area */}
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b shadow-sm">
        <div className="pt-safe-top px-4 py-4">
          <h1 className="text-xl sm:text-2xl font-bold text-blue-600 text-center mb-4">QR Ticket System</h1>
          
          {/* Mobile-optimized tab navigation */}
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => setActiveTab("create")}
              className={`flex-1 py-3 px-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === "create"
                  ? "bg-white text-blue-600 shadow-md scale-105"
                  : "text-gray-600 active:scale-95"
              }`}
            >
              <div className="flex flex-col items-center space-y-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-xs">Create</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab("scan")}
              className={`flex-1 py-3 px-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === "scan"
                  ? "bg-white text-blue-600 shadow-md scale-105"
                  : "text-gray-600 active:scale-95"
              }`}
            >
              <div className="flex flex-col items-center space-y-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
                <span className="text-xs">Scan</span>
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
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                <span className="text-xs">Tickets</span>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile-optimized main content with proper spacing */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full">
          {activeTab === "create" && <CreateTicket />}
          {activeTab === "scan" && <QrScanner />}
          {activeTab === "list" && <TicketList />}
        </div>
      </main>
      
      {/* Mobile-optimized toaster */}
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            margin: '0 16px',
            maxWidth: 'calc(100vw - 32px)',
          },
        }}
      />
    </div>
  );
}
