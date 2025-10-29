import { useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import QrScannerLib from "qr-scanner";
import { toast } from "sonner";
import { TicketNotFoundModal } from "./TicketNotFoundModal";
import { useScannerAuth } from "../contexts/ScannerAuthContext";

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

  const handleQRScan = async (qrData: string) => {
    const now = Date.now();

    // Prevent duplicate processing of the same QR code or rapid scans
    if (
      isProcessingRef.current ||
      lastProcessedQRRef.current === qrData ||
      now - lastScanTime < 2000
    ) {
      console.log(" Skipping duplicate, processing, or rapid scan:", qrData);
      return;
    }

    setLastScanTime(now);

    // Immediately stop the scanner to prevent rapid-fire scans
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
    }

    setIsProcessing(true);
    isProcessingRef.current = true;
    setLastProcessedQR(qrData);
    lastProcessedQRRef.current = qrData;
    setIsActive(false);

    try {
      console.log("🎫 Processing ticket:", qrData);

      const result = await scanTicket({
        uniqueId: qrData,
        timestamp: Date.now(),
        scannedBy: scannerName || "Unknown Scanner",
      });

      if (result.status === "success") {
        // Show success modal
        setModalData(result as TicketResult);
        setShowModal(true);
        void toast.success(result.message, {
          description: `Team: ${result.ticket?.teamName} | Leader: ${result.ticket?.leaderName}`,
          duration: 4000,
        });
      } else if (result.status === "warning") {
        // Show warning modal for already checked in tickets
        setModalData(result as TicketResult);
        setShowModal(true);
        void toast.warning(result.message, {
          description: `Team: ${result.ticket?.teamName} | Already checked in`,
          duration: 4000,
        });
      } else {
        // Show ticket not found modal for error cases
        setNotFoundCode(qrData);
        setShowNotFoundModal(true);
        void toast.error(result.message, { duration: 4000 });
      }

      // Restart scanner after processing with delay
      setTimeout(() => {
        if (qrScannerRef.current && !showModal && !showNotFoundModal) {
          qrScannerRef.current.start();
        }
        setIsActive(true);
        setLastProcessedQR(""); // Reset after pause
        lastProcessedQRRef.current = "";
      }, 3000);
    } catch (err) {
      console.error("❌ Ticket processing failed:", err);
      // Show not found modal for processing errors too
      setNotFoundCode(qrData);
      setShowNotFoundModal(true);
      void toast.error("Failed to process ticket");
      setLastProcessedQR(""); // Reset on error
      lastProcessedQRRef.current = "";
      // Restart scanner on error
      setTimeout(() => {
        if (qrScannerRef.current && !showNotFoundModal) {
          qrScannerRef.current.start();
        }
        setIsActive(true);
      }, 2000);
    } finally {
      setIsProcessing(false);
      isProcessingRef.current = false;
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
    setNotFoundCode("");
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
      qrScannerRef.current
        .start()
        .then(() => {
          setIsActive(true);
          console.log(" QR Scanner started manually");
        })
        .catch((err) => {
          console.error("❌ Failed to start scanner:", err);
          toast.error("Failed to start camera");
        });
    }
  };

  const stopScanner = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      setIsActive(false);
      console.log(" QR Scanner stopped manually");
    }
  };

  useEffect(() => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const qrScanner = new QrScannerLib(
      video,
      (result) => {
        console.log("QR Code detected:", result.data);
        setScannedData(result.data);
        if (isActive && !isProcessing) {
          handleQRScan(result.data);
        }
      },
      {
        returnDetailedScanResult: true,
        highlightScanRegion: true,
        highlightCodeOutline: true,
        preferredCamera: "environment",
        maxScansPerSecond: 10,
      },
    );

    qrScannerRef.current = qrScanner;
    qrScanner
      .start()
      .then(() => {
        console.log("QR Scanner started successfully");
      })
      .catch((err) => {
        console.error("❌ QR Scanner failed to start:", err);
        toast.error("Camera access failed. Please allow camera permissions.");
      });

    return () => {
      console.log("Cleaning up QR Scanner");
      qrScanner.stop();
      qrScanner.destroy();
    };
  }, [handleQRScan, isActive, isProcessing]);

  return (
    <div className="h-full w-full relative bg-black overflow-hidden">
      {/* Video Element - Hardware accelerated */}
      <div className="absolute inset-0 w-full h-full">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          style={{
            display: "block",
            transform: "translateZ(0)",
            willChange: "transform",
          }}
          autoPlay
          playsInline
          muted
        />
      </div>

      {/* Modern Overlay UI */}
      <div className="absolute inset-0 flex flex-col pointer-events-none">
        {/* Header with Gradient */}
        <div className="bg-gradient-to-b from-black/90 via-black/60 to-transparent text-white px-6 pt-safe-top pb-8 pointer-events-auto">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold tracking-tight">
                Live Scanner
              </h1>
              <p className="text-white/80 text-sm mt-1">
                {isProcessing
                  ? "Verifying ticket..."
                  : isActive
                    ? "Point camera at QR code"
                    : "Scanner paused"}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={isActive ? stopScanner : startScanner}
                className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all text-xs font-medium active:scale-95"
              >
                {isActive ? "Pause" : "Resume"}
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all text-xs font-medium active:scale-95"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Scanning Frame - Centered */}
        <div className="flex-1 flex items-center justify-center px-8 pb-safe-bottom">
          <div className="relative">
            {/* Modern scanning frame with rounded corners */}
            <div className="relative w-72 h-72 sm:w-80 sm:h-80">
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
            <div className="mt-8 text-center pointer-events-auto">
              <div className="inline-flex items-center space-x-3 bg-black/90 backdrop-blur-md px-6 py-3 rounded-full border border-white/10">
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
        <div className="bg-gradient-to-t from-black/90 via-black/60 to-transparent text-white px-6 pb-safe-bottom pt-6 pointer-events-auto">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {scannedData ? (
                <div>
                  <p className="text-xs text-white/60 uppercase tracking-wide">
                    Last Scan
                  </p>
                  <p className="text-sm font-mono text-white/90 mt-0.5">
                    {scannedData.slice(0, 16)}...
                  </p>
                  <p className="text-xs text-white/50 mt-0.5">
                    {new Date(lastScanTime).toLocaleTimeString()}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-white/60 uppercase tracking-wide">
                    Ready
                  </p>
                  <p className="text-sm text-white/90 mt-0.5">
                    Awaiting first scan
                  </p>
                </div>
              )}
            </div>
            <div className="ml-4 px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm">
              <p className="text-xs text-white/70 font-medium">Camera Active</p>
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
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 p-4 pt-safe-top pb-safe-bottom">
              <div className="bg-white rounded-xl max-w-sm w-full mx-4 my-8 overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
                {/* Modal Header */}
                <div
                  className={`p-6 text-center ${
                    isFirstCheckIn
                      ? "bg-green-500"
                      : isSecondScan
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                >
                  <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                    {isFirstCheckIn && (
                      <svg
                        className="w-8 h-8 text-white"
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
                        className="w-8 h-8 text-white"
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
                  <h2 className="text-xl font-bold text-white mb-2">
                    {isFirstCheckIn
                      ? "Check-in Successful!"
                      : isSecondScan
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
                          {modalData.ticket.scannedBy && (
                            <p className="text-sm text-gray-600">
                              Scanned by: {modalData.ticket.scannedBy}
                            </p>
                          )}
                          {modalData.ticket.teamMemberCount !== undefined && (
                            <p className="text-sm text-gray-600">
                              Team size: {modalData.ticket.teamMemberCount}
                            </p>
                          )}
                        </div>

                        {/* Check-in details */}
                        <div className="border-t pt-3 space-y-2">
                          {modalData.ticket.checkedInAt && (
                            <div className="text-center">
                              <p className="text-xs text-gray-500">
                                Check-in Time
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
