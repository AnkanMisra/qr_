import { useEffect, useRef, useState, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import QrScannerLib from "qr-scanner";
import { TicketNotFoundModal } from "./TicketNotFoundModal";
import { useScannerAuth } from "../contexts/ScannerAuthContext";
import { toast } from "sonner";

type TicketResult = {
  status: "success" | "warning" | "error";
  message: string;
  ticket?: {
    teamName: string;
    leaderName: string;
    teamMemberCount?: number;
    checkedInAt?: number;
    checkinCounter?: number;
    scannedBy?: string;
  };
};

export function QrScanner() {
  const { scannerName } = useScannerAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const qrScannerRef = useRef<QrScannerLib | null>(null);
  const isProcessingRef = useRef(false);
  const showModalRef = useRef(false);
  const showNotFoundModalRef = useRef(false);
  const lastProcessedQRRef = useRef<string>("");
  const [scannedData, setScannedData] = useState<string>("");
  const [isActive, setIsActive] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState<TicketResult | null>(null);
  const [showNotFoundModal, setShowNotFoundModal] = useState(false);
  const [notFoundCode, setNotFoundCode] = useState<string>("");
  const [lastProcessedQR, setLastProcessedQR] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<number>(0);
  const scanTicket = useMutation(api.tickets.scanTicket);

  // Reset last processed QR after a delay to allow re-scanning the same code
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetLastProcessedQR = useCallback(() => {
    setLastProcessedQR("");
    lastProcessedQRRef.current = "";
  }, []);

  useEffect(() => {
    return () => {
      // Clean up any pending reset timeout
      if (resetTimeoutRef.current) {
        clearTimeout(resetTimeoutRef.current);
        resetTimeoutRef.current = null;
      }
    };
  }, []);

  // Update refs when state changes
  useEffect(() => {
    showModalRef.current = showModal;
  }, [showModal]);

  useEffect(() => {
    showNotFoundModalRef.current = showNotFoundModal;
  }, [showNotFoundModal]);

  const handleQRScan = useCallback(
    async (qrData: string) => {
      const now = Date.now();

      // Prevent duplicate processing of the same QR code
      if (isProcessingRef.current || lastProcessedQRRef.current === qrData) {
        // Skip duplicate or processing scan
        return;
      }

      setLastScanTime(now);

      // Immediately stop the scanner to prevent rapid-fire scans
      if (qrScannerRef.current) {
        void qrScannerRef.current.stop();
      }

      setIsProcessing(true);
      isProcessingRef.current = true;
      setLastProcessedQR(qrData);
      lastProcessedQRRef.current = qrData;
      setIsActive(false);

      try {
        const result = await scanTicket({
          uniqueId: qrData,
          timestamp: Date.now(),
          scannedBy: scannerName || "Unknown Scanner",
        });

        if (result.status === "success") {
          // Show success modal
          setModalData(result as TicketResult);
          setShowModal(true);
        } else if (result.status === "warning") {
          // Show warning modal for already checked in tickets
          setModalData(result as TicketResult);
          setShowModal(true);
        } else {
          // Show ticket not found modal for error cases
          setNotFoundCode(qrData);
          setShowNotFoundModal(true);
        }
      } catch (err) {
        console.error("❌ Ticket processing failed:", err);
        // Show not found modal for processing errors too
        setNotFoundCode(qrData);
        setShowNotFoundModal(true);
      } finally {
        setIsProcessing(false);
        isProcessingRef.current = false;
        // Clear any existing timeout before setting a new one
        if (resetTimeoutRef.current) {
          clearTimeout(resetTimeoutRef.current);
        }
        // Allow re-scanning the same QR code after 5 seconds
        resetTimeoutRef.current = setTimeout(resetLastProcessedQR, 5000);
      }
    },
    [scanTicket, scannerName, resetLastProcessedQR], // Include resetLastProcessedQR dependency
  );

  const closeModal = () => {
    setShowModal(false);
    setModalData(null);
    // Reset processing states only (keep lastProcessedQR to prevent immediate re-scan)
    setIsActive(true);
    setIsProcessing(false);
    isProcessingRef.current = false;

    // Restart scanner with a small delay to ensure DOM is ready
    setTimeout(() => {
      if (qrScannerRef.current) {
        qrScannerRef.current
          .start()
          .then(() => {})
          .catch((err) => console.error("Failed to restart scanner:", err));
      }
    }, 100);
  };

  const closeNotFoundModal = () => {
    setShowNotFoundModal(false);
    setNotFoundCode("");
    // Reset processing states only (keep lastProcessedQR to prevent immediate re-scan)
    setIsActive(true);
    setIsProcessing(false);
    isProcessingRef.current = false;

    // Restart scanner with a small delay to ensure DOM is ready
    setTimeout(() => {
      if (qrScannerRef.current) {
        qrScannerRef.current
          .start()
          .then(() => {})
          .catch((err) => console.error("Failed to restart scanner:", err));
      }
    }, 100);
  };

  const startScanner = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current
        .start()
        .then(() => {
          setIsActive(true);
        })
        .catch((err) => {
          console.error("❌ Failed to start scanner:", err);
          toast.error("Failed to start camera");
        });
    }
  };

  const stopScanner = () => {
    if (qrScannerRef.current) {
      void qrScannerRef.current.stop();
      setIsActive(false);
    }
  };

  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;

    // Ensure video element is ready
    video.setAttribute("playsinline", "");
    video.setAttribute("muted", "");
    video.setAttribute("autoplay", "");

    const qrScanner = new QrScannerLib(
      video,
      (result) => {
        setScannedData(result.data);
        // Only process if no modal is showing
        if (
          isActive &&
          !isProcessingRef.current &&
          !showModalRef.current &&
          !showNotFoundModalRef.current
        ) {
          handleQRScan(result.data);
        }
      },
      {
        returnDetailedScanResult: true,
        highlightScanRegion: false,
        highlightCodeOutline: false,
        preferredCamera: "environment",
        maxScansPerSecond: 30,
      },
    );

    qrScannerRef.current = qrScanner;

    // Start scanner with better error handling
    const startScanner = async () => {
      try {
        await qrScanner.start();
        setIsActive(true);
      } catch (err) {
        console.error("❌ QR Scanner failed to start:", err);
        setIsActive(false);

        // Try to request camera permissions
        try {
          await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
          });
          // If successful, try starting scanner again
          setTimeout(() => {
            qrScanner.start().catch((e) => console.error("Retry failed:", e));
          }, 1000);
        } catch (permErr) {
          console.error("Camera permission denied:", permErr);
        }
      }
    };

    startScanner();

    return () => {
      qrScanner.stop();
      qrScanner.destroy();
    };
  }, [handleQRScan]); // Add handleQRScan dependency

  return (
    <div className="h-full w-full relative bg-black overflow-hidden">
      {/* Video Element - Clean display */}
      <div className="absolute inset-0 w-full h-full bg-black">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          style={{
            display: "block",
            transform: "scaleX(-1)",
          }}
          autoPlay
          playsInline
          muted
        />
      </div>

      {/* Modern Overlay UI */}
      <div className="absolute inset-0 flex flex-col pointer-events-none">
        {/* Header with Gradient */}
        <div className="bg-gradient-to-b from-black/90 via-black/60 to-transparent text-white px-4 pt-safe-top pb-4 sm:px-6 sm:pb-8 pointer-events-auto">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-lg sm:text-2xl font-bold tracking-tight">
                Live Scanner
              </h1>
              <p className="text-white/80 text-xs sm:text-sm mt-0.5">
                {isProcessing
                  ? "Verifying ticket..."
                  : isActive
                    ? "Point camera at QR code"
                    : "Scanner paused"}
              </p>
            </div>
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <button
                onClick={isActive ? stopScanner : startScanner}
                className="px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all text-xs font-medium active:scale-95"
              >
                {isActive ? "Pause" : "Resume"}
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all text-xs font-medium active:scale-95"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Scanning Frame - Centered */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 pb-safe-bottom">
          <div className="relative">
            {/* Modern scanning frame with rounded corners - responsive size */}
            <div className="relative w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72 lg:w-80 lg:h-80">
              {/* Animated corner brackets */}
              <div className="absolute -top-1 -left-1 w-12 h-12 border-t-[3px] border-l-[3px] border-emerald-400 rounded-tl-lg transition-all duration-300"></div>
              <div className="absolute -top-1 -right-1 w-12 h-12 border-t-[3px] border-r-[3px] border-emerald-400 rounded-tr-lg transition-all duration-300"></div>
              <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-[3px] border-l-[3px] border-emerald-400 rounded-bl-lg transition-all duration-300"></div>
              <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-[3px] border-r-[3px] border-emerald-400 rounded-br-lg transition-all duration-300"></div>

              {/* Scanning line with animation */}
              {isActive && (
                <div className="absolute inset-x-0 top-0 h-full overflow-hidden">
                  <div
                    className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-lg shadow-emerald-400/50"
                    style={{
                      animation: "scan 2s ease-in-out infinite",
                    }}
                  ></div>
                </div>
              )}

              {/* Grid overlay for better focus */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-x-0 top-1/3 h-px bg-white"></div>
                <div className="absolute inset-x-0 top-2/3 h-px bg-white"></div>
                <div className="absolute inset-y-0 left-1/3 w-px bg-white"></div>
                <div className="absolute inset-y-0 left-2/3 w-px bg-white"></div>
              </div>

              {/* Center crosshair */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-8 h-8 border-2 border-white/40 rounded-full"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white/60 rounded-full"></div>
              </div>
            </div>

            {/* Status indicator below frame */}
            <div className="mt-4 sm:mt-8 text-center pointer-events-auto">
              <div className="inline-flex items-center space-x-2 sm:space-x-3 bg-black/90 backdrop-blur-md px-3 py-1.5 sm:px-6 sm:py-3 rounded-full border border-white/10">
                <div className="relative w-2.5 h-2.5">
                  <div
                    className={`absolute inset-0 rounded-full ${
                      isProcessing
                        ? "bg-blue-500"
                        : isActive
                          ? "bg-emerald-500"
                          : "bg-amber-500"
                    }`}
                  ></div>
                  {isActive && (
                    <div
                      className={`absolute inset-0 rounded-full animate-ping ${
                        isProcessing ? "bg-blue-400" : "bg-emerald-400"
                      }`}
                    ></div>
                  )}
                </div>
                <span className="text-white text-sm font-medium">
                  {isProcessing ? "Processing" : isActive ? "Active" : "Paused"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Status Bar */}
        <div className="bg-gradient-to-t from-black/90 via-black/60 to-transparent text-white px-4 pb-safe-bottom pt-3 sm:px-6 sm:pt-6 pointer-events-auto">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {scannedData ? (
                <div>
                  <p className="text-xs text-white/60 uppercase tracking-wide">
                    Last Scan
                  </p>
                  <p className="text-xs sm:text-sm font-mono text-white/90 mt-0.5">
                    {scannedData.slice(0, 16)}...
                  </p>
                  <p className="text-[10px] sm:text-xs text-white/50 mt-0.5">
                    {new Date(lastScanTime).toLocaleTimeString()}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-white/60 uppercase tracking-wide">
                    Ready
                  </p>
                  <p className="text-xs sm:text-sm text-white/90 mt-0.5">
                    Awaiting first scan
                  </p>
                </div>
              )}
            </div>
            <div className="ml-2 sm:ml-4 px-2 py-1 sm:px-4 sm:py-2 rounded-lg bg-white/10 backdrop-blur-sm">
              <p className="text-[10px] sm:text-xs text-white/70 font-medium">
                Camera Active
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Success/Warning Modal */}
      {showModal &&
        modalData &&
        (() => {
          // Helper variables for modal state
          // Backend returns status="success" with checkinCounter=1 for first scan
          // Backend returns status="warning" with checkinCounter=2 for second scan
          // Backend returns status="warning" with checkinCounter=3+ for multiple scans
          const isFirstCheckIn = modalData.status === "success";
          const isSecondScan =
            modalData.status === "warning" &&
            modalData.ticket?.checkinCounter === 2;
          const isMultipleScan =
            modalData.status === "warning" && !isSecondScan;

          return (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 p-3 sm:p-4 pt-safe-top pb-safe-bottom">
              <div className="bg-white rounded-xl max-w-sm w-full mx-2 sm:mx-4 my-4 sm:my-8 shadow-2xl max-h-[75vh] sm:max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div
                  className={`px-3 py-1 text-center ${
                    isFirstCheckIn
                      ? "bg-green-500"
                      : isSecondScan
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                      {isFirstCheckIn && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                      {(isSecondScan || isMultipleScan) && (
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M12 9v2m0 4h.01"
                          />
                        </svg>
                      )}
                    </div>
                    <h2 className="text-sm font-bold text-white">
                      {isFirstCheckIn
                        ? "Check-in Successful!"
                        : isSecondScan
                          ? "Welcome Back!"
                          : "Multiple Scan Alert"}
                    </h2>
                  </div>
                  <p className="text-xs text-white/90">{modalData.message}</p>
                </div>

                {/* Modal Body - Simplified for mobile */}
                <div className="px-3 py-3 sm:px-6 sm:py-4 space-y-2 sm:space-y-4">
                  {modalData.ticket && (
                    <>
                      {/* Team Information */}
                      <div className="bg-gray-50 rounded-lg p-3 sm:p-4 space-y-2">
                        <div className="text-center space-y-2">
                          <h3 className="text-base font-bold text-gray-900">
                            {modalData.ticket.teamName}
                          </h3>
                          <div className="space-y-1">
                            <p className="text-sm text-gray-600">
                              TeamLead: {modalData.ticket.leaderName}
                            </p>
                            {modalData.ticket.teamMemberCount !== undefined && (
                              <p className="text-sm text-gray-600">
                                Member: {modalData.ticket.teamMemberCount}
                              </p>
                            )}
                            {modalData.ticket.scannedBy && (
                              <p className="text-sm text-gray-600">
                                Scanned by: {modalData.ticket.scannedBy}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Check-in details */}
                        <div className="border-t pt-2 space-y-1 sm:space-y-2">
                          {modalData.ticket.checkedInAt && (
                            <div className="text-center">
                              <p className="text-xs text-gray-500">
                                Check-in time
                              </p>
                              <p className="text-sm font-medium text-gray-700">
                                {new Date(
                                  modalData.ticket.checkedInAt,
                                ).toLocaleString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          )}

                          {modalData.ticket.checkinCounter !== undefined &&
                            modalData.ticket.checkinCounter > 1 && (
                              <div className="text-center">
                                <p className="text-xs text-red-500">
                                  Scan Count
                                </p>
                                <p className="text-sm font-bold text-red-600">
                                  {modalData.ticket.checkinCounter} times
                                </p>
                              </div>
                            )}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="text-center">
                        <div
                          className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                            isFirstCheckIn
                              ? "bg-green-100 text-green-800"
                              : isSecondScan
                                ? "bg-blue-100 text-blue-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          <div
                            className={`w-2 h-2 rounded-full mr-2 ${
                              isFirstCheckIn
                                ? "bg-green-500"
                                : isSecondScan
                                  ? "bg-blue-500"
                                  : "bg-red-500"
                            }`}
                          ></div>
                          {isFirstCheckIn
                            ? "Newly Checked In"
                            : isSecondScan
                              ? "Already Checked In"
                              : "Multiple Scans"}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="px-3 py-3 sm:px-6 sm:py-4">
                  <button
                    onClick={closeModal}
                    className="w-full bg-blue-600 text-white py-2.5 sm:py-4 px-4 rounded-xl hover:bg-blue-700 transition-colors font-medium"
                  >
                    Continue Scanning
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

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
