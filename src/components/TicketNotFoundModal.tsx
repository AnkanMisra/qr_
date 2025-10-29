interface TicketNotFoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  scannedCode: string;
}

export function TicketNotFoundModal({
  isOpen,
  onClose,
  scannedCode,
}: TicketNotFoundModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-3 sm:p-4 pt-safe-top pb-safe-bottom">
      <div className="bg-white rounded-xl max-w-sm w-full shadow-2xl max-h-[75vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="bg-red-500 p-4 sm:p-6 text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 bg-white/20 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 sm:w-8 sm:h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Ticket Invalid</h2>
          <p className="text-white/90">QR code not recognized</p>
        </div>

        {/* Modal Body - Simplified */}
        <div className="p-4 sm:p-6">
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-xs text-gray-500 mb-2 text-center">
              Scanned Code (masked for security):
            </p>
            <p className="text-sm text-gray-700 break-all font-mono text-center bg-white px-3 py-2 rounded border">
              {scannedCode.length > 8
                ? `${scannedCode.substring(0, 4)}****${scannedCode.substring(scannedCode.length - 4)}`
                : "****"}
            </p>
          </div>

          <div className="text-center">
            <p className="text-gray-600 text-sm mb-2">
              This QR code is not valid for this event
            </p>
            <p className="text-gray-500 text-xs">
              Please scan a valid event ticket
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 pt-0">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white py-3 sm:py-4 px-4 rounded-xl hover:bg-blue-700 transition-colors font-medium text-base sm:text-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
