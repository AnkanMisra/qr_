import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function TicketList() {
  const ticketsQuery = useQuery(api.tickets.getAllTickets);
  const isLoading = ticketsQuery === undefined;
  const tickets = ticketsQuery ?? [];
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [filterRoom, setFilterRoom] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "checked" | "pending">("all");
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

  // Get unique room numbers for filter dropdown
  const uniqueRooms = useMemo(() => {
    if (!tickets) return [];
    const rooms = tickets
      .filter((t) => t.roomNumber)
      .map((t) => t.roomNumber as string);
    return Array.from(new Set(rooms)).sort();
  }, [tickets]);

  // Filter tickets based on search term and room
  const filteredTickets = useMemo(() => {
    const normalized = debouncedSearchTerm.toLowerCase().trim();
    
    return tickets.filter((ticket) => {
      const matchesSearch = !normalized || 
        ticket.teamName.toLowerCase().includes(normalized);
      
      const matchesRoom = filterRoom === "all" || 
        ticket.roomNumber === filterRoom;
      
      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "checked" && ticket.isCheckedIn) ||
        (filterStatus === "pending" && !ticket.isCheckedIn);
      
      return matchesSearch && matchesRoom && matchesStatus;
    });
  }, [debouncedSearchTerm, tickets, filterRoom, filterStatus]);

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

  const handleRoomFilterChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setFilterRoom(e.target.value);
    },
    [],
  );

  const handleStatusFilterChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setFilterStatus(e.target.value as "all" | "checked" | "pending");
    },
    [],
  );

  // Loading derived from useQuery undefined (see above)

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 pb-safe-bottom">
        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">All Tickets</h2>
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{tickets.length}</span>{" "}
            ticket{tickets.length === 1 ? "" : "s"} in the system
          </p>
        </div>

        {/* Filters Section */}
        <div className="space-y-3 bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search by team name"
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute inset-y-0 right-0 px-4 text-xs font-semibold text-blue-600 hover:text-blue-800"
              >
                Clear
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <select
              value={filterStatus}
              onChange={handleStatusFilterChange}
              className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
            >
              <option value="all">All Status</option>
              <option value="checked">Checked In</option>
              <option value="pending">Pending</option>
            </select>

            <select
              value={filterRoom}
              onChange={handleRoomFilterChange}
              className="w-full rounded-xl border border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
            >
              <option value="all">All Rooms</option>
              {uniqueRooms.map((room) => (
                <option key={room} value={room}>
                  Room {room}
                </option>
              ))}
            </select>
          </div>

          <p className="text-[11px] text-gray-500 text-center">
            Press <kbd className="px-2 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Ctrl+K</kbd> to focus search
          </p>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
            <p className="text-base font-semibold text-gray-700">
              Loading tickets...
            </p>
            <p className="mt-1 text-sm text-gray-500">Please wait a moment</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-white p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-base font-semibold text-gray-700">No tickets yet</p>
            <p className="mt-2 text-sm text-gray-500">
              Tickets created by admin will appear here instantly.
            </p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50 p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-base font-bold text-blue-800">
              No matches found
              {debouncedSearchTerm && ` for "${debouncedSearchTerm}"`}
              {filterStatus !== "all" && ` with status ${filterStatus === "checked" ? "Checked In" : "Pending"}`}
              {filterRoom !== "all" && ` in Room ${filterRoom}`}
            </p>
            <p className="mt-2 text-sm text-blue-600">
              Try adjusting your search or filters
            </p>
            <button
              onClick={() => {
                clearSearch();
                setFilterRoom("all");
                setFilterStatus("all");
              }}
              className="mt-4 rounded-xl bg-blue-600 text-white px-6 py-2.5 text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
            >
              Reset filters
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
                  className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <span
                        className={`inline-flex h-2.5 w-2.5 rounded-full flex-shrink-0 ${
                          ticket.isCheckedIn ? "bg-green-500" : "bg-amber-500"
                        }`}
                      ></span>
                      <h3 className="text-lg font-bold text-gray-900 truncate">
                        {ticket.teamName}
                      </h3>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold flex-shrink-0 ${
                        ticket.isCheckedIn
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {ticket.isCheckedIn ? "Checked in" : "Pending"}
                    </span>
                  </div>

                  {/* Team Details - Split into two lines */}
                  <div className="space-y-1 mb-2.5">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Leader:</span>{" "}
                      <span className="text-gray-900 font-semibold">
                        {ticket.leaderName}
                      </span>
                      {membersLabel && (
                        <span className="ml-3 text-gray-500">• {membersLabel}</span>
                      )}
                    </div>
                    {(ticket.roomNumber || ticket.slotNumber) && (
                      <div className="text-sm text-gray-600">
                        {ticket.roomNumber && (
                          <span className="text-gray-500">
                            • Room <span className="font-semibold text-gray-700">{ticket.roomNumber}</span>
                          </span>
                        )}
                        {ticket.slotNumber && (
                          <span className="ml-3 text-gray-500">
                            • Slot <span className="font-semibold text-gray-700">{ticket.slotNumber}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Ticket ID */}
                  <div className="text-[11px] font-mono text-gray-400 mb-3 truncate">
                    {ticket.uniqueId}
                  </div>

                  {/* Check-in Details */}
                  {ticket.isCheckedIn && (
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      {ticket.checkedInAt && (
                        <div className="text-xs text-gray-600">
                          {new Date(ticket.checkedInAt).toLocaleString(
                            undefined,
                            {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </div>
                      )}
                      {ticket.checkinCounter !== undefined &&
                        ticket.checkinCounter > 0 && (
                          <div className="text-xs font-semibold text-gray-700">
                            Scans: {ticket.checkinCounter}
                          </div>
                        )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
