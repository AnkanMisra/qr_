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
    <div className="h-full flex flex-col p-4 safe-area-bottom">
      <div className="flex-1 max-w-lg mx-auto w-full">
        <div className="bg-white rounded-2xl shadow-lg border p-6 h-full flex flex-col">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Create New Ticket</h2>
          
          <form onSubmit={handleCreateTicket} className="flex-1 flex flex-col space-y-6">
            <div className="space-y-6">
              <div>
                <label htmlFor="teamName" className="block text-base font-semibold text-gray-700 mb-3">
                  Team Name
                </label>
                <input
                  type="text"
                  id="teamName"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Enter team name"
                  disabled={isCreating}
                />
              </div>
              
              <div>
                <label htmlFor="leaderName" className="block text-base font-semibold text-gray-700 mb-3">
                  Team Leader Name
                </label>
                <input
                  type="text"
                  id="leaderName"
                  value={leaderName}
                  onChange={(e) => setLeaderName(e.target.value)}
                  className="w-full px-4 py-4 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Enter leader name"
                  disabled={isCreating}
                />
              </div>
            </div>
            
            <div className="pt-4">
              <button
                type="submit"
                disabled={isCreating || !teamName.trim() || !leaderName.trim()}
                className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl text-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95 shadow-lg"
              >
                {isCreating ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating...</span>
                  </div>
                ) : (
                  "Create Ticket"
                )}
              </button>
            </div>
          </form>
        </div>
        
        {/* Mobile-optimized success section */}
        {lastCreatedTicket && (
          <div className="mt-4 p-6 bg-green-50 border border-green-200 rounded-2xl shadow-lg">
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-green-800 mb-2">Ticket Created Successfully!</h3>
            </div>
            
            <div className="space-y-3 mb-6">
              <div className="bg-white rounded-xl p-4">
                <p className="text-sm font-medium text-gray-600">Team Name:</p>
                <p className="text-lg font-bold text-gray-900">{lastCreatedTicket.teamName}</p>
              </div>
              <div className="bg-white rounded-xl p-4">
                <p className="text-sm font-medium text-gray-600">Ticket ID:</p>
                <p className="text-sm font-mono text-gray-800 break-all">{lastCreatedTicket.uniqueId}</p>
              </div>
            </div>
            
            {/* Mobile-optimized QR Code display */}
            {qrCodeDataUrl && (
              <div className="text-center mb-6">
                <div className="inline-block p-4 bg-white rounded-2xl shadow-lg">
                  <img 
                    src={qrCodeDataUrl} 
                    alt="QR Code for ticket" 
                    className="w-48 h-48 mx-auto"
                  />
                </div>
                <p className="text-sm text-gray-600 mt-3 px-4">Scan this QR code for check-in at the event</p>
              </div>
            )}
            
            <button
              onClick={() => downloadQRCode(lastCreatedTicket.uniqueId, lastCreatedTicket.teamName)}
              className="w-full bg-green-600 text-white py-4 px-6 rounded-xl text-lg font-semibold hover:bg-green-700 transition-all transform active:scale-95 shadow-lg"
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Download QR Code</span>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
