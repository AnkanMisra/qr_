import { useState, useRef, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function AdminTicketsView() {
  const tickets = useQuery(api.tickets.getAllTickets) || [];
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "checked" | "pending">("all");
  const [sortBy, setSortBy] = useState<"recent" | "name" | "checkins">("recent");
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

  // Filter and sort tickets
  const processedTickets = tickets
    .filter((ticket) => {
      const matchesSearch = ticket.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           ticket.leaderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           ticket.uniqueId.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === "all" || 
                           (filterStatus === "checked" && ticket.isCheckedIn) ||
                           (filterStatus === "pending" && !ticket.isCheckedIn);
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
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

  // Stats
  const totalTickets = tickets.length;
  const checkedInTickets = tickets.filter(t => t.isCheckedIn).length;
  const pendingTickets = totalTickets - checkedInTickets;
  const totalScans = tickets.reduce((sum, t) => sum + (t.checkinCounter || 0), 0);
  const uniqueScanners = tickets.reduce((set, t) => {
    if (t.scannedBy) {
      set.add(t.scannedBy);
    }
    return set;
  }, new Set<string>()).size;

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Admin Tickets Overview</h2>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{totalTickets}</div>
            <div className="text-sm text-blue-800">Total Tickets</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">{checkedInTickets}</div>
            <div className="text-sm text-green-800">Checked In</div>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-600">{pendingTickets}</div>
            <div className="text-sm text-yellow-800">Pending</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">{totalScans}</div>
            <div className="text-sm text-purple-800">Total Scans</div>
          </div>
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-indigo-600">{uniqueScanners}</div>
            <div className="text-sm text-indigo-800">Active Scanners</div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search tickets... (Ctrl+K)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Filter */}
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="checked">Checked In</option>
              <option value="pending">Pending</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="recent">Most Recent</option>
              <option value="name">Team Name</option>
              <option value="checkins">Most Scans</option>
            </select>
          </div>
        </div>

        {/* Results Info */}
        <div className="mt-4 text-sm text-gray-600">
          Showing {processedTickets.length} of {totalTickets} tickets
          {searchTerm && (
            <span> matching "{searchTerm}"</span>
          )}
        </div>
      </div>

      {/* Tickets Table */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          {processedTickets.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500 text-lg">
                {tickets.length === 0 ? "No tickets created yet" : "No tickets match your filters"}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white">
              {/* Desktop Table */}
              <div className="hidden lg:block">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leader</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scans</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check-in Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scanned By</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {processedTickets.map((ticket) => (
                      <tr key={ticket._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{ticket.teamName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{ticket.leaderName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {ticket.uniqueId}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            ticket.isCheckedIn
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}>
                            {ticket.isCheckedIn ? "✓ Checked In" : "Pending"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {ticket.checkinCounter || 0}
                            {(ticket.checkinCounter || 0) > 1 && (
                              <span className="text-red-500 ml-1">⚠️</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {new Date(ticket._creationTime).toLocaleDateString()}
                            <br />
                            {new Date(ticket._creationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {ticket.checkedInAt ? (
                              <>
                                {new Date(ticket.checkedInAt).toLocaleDateString()}
                                <br />
                                {new Date(ticket.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </>
                            ) : (
                              "Not checked in"
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {ticket.scannedBy ? (
                              <span className="inline-flex items-center gap-1">
                                <span className="inline-block h-2 w-2 rounded-full bg-green-500"></span>
                                {ticket.scannedBy}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden p-4 space-y-4">
                {processedTickets.map((ticket) => (
                  <div key={ticket._id} className={`bg-white rounded-lg p-4 border-l-4 shadow-sm ${
                    ticket.isCheckedIn ? "border-green-500" : "border-yellow-500"
                  }`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">{ticket.teamName}</h3>
                        <p className="text-gray-600">Leader: {ticket.leaderName}</p>
                      </div>
                      <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                        ticket.isCheckedIn
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {ticket.isCheckedIn ? "✓ Checked In" : " Pending"}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Ticket ID:</span>
                        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{ticket.uniqueId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Scans:</span>
                        <span className="font-semibold">
                          {ticket.checkinCounter || 0}
                          {(ticket.checkinCounter || 0) > 1 && <span className="text-red-500 ml-1">⚠️</span>}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Created:</span>
                        <span>{new Date(ticket._creationTime).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Scanned by:</span>
                        <span>{ticket.scannedBy ?? "—"}</span>
                      </div>
                      {ticket.checkedInAt && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Checked in:</span>
                          <span>{new Date(ticket.checkedInAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 