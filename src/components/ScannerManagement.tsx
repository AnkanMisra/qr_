import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import type { Id } from "../../convex/_generated/dataModel";

export default function ScannerManagement() {
  const [scannerName, setScannerName] = useState("");
  const [scannerPassword, setScannerPassword] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const scanners = useQuery(api.scanners.getAllScanners) || [];
  const createScanner = useMutation(api.scanners.createScanner);
  const deactivateScanner = useMutation(api.scanners.deactivateScanner);
  const activateScanner = useMutation(api.scanners.activateScanner);
  const deleteScanner = useMutation(api.scanners.deleteScanner);

  const handleCreateScanner = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!scannerName.trim() || !scannerPassword.trim()) {
      toast.error("Please fill all fields");
      return;
    }

    setIsCreating(true);

    try {
      await createScanner({
        scannerName: scannerName.trim(),
        scannerPassword,
        adminName: "Admin",
      });

      toast.success(`Scanner "${scannerName}" created successfully`);
      setScannerName("");
      setScannerPassword("");
      setShowCreateForm(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to create scanner");
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleActive = async (scannerId: Id<"scanners">, isActive: boolean) => {
    try {
      if (isActive) {
        await deactivateScanner({ scannerId });
        toast.success("Scanner deactivated");
      } else {
        await activateScanner({ scannerId });
        toast.success("Scanner activated");
      }
    } catch (_error) {
      toast.error("Failed to update scanner status");
    }
  };

  const handleDeleteScanner = async (
    scannerId: Id<"scanners">,
    scannerName: string | undefined,
  ) => {
    const name = scannerName || "this scanner";
    if (
      !window.confirm(
        `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      await deleteScanner({ scannerId });
      toast.success(`Scanner "${name}" deleted`);
    } catch (error) {
      toast.error("Failed to delete scanner");
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Scanners</h2>
            <p className="text-sm text-gray-500">Manage volunteer access for the scanning app.</p>
          </div>
          <button
            onClick={() => setShowCreateForm((prev) => !prev)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            {showCreateForm ? "Cancel" : "Create scanner"}
          </button>
        </div>

        {showCreateForm && (
          <div className="bg-white border rounded-lg p-6 mb-8">
            <h3 className="text-lg font-medium text-gray-900">New scanner</h3>
            <p className="text-sm text-gray-500 mb-4">
              Share the generated credentials with the volunteer responsible for scanning.
            </p>
            <form onSubmit={handleCreateScanner} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scanner name
                </label>
                <input
                  type="text"
                  value={scannerName}
                  onChange={(e) => setScannerName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Gate A"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={scannerPassword}
                  onChange={(e) => setScannerPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Minimum 6 characters"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isCreating}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
              >
                {isCreating ? "Creating..." : "Create scanner"}
              </button>
            </form>
          </div>
        )}

        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h3 className="text-lg font-medium text-gray-900">
              Active scanners ({scanners.filter((s) => s.isActive).length})
            </h3>
            <span className="text-xs text-gray-500">Total: {scanners.length}</span>
          </div>

          {scanners.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              No scanners created yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wide">
                      Scanner name
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wide">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wide">
                      Last login
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {scanners.map((scanner) => (
                    <tr key={scanner._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {scanner.scannerName || "Unnamed"}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium ${
                            scanner.isActive
                              ? "bg-green-50 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          <span
                            className={`block w-2 h-2 rounded-full ${
                              scanner.isActive ? "bg-green-500" : "bg-gray-400"
                            }`}
                          ></span>
                          {scanner.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {formatDate(scanner.createdAt)}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {scanner.lastLoginAt ? (
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {formatDate(scanner.lastLoginAt)}
                          </div>
                        ) : (
                          <span className="text-gray-400">Never</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() =>
                              handleToggleActive(scanner._id, scanner.isActive)
                            }
                            className="text-blue-600 hover:text-blue-800"
                            title={scanner.isActive ? "Deactivate" : "Activate"}
                          >
                            {scanner.isActive ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </button>

                          <button
                            onClick={() =>
                              handleDeleteScanner(scanner._id, scanner.scannerName)
                            }
                            className="text-red-600 hover:text-red-800"
                            title="Delete scanner"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
