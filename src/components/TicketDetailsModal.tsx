import { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  X,
  Download,
  Calendar,
  User,
  Hash,
  CheckCircle,
  Clock,
  ScanLine,
  Users,
} from "lucide-react";

interface Ticket {
  _id: string;
  _creationTime: number;
  teamName: string;
  leaderName: string;
  teamMemberCount: number;
  uniqueId: string;
  isCheckedIn: boolean;
  checkinCounter?: number;
  checkedInAt?: number;
  scannedBy?: string;
}

interface TicketDetailsModalProps {
  ticket: Ticket | null;
  onClose: () => void;
}

export function TicketDetailsModal({
  ticket,
  onClose,
}: TicketDetailsModalProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (ticket) {
      generateQRCode(ticket.uniqueId);
    } else {
      setQrCodeDataUrl(null);
    }
  }, [ticket]);

  const generateQRCode = async (uniqueId: string) => {
    try {
      const qrDataUrl = await QRCode.toDataURL(uniqueId, {
        width: 300,
        margin: 2,
      });
      setQrCodeDataUrl(qrDataUrl);
    } catch (error) {
      console.error("Error generating QR code:", error);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeDataUrl || !ticket) return;

    const link = document.createElement("a");
    link.download = `${ticket.teamName.replace(/\s+/g, "_")}_QR.png`;
    link.href = qrCodeDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!ticket) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        <div
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] sm:max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 rounded-t-2xl">
            <div className="flex items-start justify-between">
              <div className="flex-1 text-center">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                  {ticket.teamName}
                </h2>
                <div className="space-y-1 flex flex-col items-center">
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span className="font-medium">TeamLead:</span>{" "}
                    {ticket.leaderName}
                  </p>
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span className="font-medium">Member:</span>{" "}
                    {ticket.teamMemberCount}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-white/50"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6">
            {/* QR Code Section */}
            <div className="flex flex-col items-center mb-6">
              <div className="bg-white p-3 sm:p-4 rounded-xl border-2 border-gray-200 shadow-sm">
                {qrCodeDataUrl ? (
                  <img
                    src={qrCodeDataUrl}
                    alt="QR Code"
                    className="w-48 h-48 sm:w-64 sm:h-64"
                  />
                ) : (
                  <div className="w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center bg-gray-100 rounded-lg">
                    <div className="text-gray-400">Generating QR...</div>
                  </div>
                )}
              </div>
              <button
                onClick={downloadQRCode}
                disabled={!qrCodeDataUrl}
                className="mt-4 flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <Download className="w-4 h-4" />
                Download QR Code
              </button>
            </div>

            {/* Status Badge */}
            <div className="flex justify-center mb-6">
              <span
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full ${
                  ticket.isCheckedIn
                    ? "bg-green-100 text-green-800 border border-green-200"
                    : "bg-yellow-100 text-yellow-800 border border-yellow-200"
                }`}
              >
                {ticket.isCheckedIn ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Checked In
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4" />
                    Pending Check-in
                  </>
                )}
              </span>
            </div>

            {/* Details Grid */}
            <div className="space-y-4">
              {/* Ticket ID */}
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="flex items-center justify-center gap-2 text-gray-500 text-sm mb-2">
                  <Hash className="w-4 h-4" />
                  Ticket ID
                </div>
                <div className="font-mono text-sm text-gray-900 bg-white px-3 py-2 rounded-md break-all border border-gray-200 inline-block">
                  {ticket.uniqueId}
                </div>
              </div>

              {/* Check-in Status Info */}
              {ticket.isCheckedIn ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-500 text-sm mb-2">
                      <CheckCircle className="w-4 h-4" />
                      Check-in Time
                    </div>
                    {ticket.checkedInAt ? (
                      <>
                        <div className="text-gray-900 font-semibold">
                          {new Date(ticket.checkedInAt).toLocaleDateString(
                            "en-US",
                            {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {new Date(ticket.checkedInAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </>
                    ) : (
                      <div className="text-gray-400 italic">Not available</div>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-gray-500 text-sm mb-2">
                      <ScanLine className="w-4 h-4" />
                      Number of Scans
                    </div>
                    <div className="text-3xl font-bold text-gray-900">
                      {ticket.checkinCounter || 0}
                    </div>
                    {(ticket.checkinCounter || 0) > 1 && (
                      <div className="text-red-500 text-xs mt-1 font-medium">
                        ⚠️ Multiple scans detected
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                  <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                  <p className="text-yellow-800 font-medium">
                    Not Checked In Yet
                  </p>
                  <p className="text-yellow-600 text-sm mt-1">
                    This ticket has not been scanned
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 rounded-b-2xl">
            <button
              onClick={onClose}
              className="w-full bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
