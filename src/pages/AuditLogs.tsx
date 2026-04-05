import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Terminal, AlertTriangle } from 'lucide-react';

export const AuditLogs: React.FC = () => {
  const { token } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/audit-logs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setLogs([]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <ShieldAlert className="text-red-500" size={20} />
            System Audit Trail
          </h3>
          <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-500">
            Last 100 entries
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-medium">Timestamp</th>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Action</th>
                <th className="px-6 py-4 font-medium">Table</th>
                <th className="px-6 py-4 font-medium">Details</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {Array.isArray(logs) && logs.map((log) => (
                <tr key={log.log_id || log.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-xs font-mono text-gray-400">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium">{log.email || 'System'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${
                      log.action === 'UNAUTHORIZED_ACCESS' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{log.table_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{log.details}</td>
                  <td className="px-6 py-4">
                    {log.is_authorized ? (
                      <span className="text-green-500 flex items-center gap-1 text-xs font-bold">
                        <Terminal size={14} /> Authorized
                      </span>
                    ) : (
                      <span className="text-red-500 flex items-center gap-1 text-xs font-bold">
                        <AlertTriangle size={14} /> Flagged
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
