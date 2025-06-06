interface TicketNotFoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  scannedCode: string;
}

export function TicketNotFoundModal({ isOpen, onClose, scannedCode }: TicketNotFoundModalProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-sm w-full mx-4 overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="bg-red-500 p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Ticket Invalid
          </h2>
          <p className="text-white/90">QR code not recognized</p>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-700 break-all font-mono">
              {scannedCode}
            </p>
          </div>
          
          <p className="text-center text-gray-600 text-sm">
            This QR code is not valid for this event
          </p>
        </div>

        {/* Modal Footer */}
        <div className="p-6 pt-0">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
} 