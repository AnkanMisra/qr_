import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function TicketList() {
  const tickets = useQuery(api.tickets.getAllTickets) || [];
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut to focus search (Ctrl/Cmd + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Debounce search term to reduce re-renders
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Filter tickets based on search term
  const filteredTickets = useMemo(() => {
    const normalized = debouncedSearchTerm.toLowerCase().trim();
    if (!normalized) {
      return tickets;
    }
    return tickets.filter((ticket) =>
      ticket.teamName.toLowerCase().includes(normalized),
    );
  }, [debouncedSearchTerm, tickets]);

  // Memoized event handlers to prevent child re-renders
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
    },
    [],
  );

  const clearSearch = useCallback(() => {
    setSearchTerm("");
    setDebouncedSearchTerm("");
  }, []);

  // Loading state
  const isLoading = tickets.length === 0;

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-3 py-5 pb-safe-bottom">
        <div className="text-center space-y-1">
          <h2 className="text-lg font-semibold text-gray-900">All tickets</h2>
          <p className="text-xs text-gray-500">
            {tickets.length} ticket{tickets.length === 1 ? "" : "s"} in the
            system
          </p>
        </div>

        <div>
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search by team name"
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-0"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 px-4 text-xs font-medium text-gray-500 hover:text-gray-800"
              >
                Clear
              </button>
            )}
          </div>
          <p className="mt-1 text-[11px] text-gray-500 text-center">
            Press Ctrl + K to focus search
          </p>
        </div>

        {tickets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center">
            <p className="text-sm font-medium text-gray-600">No tickets yet</p>
            <p className="mt-1 text-xs text-gray-500">
              Tickets created by admin will appear here instantly.
            </p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-blue-200 bg-blue-50 p-8 text-center">
            <p className="text-sm font-medium text-blue-700">
              No matches for “{debouncedSearchTerm}”
            </p>
            <button
              onClick={clearSearch}
              className="mt-3 rounded-lg border border-blue-200 px-4 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
            >
              Reset search
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTickets.map((ticket) => {
              const membersLabel =
                ticket.teamMemberCount !== undefined
                  ? `${ticket.teamMemberCount} member${
                      ticket.teamMemberCount === 1 ? "" : "s"
                    }`
                  : undefined;

              return (
                <div
                  key={ticket._id}
                  className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span
                          className={`inline-flex h-2 w-2 rounded-full ${
                            ticket.isCheckedIn ? "bg-green-500" : "bg-amber-500"
                          }`}
                        ></span>
                        <h3 className="text-base font-semibold text-gray-900">
                          {ticket.teamName}
                        </h3>
                      </div>
                      <div className="text-xs text-gray-600">
                        Leader:{" "}
                        <span className="font-medium text-gray-800">
                          {ticket.leaderName}
                        </span>
                        {membersLabel && (
                          <span className="ml-2">• {membersLabel}</span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-gray-400">
                        {ticket.uniqueId}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1 text-xs text-gray-500">
                      <span
                        className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
                          ticket.isCheckedIn
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {ticket.isCheckedIn ? "Checked in" : "Pending"}
                      </span>
                      {ticket.isCheckedIn && ticket.checkedInAt && (
                        <p>
                          {new Date(ticket.checkedInAt).toLocaleString(
                            undefined,
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </p>
                      )}
                      {ticket.checkinCounter !== undefined &&
                        ticket.checkinCounter > 0 && (
                          <p>Scans: {ticket.checkinCounter}</p>
                        )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
