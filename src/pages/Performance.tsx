import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Zap, Activity, Database, CheckCircle2, XCircle } from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { toast } from 'sonner';

export const Performance: React.FC = () => {
  const { token } = useAuth();
  const [isOptimized, setIsOptimized] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const testPerformance = async () => {
    setLoading(true);
    const results = [];
    for (let i = 0; i < 5; i++) {
      const res = await fetch('/api/feedback', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const time = parseFloat(res.headers.get('X-Query-Time') || '0');
      results.push(time);
      await new Promise(r => setTimeout(r, 100));
    }
    const avg = results.reduce((a, b) => a + b, 0) / results.length;
    
    setHistory(prev => [...prev, {
      time: new Date().toLocaleTimeString(),
      latency: avg,
      optimized: isOptimized
    }]);
    setLoading(false);
  };

  const toggleOptimization = async () => {
    const res = await fetch('/api/benchmark/optimize', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ enabled: !isOptimized })
    });
    if (res.ok) {
      setIsOptimized(!isOptimized);
      toast.success(isOptimized ? 'Indexes removed' : 'SQL Indexes applied successfully!');
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Controls */}
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Database className="text-sage" size={24} />
            Indexing Strategy
          </h3>
          <p className="text-gray-500 mb-8">
            Apply B+ Tree indexes to the <code className="bg-gray-100 px-1 rounded">user_id</code> and <code className="bg-gray-100 px-1 rounded">mess_id</code> columns of the feedback table to optimize JOIN operations.
          </p>
          
          <div className="space-y-4">
            <button
              onClick={toggleOptimization}
              className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all ${
                isOptimized 
                  ? 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100' 
                  : 'bg-sage text-white shadow-lg shadow-sage/20 hover:bg-sage-dark'
              }`}
            >
              {isOptimized ? <XCircle size={20} /> : <CheckCircle2 size={20} />}
              {isOptimized ? 'Remove SQL Indexes' : 'Apply SQL Indexes'}
            </button>

            <button
              onClick={testPerformance}
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold border border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-3 transition-all disabled:opacity-50"
            >
              <Activity size={20} className={loading ? 'animate-pulse' : ''} />
              Run Benchmark (5 Samples)
            </button>
          </div>
        </div>

        {/* Real-time Stats */}
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${
            isOptimized ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
          }`}>
            <Zap size={40} className={isOptimized ? 'animate-pulse' : ''} />
          </div>
          <h4 className="text-2xl font-bold mb-2">
            {isOptimized ? 'Optimized Mode' : 'Standard Mode'}
          </h4>
          <p className="text-gray-400 max-w-xs">
            {isOptimized 
              ? 'Database is using Index Seek for retrieval. Expect lower latency.' 
              : 'Database is performing Full Table Scans. Latency may increase with data size.'}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="text-xl font-bold mb-8">Latency Comparison (ms)</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} label={{ value: 'ms', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }} />
              <Tooltip 
                contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
              />
              <Legend verticalAlign="top" height={36}/>
              <Line 
                type="monotone" 
                dataKey="latency" 
                stroke="#4A7C59" 
                strokeWidth={3} 
                dot={{ r: 6, fill: '#4A7C59', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 8 }}
                name="Query Time"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {history.length === 0 && (
          <div className="text-center py-12 text-gray-400 italic">
            Run benchmarks to see performance data.
          </div>
        )}
      </div>
    </div>
  );
};
