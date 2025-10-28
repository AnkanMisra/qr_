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
}

export function CreateTicket() {
  const [teamName, setTeamName] = useState("");
  const [leaderName, setLeaderName] = useState("");
  const [teamMemberCount, setTeamMemberCount] = useState("");
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
    const safeTeamName = ticket.teamName.trim().replace(/\s+/g, "-").toLowerCase();
    const safeLeaderName = ticket.leaderName
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase();
    const fileName = `${safeTeamName || "team"}-${safeLeaderName || "leader"}`;
    link.href = qrCodeDataUrl;
    link.download = `${fileName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateTicket = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedTeam = teamName.trim();
    const trimmedLeader = leaderName.trim();
    const parsedCount = Number(teamMemberCount);

    if (!trimmedTeam || !trimmedLeader || Number.isNaN(parsedCount)) {
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
      const result = await createTicket({
        teamName: trimmedTeam,
        leaderName: trimmedLeader,
        teamMemberCount: parsedCount,
      });

      setLastCreatedTicket({
        uniqueId: result.uniqueId,
        teamName: trimmedTeam,
        leaderName: trimmedLeader,
        teamMemberCount: parsedCount,
      });

      await generateQRCode(result.uniqueId);

      toast.success("Ticket created successfully");
      setTeamName("");
      setLeaderName("");
      setTeamMemberCount("");
    } catch (_error) {
      toast.error("Failed to create ticket");
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
              Number of team members
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

          <button
            type="submit"
            disabled={
              isCreating ||
              !teamName.trim() ||
              !leaderName.trim() ||
              !teamMemberCount.trim() ||
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

          <div className="mt-6 grid gap-4 text-sm text-gray-700 sm:grid-cols-3">
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
              <p className="font-medium text-gray-500">Members</p>
              <p className="mt-1 font-semibold text-gray-900">
                {lastCreatedTicket.teamMemberCount}
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
