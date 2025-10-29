import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { TicketDetailsModal } from "./TicketDetailsModal";

type Ticket = {
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
};

export function AdminTicketsView() {
  const tickets = useQuery(api.tickets.getAllTickets) || [];
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "checked" | "pending"
  >("all");
  const [sortBy, setSortBy] = useState<"recent" | "name" | "checkins">(
    "recent",
  );
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

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

  // Memoized filtering and sorting to prevent unnecessary recalculations
  const processedTickets = useMemo(() => {
    let filtered = tickets.filter((ticket) => {
      const matchesSearch =
        ticket.teamName
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase()) ||
        ticket.leaderName
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase()) ||
        ticket.uniqueId
          .toLowerCase()
          .includes(debouncedSearchTerm.toLowerCase());

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "checked" && ticket.isCheckedIn) ||
        (filterStatus === "pending" && !ticket.isCheckedIn);

      return matchesSearch && matchesStatus;
    });

    // Sort tickets
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return b._creationTime - a._creationTime;
        case "name":
          return a.teamName.localeCompare(b.teamName);
        case "checkins":
          return (b.checkinCounter || 0) - (a.checkinCounter || 0);
        default:
          return 0;
      }
    });
  }, [tickets, debouncedSearchTerm, filterStatus, sortBy]);

  // Memoized stats calculation
  const stats = useMemo(() => {
    const totalTickets = tickets.length;
    const checkedInTickets = tickets.filter((t) => t.isCheckedIn).length;
    const pendingTickets = totalTickets - checkedInTickets;
    const totalScans = tickets.reduce(
      (sum, t) => sum + (t.checkinCounter || 0),
      0,
    );
    return { totalTickets, checkedInTickets, pendingTickets, totalScans };
  }, [tickets]);

  // Memoized event handlers to prevent child re-renders
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
    },
    [],
  );

  const handleFilterChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setFilterStatus(e.target.value as "all" | "checked" | "pending");
    },
    [],
  );

  const handleSortChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setSortBy(e.target.value as "recent" | "name" | "checkins");
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
    <div className="h-full flex flex-col bg-gray-50">
      {/* Modal */}
      <TicketDetailsModal
        ticket={selectedTicket}
        onClose={() => setSelectedTicket(null)}
      />

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Admin Tickets Overview
        </h2>

        {/* Stats Cards - Minimal Design */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">
              {stats.totalTickets}
            </div>
            <div className="text-xs text-gray-500 mt-1">Total Tickets</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {stats.checkedInTickets}
            </div>
            <div className="text-xs text-gray-500 mt-1">Checked In</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">
              {stats.pendingTickets}
            </div>
            <div className="text-xs text-gray-500 mt-1">Pending</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {stats.totalScans}
            </div>
            <div className="text-xs text-gray-500 mt-1">Total Scans</div>
          </div>
        </div>

        {/* Controls - Responsive Design */}
        <div className="px-2 lg:px-0">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
            {/* Search */}
            <div className="flex-1 w-full lg:w-auto">
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search by team name, leader, or ID"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full lg:max-w-md rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-gray-400 focus:outline-none focus:ring-0"
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
              <p className="mt-1 text-[11px] text-gray-500 text-center lg:text-left">
                Press Ctrl + K to focus search
              </p>
            </div>

            {/* Filter - Mobile: Full width, Desktop: Inline */}
            <div className="flex flex-col gap-2 lg:flex-row lg:gap-2 lg:shrink-0">
              <select
                value={filterStatus}
                onChange={handleFilterChange}
                className="w-full lg:w-auto px-4 py-2.5 border border-gray-200 rounded-2xl bg-white text-sm focus:outline-none focus:ring-0"
              >
                <option value="all">All Status</option>
                <option value="checked">Checked In</option>
                <option value="pending">Pending</option>
              </select>

              <select
                value={sortBy}
                onChange={handleSortChange}
                className="w-full lg:w-auto px-4 py-2.5 border border-gray-200 rounded-2xl bg-white text-sm focus:outline-none focus:ring-0"
              >
                <option value="recent">Most Recent</option>
                <option value="name">Team Name</option>
                <option value="checkins">Most Scans</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Info */}
        <div className="mt-4 text-sm text-gray-600">
          Showing {processedTickets.length} of {stats.totalTickets} tickets
          {debouncedSearchTerm && (
            <span> matching "{debouncedSearchTerm}"</span>
          )}
        </div>
      </div>

      {/* Tickets Table */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          {processedTickets.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <p className="text-gray-500 text-lg">
                {tickets.length === 0
                  ? "No tickets created yet"
                  : "No tickets match your filters"}
              </p>
              {debouncedSearchTerm && (
                <button
                  onClick={clearSearch}
                  className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {processedTickets.map((ticket) => {
                const membersLabel =
                  ticket.teamMemberCount !== undefined
                    ? `${ticket.teamMemberCount} member${
                        ticket.teamMemberCount === 1 ? "" : "s"
                      }`
                    : undefined;

                return (
                  <div
                    key={ticket._id}
                    onClick={() => setSelectedTicket(ticket)}
                    className="rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span
                            className={`inline-flex h-2 w-2 rounded-full ${
                              ticket.isCheckedIn
                                ? "bg-green-500"
                                : "bg-amber-500"
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
                        {ticket.scannedBy && (
                          <p className="flex items-center gap-1">
                            <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500"></span>
                            {ticket.scannedBy}
                          </p>
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
    </div>
  );
}
