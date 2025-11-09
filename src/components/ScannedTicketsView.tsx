import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { Search, Users, Clock, User, MapPin, Calendar, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

export function ScannedTicketsView() {
  const allTickets = useQuery(api.tickets.getAllTickets);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "name" | "counter">("recent");

  // Filter only scanned tickets (checkinCounter > 0)
  const scannedTickets = allTickets?.filter(
    (ticket) => ticket.checkinCounter && ticket.checkinCounter > 0
  ) || [];

  // Filter by search query
  const filteredTickets = scannedTickets.filter((ticket) => {
    const query = searchQuery.toLowerCase();
    return (
      ticket.teamName.toLowerCase().includes(query) ||
      ticket.leaderName.toLowerCase().includes(query) ||
      ticket.roomNumber?.toLowerCase().includes(query) ||
      ticket.slotNumber?.toLowerCase().includes(query) ||
      ticket.scannedBy?.toLowerCase().includes(query)
    );
  });

  // Sort tickets
  const sortedTickets = [...filteredTickets].sort((a, b) => {
    if (sortBy === "recent") {
      return (b.checkedInAt || 0) - (a.checkedInAt || 0);
    } else if (sortBy === "name") {
      return a.teamName.localeCompare(b.teamName);
    } else if (sortBy === "counter") {
      return (b.checkinCounter || 0) - (a.checkinCounter || 0);
    }
    return 0;
  });

  // Statistics
  const totalScanned = scannedTickets.length;
  const multipleScans = scannedTickets.filter(t => (t.checkinCounter || 0) > 1).length;
  const totalPeople = scannedTickets.reduce((sum, t) => sum + (t.teamMemberCount || 0), 0);

  // Export to Excel function
  const exportToExcel = () => {
    try {
      // Prepare data for Excel
      const excelData = sortedTickets.map((ticket, index) => ({
        "S.No": index + 1,
        "Team Name": ticket.teamName,
        "Leader Name": ticket.leaderName,
        "Team Members": ticket.teamMemberCount || 0,
        "Room Number": ticket.roomNumber || "N/A",
        "Slot Number": ticket.slotNumber || "N/A",
        "Check-in Date": ticket.checkedInAt 
          ? new Date(ticket.checkedInAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric"
            })
          : "N/A",
        "Check-in Time": ticket.checkedInAt
          ? new Date(ticket.checkedInAt).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit"
            })
          : "N/A",
        "Scanned By": ticket.scannedBy || "N/A",
        "Scan Count": ticket.checkinCounter || 0,
        "Unique ID": ticket.uniqueId,
      }));

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const columnWidths = [
        { wch: 6 },  // S.No
        { wch: 25 }, // Team Name
        { wch: 25 }, // Leader Name
        { wch: 15 }, // Team Members
        { wch: 15 }, // Room Number
        { wch: 15 }, // Slot Number
        { wch: 18 }, // Check-in Date
        { wch: 18 }, // Check-in Time
        { wch: 20 }, // Scanned By
        { wch: 12 }, // Scan Count
        { wch: 38 }, // Unique ID
      ];
      worksheet['!cols'] = columnWidths;

      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Scanned Tickets");

      // Add summary sheet
      const summaryData = [
        { "Metric": "Total Teams Scanned", "Value": totalScanned },
        { "Metric": "Total People Attended", "Value": totalPeople },
        { "Metric": "Multiple Scans", "Value": multipleScans },
        { "Metric": "Export Date", "Value": new Date().toLocaleString() },
      ];
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      summarySheet['!cols'] = [{ wch: 25 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `Scanned_Tickets_${timestamp}.xlsx`;

      // Download file
      XLSX.writeFile(workbook, filename);
      
      toast.success(`Excel file downloaded: ${filename}`, {
        description: `${totalScanned} scanned tickets exported successfully`
      });
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("Failed to export to Excel");
    }
  };

  if (!allTickets) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading scanned tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Scanned</p>
              <p className="text-3xl font-bold mt-1">{totalScanned}</p>
              <p className="text-green-100 text-xs mt-1">teams checked in</p>
            </div>
            <Users className="w-12 h-12 text-green-200 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total People</p>
              <p className="text-3xl font-bold mt-1">{totalPeople}</p>
              <p className="text-blue-100 text-xs mt-1">individuals attended</p>
            </div>
            <User className="w-12 h-12 text-blue-200 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm font-medium">Multiple Scans</p>
              <p className="text-3xl font-bold mt-1">{multipleScans}</p>
              <p className="text-amber-100 text-xs mt-1">scanned more than once</p>
            </div>
            <Clock className="w-12 h-12 text-amber-200 opacity-80" />
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by team, leader, room, slot, or scanner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none bg-white"
          >
            <option value="recent">Most Recent</option>
            <option value="name">Team Name</option>
            <option value="counter">Scan Count</option>
          </select>
          <button
            onClick={exportToExcel}
            disabled={scannedTickets.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-2 whitespace-nowrap"
            title="Export to Excel"
          >
            <Download className="w-5 h-5" />
            <span className="hidden sm:inline">Export Excel</span>
            <span className="sm:hidden">Export</span>
          </button>
        </div>
      </div>

      {/* Tickets List */}
      {sortedTickets.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            {searchQuery ? "No matching tickets found" : "No scanned tickets yet"}
          </h3>
          <p className="text-gray-500">
            {searchQuery
              ? "Try adjusting your search query"
              : "Tickets will appear here once they are scanned"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-sm text-gray-600 font-medium">
            Showing {sortedTickets.length} of {totalScanned} scanned tickets
          </div>
          
          <div className="grid gap-4">
            {sortedTickets.map((ticket) => {
              const isMultipleScan = (ticket.checkinCounter || 0) > 1;
              
              return (
                <div
                  key={ticket._id}
                  className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden border-l-4 ${
                    isMultipleScan ? "border-amber-500" : "border-green-500"
                  }`}
                >
                  <div className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      {/* Left: Team Info */}
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${
                            isMultipleScan ? "bg-amber-100" : "bg-green-100"
                          }`}>
                            <Users className={`w-5 h-5 ${
                              isMultipleScan ? "text-amber-600" : "text-green-600"
                            }`} />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900">
                              {ticket.teamName}
                            </h3>
                            <p className="text-sm text-gray-600 mt-0.5">
                              Leader: {ticket.leaderName}
                            </p>
                            <div className="flex flex-wrap items-center gap-3 mt-2">
                              <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                                <User className="w-3 h-3" />
                                {ticket.teamMemberCount} members
                              </span>
                              {ticket.roomNumber && (
                                <span className="inline-flex items-center gap-1 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                                  <MapPin className="w-3 h-3" />
                                  Room {ticket.roomNumber}
                                </span>
                              )}
                              {ticket.slotNumber && (
                                <span className="inline-flex items-center gap-1 text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">
                                  <Clock className="w-3 h-3" />
                                  Slot {ticket.slotNumber}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Scan Info */}
                      <div className="sm:text-right space-y-2">
                        {ticket.checkedInAt && (
                          <div className="text-sm">
                            <div className="flex items-center gap-1 text-gray-500 sm:justify-end">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {new Date(ticket.checkedInAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                            <div className="font-medium text-gray-700 mt-0.5">
                              {new Date(ticket.checkedInAt).toLocaleTimeString("en-US", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        )}
                        
                        {ticket.scannedBy && (
                          <div className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                            <User className="w-3 h-3" />
                            {ticket.scannedBy}
                          </div>
                        )}
                        
                        {isMultipleScan && (
                          <div className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-medium">
                            <Clock className="w-3 h-3" />
                            Scanned {ticket.checkinCounter}x
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Unique ID (collapsed) */}
                    <details className="mt-4 pt-4 border-t border-gray-200">
                      <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700 font-medium">
                        Show Ticket ID
                      </summary>
                      <p className="text-xs font-mono text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                        {ticket.uniqueId}
                      </p>
                    </details>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
