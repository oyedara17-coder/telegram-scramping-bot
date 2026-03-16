'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://oyedara17-stepyzoid-backend.hf.space'}/api/admin/logs`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Failed to fetch logs', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Logs</h1>
          <p className="text-gray-500">Monitor automated actions and system health.</p>
        </div>

        <div className="bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl overflow-hidden">
          <div className="p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <span className="text-xs text-gray-400 font-mono tracking-widest uppercase">Live System Logs</span>
          </div>
          <div className="p-6 font-mono text-sm space-y-2 max-h-[600px] overflow-y-auto">
            {loading ? (
               <div className="text-gray-500 italic">Streaming logs...</div>
            ) : logs.length === 0 ? (
              <div className="text-gray-500 italic">No logs available.</div>
            ) : (
              logs.map((log: any) => (
                <div key={log.id} className="flex gap-4 group">
                  <span className="text-gray-600 shrink-0">[{new Date(log.created_at).toLocaleTimeString()}]</span>
                  <span className={log.level === 'ERROR' ? 'text-red-400 font-bold' : 'text-red-300'}>
                    {log.level}
                  </span>
                  <span className="text-gray-300 group-hover:text-white transition-colors">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
