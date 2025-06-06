import { useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import QrScannerLib from 'qr-scanner';
import { toast } from "sonner";
import { TicketNotFoundModal } from "./TicketNotFoundModal";

type TicketResult = {
  status: "success" | "warning" | "error";
  message: string;
  ticket?: {
    teamName: string;
    leaderName: string;
    checkedInAt?: number;
    checkinCounter?: number;
  };
};

export function QrScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScannerLib | null>(null);
  const [scannedData, setScannedData] = useState<string>('');
  const [isActive, setIsActive] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState<TicketResult | null>(null);
  const [showNotFoundModal, setShowNotFoundModal] = useState(false);
  const [notFoundCode, setNotFoundCode] = useState<string>('');
  const [lastProcessedQR, setLastProcessedQR] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<number>(0);
  const scanTicket = useMutation(api.tickets.scanTicket);

  const handleQRScan = async (qrData: string) => {
    const now = Date.now();
    
    // Prevent duplicate processing of the same QR code or rapid scans
    if (isProcessing || lastProcessedQR === qrData || (now - lastScanTime < 2000)) {
      console.log('🚫 Skipping duplicate, processing, or rapid scan:', qrData);
      return;
    }
    
    setLastScanTime(now);

    // Immediately stop the scanner to prevent rapid-fire scans
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
    }

    setIsProcessing(true);
    setLastProcessedQR(qrData);
    setIsActive(false);

    try {
      console.log('🎫 Processing ticket:', qrData);
      
      const result = await scanTicket({ uniqueId: qrData, timestamp: Date.now() });
      
      if (result.status === "success") {
        // Show success modal
        setModalData(result as TicketResult);
        setShowModal(true);
        toast.success(result.message, {
          description: `Team: ${result.ticket?.teamName} | Leader: ${result.ticket?.leaderName}`,
          duration: 4000
        });
      } else if (result.status === "warning") {
        // Show warning modal for already checked in tickets
        setModalData(result as TicketResult);
        setShowModal(true);
        toast.warning(result.message, {
          description: `Team: ${result.ticket?.teamName} | Already checked in`,
          duration: 4000
        });
      } else {
        // Show ticket not found modal for error cases
        setNotFoundCode(qrData);
        setShowNotFoundModal(true);
        toast.error(result.message, { duration: 4000 });
      }

      // Restart scanner after processing with delay
      setTimeout(() => {
        if (qrScannerRef.current && !showModal && !showNotFoundModal) {
          qrScannerRef.current.start();
        }
        setIsActive(true);
        setLastProcessedQR(''); // Reset after pause
      }, 3000);

    } catch (err) {
      console.error('❌ Ticket processing failed:', err);
      // Show not found modal for processing errors too
      setNotFoundCode(qrData);
      setShowNotFoundModal(true);
      toast.error("Failed to process ticket");
      setLastProcessedQR(''); // Reset on error
      // Restart scanner on error
      setTimeout(() => {
        if (qrScannerRef.current && !showNotFoundModal) {
          qrScannerRef.current.start();
        }
        setIsActive(true);
      }, 2000);
    } finally {
      setIsProcessing(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setModalData(null);
    // Restart scanner when modal closes
    setTimeout(() => {
      if (qrScannerRef.current) {
        qrScannerRef.current.start();
      }
      setIsActive(true);
    }, 500);
  };

  const closeNotFoundModal = () => {
    setShowNotFoundModal(false);
    setNotFoundCode('');
    // Restart scanner when modal closes
    setTimeout(() => {
      if (qrScannerRef.current) {
        qrScannerRef.current.start();
      }
      setIsActive(true);
    }, 500);
  };

  const startScanner = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.start().then(() => {
        setIsActive(true);
        console.log('✅ QR Scanner started manually');
      }).catch((err) => {
        console.error('❌ Failed to start scanner:', err);
        toast.error("Failed to start camera");
      });
    }
  };

  const stopScanner = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      setIsActive(false);
      console.log('🛑 QR Scanner stopped manually');
    }
  };

  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const qrScanner = new QrScannerLib(
      video,
      (result) => {
        console.log('🎯 QR Code detected:', result.data);
        setScannedData(result.data);
        if (isActive && !isProcessing) {
          handleQRScan(result.data);
        }
      },
      {
        returnDetailedScanResult: true,
        highlightScanRegion: true,
        highlightCodeOutline: true,
      }
    );

    qrScannerRef.current = qrScanner;
    qrScanner.start().then(() => {
      console.log('✅ QR Scanner started successfully');
    }).catch((err) => {
      console.error('❌ QR Scanner failed to start:', err);
      toast.error("Camera access failed. Please allow camera permissions.");
    });

    return () => {
      console.log('🧹 Cleaning up QR Scanner');
      qrScanner.stop();
      qrScanner.destroy();
    };
  }, []); // Remove isActive dependency to prevent recreation

  return (
    <div className="flex-1 relative bg-black">
      {/* Video Element */}
      <div className="relative w-full h-full">
        <video 
          ref={videoRef} 
          className="w-full h-full object-cover"
          style={{ display: 'block' }}
          autoPlay
          playsInline
          muted
        />
      </div>
      
      {/* Simple Overlay */}
      <div className="absolute inset-0 flex flex-col">
        {/* Header */}
        <div className="bg-black/80 text-white p-4 text-center">
          <h1 className="text-xl font-bold">QR Scanner</h1>
          <p className="text-white/90 text-sm">
            {isProcessing ? "Processing ticket..." : isActive ? "Point camera at QR code" : "Paused after scan"}
          </p>
        </div>

        {/* Scanning Frame */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="relative">
            {/* Simple scanning frame */}
            <div className="w-72 h-72 border-2 border-white relative bg-transparent">
              {/* Corner markers */}
              <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-white"></div>
              <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-white"></div>
              <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-white"></div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-white"></div>
              
              {/* Simple scanning line */}
              {isActive && (
                <div className="absolute inset-x-0 top-1/2 h-1 bg-green-400"></div>
              )}
            </div>
            
            {/* Status message */}
            <div className="mt-6 text-center">
              <div className="bg-black/80 px-4 py-2 rounded-lg">
                <p className="text-white text-sm">
                  {isProcessing ? "Processing..." : isActive ? "Scanning..." : "Paused"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="bg-black/80 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                isProcessing ? 'bg-blue-500' : 
                isActive ? 'bg-green-500' : 'bg-yellow-500'
              }`}></div>
              <span className="text-sm">
                {isProcessing ? "Processing" : isActive ? "Active" : "Paused"}
              </span>
            </div>
            
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
            >
              Reset
            </button>
          </div>
          
          {/* Last scan info */}
          {scannedData && (
            <div className="mt-2 text-xs text-gray-400">
              Last scan: {scannedData.slice(0, 12)}...
            </div>
          )}
        </div>
      </div>

      {/* Success/Warning Modal */}
      {showModal && modalData && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 p-4 pt-safe-top pb-safe-bottom">
          <div className="bg-white rounded-xl max-w-sm w-full mx-4 my-8 overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className={`p-6 text-center ${
              modalData.status === "success" 
                ? "bg-green-500" 
                : modalData.status === "warning" 
                ? "bg-yellow-500" 
                : "bg-red-500"
            }`}>
              <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                {modalData.status === "success" && (
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {modalData.status === "warning" && (
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01" />
                  </svg>
                )}
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                {modalData.status === "success" 
                  ? "Check-in Successful!" 
                  : modalData.ticket?.checkinCounter === 1 
                    ? "Welcome Back!" 
                    : "Multiple Scan Alert"}
              </h2>
              <p className="text-white/90">{modalData.message}</p>
            </div>

            {/* Modal Body - Simplified for mobile */}
            <div className="p-6 space-y-4">
              {modalData.ticket && (
                <>
                  {/* Team Information */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="text-center">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {modalData.ticket.teamName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Leader: {modalData.ticket.leaderName}
                      </p>
                    </div>
                    
                    {/* Check-in details */}
                    <div className="border-t pt-3 space-y-2">
                      {modalData.ticket.checkedInAt && (
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Check-in Time</p>
                          <p className="text-sm font-medium text-gray-700">
                            {new Date(modalData.ticket.checkedInAt).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      )}
                      
                      {modalData.ticket.checkinCounter !== undefined && modalData.ticket.checkinCounter > 1 && (
                        <div className="text-center">
                          <p className="text-xs text-red-500">Scan Count</p>
                          <p className="text-sm font-bold text-red-600">
                            {modalData.ticket.checkinCounter} times
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="text-center">
                    <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                      modalData.status === "success" 
                        ? "bg-green-100 text-green-800" 
                        : modalData.ticket?.checkinCounter === 1 
                          ? "bg-blue-100 text-blue-800" 
                          : "bg-red-100 text-red-800"
                    }`}>
                      <div className={`w-2 h-2 rounded-full mr-2 ${
                        modalData.status === "success" 
                          ? "bg-green-500" 
                          : modalData.ticket?.checkinCounter === 1 
                            ? "bg-blue-500" 
                            : "bg-red-500"
                      }`}></div>
                      {modalData.status === "success" 
                        ? "Newly Checked In" 
                        : modalData.ticket?.checkinCounter === 1 
                          ? "Already Checked In" 
                          : "Multiple Scans"}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 pt-0">
              <button
                onClick={closeModal}
                className="w-full bg-blue-600 text-white py-4 px-4 rounded-xl hover:bg-blue-700 transition-colors font-medium text-lg"
              >
                Continue Scanning
              </button>
            </div>
          </div>
        </div>
      )}

             {/* Ticket Not Found Modal */}
       {showNotFoundModal && notFoundCode && (
         <TicketNotFoundModal
           isOpen={showNotFoundModal}
           scannedCode={notFoundCode}
           onClose={closeNotFoundModal}
         />
       )}
    </div>
  );
} 