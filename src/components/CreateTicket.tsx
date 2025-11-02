import { useState, type FormEvent } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import QRCode from "qrcode";

interface CreatedTicket {
  uniqueId: string;
  teamName: string;
  leaderName: string;
  teamMemberCount: number;
  roomNumber: string;
  slotNumber: string;
}

export function CreateTicket() {
  const [teamName, setTeamName] = useState("");
  const [leaderName, setLeaderName] = useState("");
  const [teamMemberCount, setTeamMemberCount] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [slotNumber, setSlotNumber] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [lastCreatedTicket, setLastCreatedTicket] = useState<CreatedTicket | null>(
    null,
  );
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);

  const createTicket = useMutation(api.tickets.createTicket);

  const generateQRCode = async (uniqueId: string) => {
    try {
      const qrDataUrl = await QRCode.toDataURL(uniqueId, {
        width: 300,
        margin: 2,
      });
      setQrCodeDataUrl(qrDataUrl);
      return qrDataUrl;
    } catch (_error) {
      toast.error("Failed to generate QR code");
      return null;
    }
  };

  const downloadQRCode = (ticket: CreatedTicket) => {
    if (!qrCodeDataUrl) {
      toast.error("QR code is not ready yet");
      return;
    }

    const link = document.createElement("a");
    // Replace spaces with hyphens and convert to lowercase
    const fileName = ticket.teamName.trim().replace(/\s+/g, "-").toLowerCase();
    link.href = qrCodeDataUrl;
    link.download = `${fileName || "team"}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateTicket = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedTeam = teamName.trim();
    const trimmedLeader = leaderName.trim();
    const trimmedRoom = roomNumber.trim();
    const trimmedSlot = slotNumber.trim();
    const parsedCount = Number(teamMemberCount);

    if (!trimmedTeam || !trimmedLeader || !trimmedRoom || !trimmedSlot || Number.isNaN(parsedCount)) {
      toast.error("Please fill in all fields with valid details");
      return;
    }

    if (
      !Number.isInteger(parsedCount) ||
      parsedCount < 2 ||
      parsedCount > 4
    ) {
      toast.error("Team member count must be between 2 and 4 members");
      return;
    }

    setIsCreating(true);
    setQrCodeDataUrl(null);

    try {
      // Get admin session token from localStorage
      const sessionToken = localStorage.getItem("admin_session_token");
      
      if (!sessionToken) {
        toast.error("Admin session expired. Please log in again.");
        setIsCreating(false);
        return;
      }

      const result = await createTicket({
        teamName: trimmedTeam,
        leaderName: trimmedLeader,
        teamMemberCount: parsedCount,
        roomNumber: trimmedRoom,
        slotNumber: trimmedSlot,
        sessionToken,
      });

      setLastCreatedTicket({
        uniqueId: result.uniqueId,
        teamName: trimmedTeam,
        leaderName: trimmedLeader,
        teamMemberCount: parsedCount,
        roomNumber: trimmedRoom,
        slotNumber: trimmedSlot,
      });

      await generateQRCode(result.uniqueId);

      toast.success("Ticket created successfully");
      setTeamName("");
      setLeaderName("");
      setTeamMemberCount("");
      setRoomNumber("");
      setSlotNumber("");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to create ticket";
      
      if (errorMessage.includes("Unauthorized")) {
        toast.error("Session expired. Please log in again.");
        // Clear expired session
        localStorage.removeItem("admin_session_token");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-10 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold text-gray-900">Create ticket</h2>
          <p className="mt-2 text-sm text-gray-500">
            Enter the team details to generate their QR code.
          </p>
        </div>

        <form onSubmit={handleCreateTicket} className="space-y-5 text-center">
          <div className="space-y-2">
            <label
              htmlFor="teamName"
              className="block text-sm font-medium text-gray-700 text-center"
            >
              Team name
            </label>
            <input
              id="teamName"
              name="teamName"
              type="text"
              autoComplete="off"
              required
              value={teamName}
              onChange={(event) => setTeamName(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 text-center placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-0"
              placeholder="Awesome Squad"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="leaderName"
              className="block text-sm font-medium text-gray-700 text-center"
            >
              Team leader name
            </label>
            <input
              id="leaderName"
              name="leaderName"
              type="text"
              autoComplete="off"
              required
              value={leaderName}
              onChange={(event) => setLeaderName(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 text-center placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-0"
              placeholder="Alex Johnson"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="teamMemberCount"
              className="block text-sm font-medium text-gray-700 text-center"
            >
              Team Size (Number of members)
            </label>
            <input
              id="teamMemberCount"
              name="teamMemberCount"
              type="number"
              min={2}
              max={4}
              step={1}
              inputMode="numeric"
              required
              value={teamMemberCount}
              onChange={(event) => setTeamMemberCount(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 text-center placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-0"
              placeholder="2"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="roomNumber"
              className="block text-sm font-medium text-gray-700 text-center"
            >
              Room Number
            </label>
            <input
              id="roomNumber"
              name="roomNumber"
              type="text"
              autoComplete="off"
              required
              value={roomNumber}
              onChange={(event) => setRoomNumber(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 text-center placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-0"
              placeholder="101"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="slotNumber"
              className="block text-sm font-medium text-gray-700 text-center"
            >
              Slot Number
            </label>
            <input
              id="slotNumber"
              name="slotNumber"
              type="text"
              autoComplete="off"
              required
              value={slotNumber}
              onChange={(event) => setSlotNumber(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 text-center placeholder:text-gray-400 focus:border-gray-400 focus:outline-none focus:ring-0"
              placeholder="A1"
            />
          </div>

          <button
            type="submit"
            disabled={
              isCreating ||
              !teamName.trim() ||
              !leaderName.trim() ||
              !teamMemberCount.trim() ||
              !roomNumber.trim() ||
              !slotNumber.trim() ||
              Number(teamMemberCount) < 2 ||
              Number(teamMemberCount) > 4
            }
            className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCreating ? "Creating..." : "Create ticket"}
          </button>
        </form>
      </div>

      {lastCreatedTicket && (
        <div className="w-full max-w-2xl rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-gray-900">Ticket created</h3>
            <p className="text-sm text-gray-500">
              Share the QR code with the team to scan at entry.
            </p>
          </div>

          <div className="mt-6 grid gap-4 text-sm text-gray-700 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-gray-100 px-4 py-3">
              <p className="font-medium text-gray-500">Team</p>
              <p className="mt-1 font-semibold text-gray-900">
                {lastCreatedTicket.teamName}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 px-4 py-3">
              <p className="font-medium text-gray-500">Leader</p>
              <p className="mt-1 font-semibold text-gray-900">
                {lastCreatedTicket.leaderName}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 px-4 py-3">
              <p className="font-medium text-gray-500">Team Size</p>
              <p className="mt-1 font-semibold text-gray-900">
                {lastCreatedTicket.teamMemberCount}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 px-4 py-3">
              <p className="font-medium text-gray-500">Room Number</p>
              <p className="mt-1 font-semibold text-gray-900">
                {lastCreatedTicket.roomNumber}
              </p>
            </div>
            <div className="rounded-xl border border-gray-100 px-4 py-3">
              <p className="font-medium text-gray-500">Slot Number</p>
              <p className="mt-1 font-semibold text-gray-900">
                {lastCreatedTicket.slotNumber}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Ticket ID
            </p>
            <p className="mt-2 break-all font-mono text-sm text-gray-900">
              {lastCreatedTicket.uniqueId}
            </p>
          </div>

          {qrCodeDataUrl && (
            <div className="mt-6 flex justify-center">
              <div className="rounded-2xl border border-gray-200 p-4">
                <img
                  src={qrCodeDataUrl}
                  alt="QR code for ticket"
                  className="h-48 w-48"
                />
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={() => downloadQRCode(lastCreatedTicket)}
              className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 sm:w-auto sm:px-6"
            >
              Download QR code
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
