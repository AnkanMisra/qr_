import { useCallback, useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import Papa from "papaparse";
import type { ParseError, ParseResult } from "papaparse";
import JSZip from "jszip";
import QRCode from "qrcode";
import { api } from "../../convex/_generated/api";

interface ParsedRow {
  teamName: string;
  leaderName: string;
  teamMemberCount: number;
  roomNumber: string;
  slotNumber: string;
  lineNumber: number;
}

interface ProcessedTicket extends ParsedRow {
  uniqueId: string;
  qrDataUrl: string;
}

export function AdminCsvUpload() {
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [processedTickets, setProcessedTickets] = useState<ProcessedTicket[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastErrorMessages, setLastErrorMessages] = useState<string[]>([]);

  const createTicket = useMutation(api.tickets.createTicket);

  const resetState = useCallback(() => {
    setParsedRows([]);
    setProcessedTickets([]);
    setLastErrorMessages([]);
  }, []);

  const parseCsv = useCallback((file: File) => {
    resetState();
    setSelectedFileName(file.name);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: ParseResult<Record<string, string>>) => {
        const parsed: ParsedRow[] = [];
        const errors: string[] = [];

        results.data.forEach((record, index) => {
          if (!record) {
            errors.push(`Row ${index + 2}: Missing data`);
            return;
          }

          const teamName = (record.TeamName || "").trim();
          const leaderName = (record.TeamLeadName || "").trim();
          const memberValue = record.TeamSize || record.NumberofMember || "";
          const memberCount = Number(memberValue);
          const roomNumber = (record.RoomNumber || "").trim();
          const slotNumber = (record.SlotNumber || "").trim();

          if (!teamName || !leaderName) {
            errors.push(`Row ${index + 2}: Missing team or leader name`);
            return;
          }

          if (!Number.isInteger(memberCount) || memberCount < 2 || memberCount > 4) {
            errors.push(`Row ${index + 2}: Team size must be between 2 and 4`);
            return;
          }

          if (!roomNumber) {
            errors.push(`Row ${index + 2}: Missing room number`);
            return;
          }

          if (!slotNumber) {
            errors.push(`Row ${index + 2}: Missing slot number`);
            return;
          }

          parsed.push({
            teamName,
            leaderName,
            teamMemberCount: memberCount,
            roomNumber,
            slotNumber,
            lineNumber: index + 2,
          });
        });

        if (errors.length > 0) {
          setLastErrorMessages(errors);
          toast.error("CSV contains invalid rows", {
            description: `${errors.length} issue${errors.length === 1 ? "" : "s"} found. Please review the details below.`,
          });
        }

        if (parsed.length === 0) {
          toast.error("No valid rows detected in CSV");
          return;
        }

        setParsedRows(parsed);
        toast.success(`Ready to create ${parsed.length} ticket${parsed.length === 1 ? "" : "s"}`);
      },
      error: (error: ParseError) => {
        toast.error("Failed to parse CSV", { description: error.message });
      },
    });
  }, [resetState]);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      if (!file.name.toLowerCase().endsWith(".csv")) {
        toast.error("Please upload a CSV file");
        return;
      }

      // Enforce 5MB file size limit
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        toast.error("File too large", { 
          description: "Please upload a CSV file smaller than 5MB" 
        });
        return;
      }

      parseCsv(file);
    },
    [parseCsv],
  );

  const safeFileName = useCallback((teamName: string) => {
    // Replace spaces with hyphens and convert to lowercase
    const safeTeam = teamName.trim().replace(/\s+/g, "-").toLowerCase();
    return `${safeTeam || "team"}.png`;
  }, []);

  const processCsvRows = useCallback(async () => {
    if (parsedRows.length === 0) {
      toast.error("Upload and validate a CSV before processing");
      return;
    }

    // Get admin session token
    const sessionToken = localStorage.getItem("admin_session_token");
    
    if (!sessionToken) {
      toast.error("Admin session expired. Please log in again.");
      return;
    }

    setIsProcessing(true);
    setLastErrorMessages([]);

    const successes: ProcessedTicket[] = [];
    const errors: string[] = [];

    for (const row of parsedRows) {
      try {
        const result = await createTicket({
          teamName: row.teamName,
          leaderName: row.leaderName,
          teamMemberCount: row.teamMemberCount,
          roomNumber: row.roomNumber,
          slotNumber: row.slotNumber,
          sessionToken,
        });

        const qrDataUrl = await QRCode.toDataURL(result.uniqueId, {
          width: 300,
          margin: 2,
        });

        successes.push({ ...row, uniqueId: result.uniqueId, qrDataUrl });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error creating ticket";
        
        // Check for authentication errors
        if (message.includes("Unauthorized")) {
          toast.error("Session expired. Please log in again.");
          localStorage.removeItem("admin_session_token");
          setIsProcessing(false);
          return; // Stop processing on auth error
        }
        
        errors.push(`Row ${row.lineNumber}: ${message}`);
      }
    }

    if (errors.length > 0) {
      setLastErrorMessages(errors);
      toast.error("Some tickets failed to create", {
        description: `${errors.length} failure${errors.length === 1 ? "" : "s"}. Check details below.`,
      });
    }

    if (successes.length > 0) {
      setProcessedTickets(successes);
      toast.success(`Created ${successes.length} ticket${successes.length === 1 ? "" : "s"}`);
    }

    setIsProcessing(false);
  }, [createTicket, parsedRows]);

  const downloadZip = useCallback(async () => {
    if (processedTickets.length === 0) {
      toast.error("Process tickets before downloading");
      return;
    }

    const zip = new JSZip();
    const folder = zip.folder("qr-codes");

    if (!folder) {
      toast.error("Failed to prepare zip archive");
      return;
    }

    processedTickets.forEach((ticket) => {
      const base64 = ticket.qrDataUrl.split(",")[1] ?? "";
      folder.file(safeFileName(ticket.teamName), base64, {
        base64: true,
      });
    });

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    link.download = `qr-batch-${timestamp}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Zip download started");
  }, [processedTickets, safeFileName]);

  const summaryStats = useMemo(() => {
    const total = parsedRows.length;
    const processed = processedTickets.length;
    const pending = Math.max(total - processed, 0);
    return { total, processed, pending };
  }, [parsedRows.length, processedTickets.length]);

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-semibold text-gray-900">
            Bulk ticket creation via CSV
          </h2>
          <p className="text-sm text-gray-500">
            Upload a CSV with columns: TeamName, TeamLeadName, TeamSize (2-4), RoomNumber, SlotNumber
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center gap-4">
          <label className="flex w-full max-w-md cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center transition hover:border-gray-400">
            <span className="text-sm font-medium text-gray-700">
              {selectedFileName ? selectedFileName : "Click or drop CSV file"}
            </span>
            <span className="mt-2 text-xs text-gray-500">
              Only .csv files up to 5MB are supported
            </span>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={processCsvRows}
              disabled={parsedRows.length === 0 || isProcessing}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {isProcessing ? "Processing..." : "Create tickets"}
            </button>

            <button
              onClick={downloadZip}
              disabled={processedTickets.length === 0 || isProcessing}
              className="rounded-xl bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-300"
            >
              Download zip
            </button>

            <button
              onClick={resetState}
              disabled={isProcessing}
              className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 text-center">
            Summary
          </h3>
          <div className="mt-4 space-y-3 text-center">
            <div>
              <p className="text-sm text-gray-500">Rows parsed</p>
              <p className="text-xl font-semibold text-gray-900">
                {summaryStats.total}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tickets created</p>
              <p className="text-xl font-semibold text-emerald-600">
                {summaryStats.processed}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-xl font-semibold text-amber-600">
                {summaryStats.pending}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 text-center">
            Recent results
          </h3>
          <div className="mt-4 max-h-64 overflow-y-auto text-sm text-gray-700">
            {processedTickets.length === 0 && lastErrorMessages.length === 0 && (
              <p className="text-center text-gray-500">
                Upload a CSV and create tickets to see results here.
              </p>
            )}
            {processedTickets.map((ticket) => (
              <div
                key={ticket.uniqueId}
                className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 mb-2"
              >
                <p className="font-semibold text-emerald-800">
                  {ticket.teamName} • {ticket.leaderName}
                </p>
                <p className="text-xs text-emerald-700">
                  Team Size: {ticket.teamMemberCount} • Room: {ticket.roomNumber} • Slot: {ticket.slotNumber} • QR ready
                </p>
              </div>
            ))}
            {lastErrorMessages.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-semibold text-red-600 text-center">
                  Issues detected
                </p>
                {lastErrorMessages.map((message, index) => (
                  <div
                    key={`${message}-${index}`}
                    className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-red-700"
                  >
                    {message}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
