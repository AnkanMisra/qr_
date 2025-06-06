import { useState, useRef, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function TicketList() {
  const tickets = useQuery(api.tickets.getAllTickets) || [];
  const [searchTerm, setSearchTerm] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut to focus search (Ctrl/Cmd + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter tickets based on search term
  const filteredTickets = tickets.filter((ticket) =>
    ticket.teamName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col p-4 safe-area-bottom">
      {/* Mobile header */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900 text-center">All Tickets</h2>
        <p className="text-sm text-gray-600 text-center mt-1">
          {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} total
        </p>
      </div>
      
      {/* Mobile search input */}
      <div className="mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search by team name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-12 py-4 text-lg border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-0 pr-4 flex items-center"
            >
              <svg className="h-6 w-6 text-gray-400 hover:text-gray-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        {/* Mobile search tip */}
        <p className="text-xs text-gray-500 mt-2 text-center">
          Tip: Press Ctrl+K to quickly search
        </p>
      </div>
        
      {/* Mobile search results counter */}
      {searchTerm && (
        <div className="mb-4 px-4 py-2 bg-blue-50 rounded-xl border border-blue-200">
          <p className="text-sm text-blue-800 text-center">
            Found <span className="font-bold">{filteredTickets.length}</span> ticket{filteredTickets.length !== 1 ? 's' : ''} matching "<span className="font-semibold">{searchTerm}</span>"
          </p>
        </div>
      )}
      
      {/* Mobile-optimized ticket list */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto space-y-3 pb-4">
          {tickets.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500 text-lg">No tickets created yet</p>
              <p className="text-gray-400 text-sm mt-1">Tickets will appear here once created</p>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p className="text-gray-500 text-lg">No tickets found</p>
              <p className="text-gray-400 text-sm mt-1">No tickets match "{searchTerm}"</p>
              <button
                onClick={() => setSearchTerm("")}
                className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition-colors"
              >
                Clear search
              </button>
            </div>
          ) : (
            filteredTickets.map((ticket) => (
              <div
                key={ticket._id}
                className={`bg-white rounded-2xl p-6 shadow-sm border-l-4 ${
                  ticket.isCheckedIn
                    ? "border-green-500"
                    : "border-yellow-500"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg mb-1">{ticket.teamName}</h3>
                    <p className="text-gray-600 mb-2">Leader: {ticket.leaderName}</p>
                    <p className="text-xs text-gray-500 font-mono bg-gray-50 px-2 py-1 rounded">
                      {ticket.uniqueId}
                    </p>
                    {ticket.checkinCounter !== undefined && ticket.checkinCounter > 0 && (
                      <p className="text-xs text-gray-600 mt-2">
                        Scans: <span className="font-semibold">{ticket.checkinCounter}</span>
                      </p>
                    )}
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span
                      className={`inline-flex px-3 py-1 text-sm font-bold rounded-full mb-2 ${
                        ticket.isCheckedIn
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {ticket.isCheckedIn ? "✓ Checked In" : "⏳ Pending"}
                    </span>
                    {ticket.isCheckedIn && ticket.checkedInAt && (
                      <p className="text-xs text-gray-500">
                        {new Date(ticket.checkedInAt).toLocaleDateString()} at{' '}
                        {new Date(ticket.checkedInAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
