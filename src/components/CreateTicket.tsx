import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import QRCode from "qrcode";

export function CreateTicket() {
  const [teamName, setTeamName] = useState("");
  const [leaderName, setLeaderName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [lastCreatedTicket, setLastCreatedTicket] = useState<{ uniqueId: string; teamName: string } | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  const createTicket = useMutation(api.tickets.createTicket);

  const generateQRCode = async (uniqueId: string) => {
    try {
      const qrDataUrl = await QRCode.toDataURL(uniqueId, {
        width: 300,
        margin: 2,
      });
      setQrCodeDataUrl(qrDataUrl);
      return qrDataUrl;
    } catch (error) {
      toast.error("Failed to generate QR code");
      return null;
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim() || !leaderName.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsCreating(true);
    try {
      const result = await createTicket({ teamName: teamName.trim(), leaderName: leaderName.trim() });
      setLastCreatedTicket({ uniqueId: result.uniqueId, teamName: teamName.trim() });
      await generateQRCode(result.uniqueId);
      setTeamName("");
      setLeaderName("");
      toast.success("Ticket created successfully!");
    } catch (error) {
      toast.error("Failed to create ticket");
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  const downloadQRCode = async (uniqueId: string, teamName: string) => {
    try {
      // Use existing QR code data URL or generate new one
      const qrDataUrl = qrCodeDataUrl || await QRCode.toDataURL(uniqueId, {
        width: 300,
        margin: 2,
      });
      
      const link = document.createElement("a");
      link.download = `ticket-${teamName.replace(/\s+/g, "-")}.png`;
      link.href = qrDataUrl;
      link.click();
    } catch (error) {
      toast.error("Failed to download QR code");
    }
  };

  return (
    <div className="h-full bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 p-6">
      <div className="max-w-2xl mx-auto h-full flex flex-col">
        {/* Main Create Form */}
        <div className="bg-white rounded-3xl shadow-xl border-0 p-8 mb-6 backdrop-blur-sm bg-white/95">
          {/* Header with Icon */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a1 1 0 001 1h1a1 1 0 001-1V7a2 2 0 00-2-2H5zM5 14a2 2 0 00-2 2v3a1 1 0 001 1h1a1 1 0 001-1v-3a2 2 0 00-2-2H5zM16 5a2 2 0 012 2v3a1 1 0 01-1 1h-1a1 1 0 01-1-1V7a2 2 0 012-2h0zM16 14a2 2 0 012 2v3a1 1 0 01-1 1h-1a1 1 0 01-1-1v-3a2 2 0 012-2h0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              Create New Ticket
            </h2>
            <p className="text-gray-600 mt-2">Generate a new QR ticket for event check-in</p>
          </div>
          
          <form onSubmit={handleCreateTicket} className="space-y-8">
            {/* Team Name Field */}
            <div className="space-y-3">
              <label htmlFor="teamName" className="flex items-center text-lg font-semibold text-gray-700">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                Team Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="teamName"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-red-100 focus:border-red-400 transition-all duration-200 bg-gray-50 hover:bg-white"
                  placeholder="Enter your team name"
                  disabled={isCreating}
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Leader Name Field */}
            <div className="space-y-3">
              <label htmlFor="leaderName" className="flex items-center text-lg font-semibold text-gray-700">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                Team Leader Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="leaderName"
                  value={leaderName}
                  onChange={(e) => setLeaderName(e.target.value)}
                  className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-red-100 focus:border-red-400 transition-all duration-200 bg-gray-50 hover:bg-white"
                  placeholder="Enter team leader name"
                  disabled={isCreating}
                />
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Create Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={isCreating || !teamName.trim() || !leaderName.trim()}
                className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white py-5 px-8 rounded-2xl text-xl font-bold hover:from-red-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-xl hover:shadow-2xl"
              >
                {isCreating ? (
                  <div className="flex items-center justify-center space-x-3">
                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating Your Ticket...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Create Ticket</span>
                  </div>
                )}
              </button>
            </div>
          </form>
        </div>
        
        {/* Success Section */}
        {lastCreatedTicket && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-3xl shadow-xl p-6 sm:p-8 backdrop-blur-sm">
            {/* Success Header */}
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl animate-bounce">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                🎉 Ticket Created Successfully!
              </h3>
              <p className="text-green-700 text-lg">Your QR ticket is ready for the event</p>
            </div>
            
            {/* Centered Team Information */}
            <div className="max-w-md mx-auto mb-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">Team Name</p>
                <p className="text-2xl font-bold text-gray-900">{lastCreatedTicket.teamName}</p>
              </div>
            </div>
            
            {/* Centered Ticket ID */}
            <div className="max-w-md mx-auto mb-8">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-green-100 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-600 mb-2">Ticket ID</p>
                <div className="bg-gray-50 px-4 py-3 rounded-xl border">
                  <p className="text-sm font-mono text-gray-800 break-all">
                    {lastCreatedTicket.uniqueId}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Centered QR Code Display */}
            {qrCodeDataUrl && (
              <div className="text-center mb-8">
                <div className="inline-block p-8 bg-white rounded-3xl shadow-2xl border-2 border-green-200">
                  <img 
                    src={qrCodeDataUrl} 
                    alt="QR Code for ticket" 
                    className="w-64 h-64 mx-auto rounded-2xl shadow-lg"
                  />
                </div>
                <div className="mt-6 max-w-sm mx-auto p-4 bg-white/80 rounded-2xl border border-green-200 backdrop-blur-sm">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-green-800 font-medium text-center">Scan this QR code for check-in</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Centered Download Button */}
            <div className="max-w-sm mx-auto">
              <button
                onClick={() => downloadQRCode(lastCreatedTicket.uniqueId, lastCreatedTicket.teamName)}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-5 px-8 rounded-2xl text-lg font-bold hover:from-green-600 hover:to-emerald-600 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-xl hover:shadow-2xl"
              >
                <div className="flex items-center justify-center space-x-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Download QR Code</span>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
