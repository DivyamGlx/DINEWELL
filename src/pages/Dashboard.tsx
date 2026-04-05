import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  Utensils, 
  Star, 
  Clock, 
  TrendingUp, 
  AlertCircle,
  QrCode
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

export const Dashboard: React.FC = () => {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [messRes, feedbackRes] = await Promise.all([
        fetch('/api/mess', { headers }),
        fetch('/api/feedback', { headers })
      ]);
      const messDataRaw = await messRes.json();
      const messData = Array.isArray(messDataRaw) ? messDataRaw : [];
      const feedbackDataRaw = await feedbackRes.json();
      const feedbackData = Array.isArray(feedbackDataRaw) ? feedbackDataRaw : [];
      
      setStats({
        messCount: messData.length,
        feedbackCount: feedbackData.length,
        avgRating: feedbackData.length > 0 
          ? (feedbackData.reduce((acc: any, curr: any) => acc + curr.rating, 0) / feedbackData.length).toFixed(1)
          : 'N/A'
      });
      setFeedback(feedbackData);

      if (user?.role === 'admin') {
        const earningsRes = await fetch('/api/admin/earnings', { headers });
        const earningsDataRaw = await earningsRes.json();
        const earningsData = Array.isArray(earningsDataRaw) ? earningsDataRaw : [];
        setEarnings(earningsData);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const chartData = earnings.length > 0 
    ? earnings.map(e => ({ name: e.name, count: e.total_earned || 0 }))
    : [
        { name: 'Mon', count: 12 },
        { name: 'Tue', count: 19 },
        { name: 'Wed', count: 15 },
        { name: 'Thu', count: 22 },
        { name: 'Fri', count: 30 },
        { name: 'Sat', count: 25 },
        { name: 'Sun', count: 18 },
      ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="relative h-48 rounded-3xl overflow-hidden shadow-lg">
        <img 
          src="https://images.unsplash.com/photo-1769456164543-59aac9d09256" 
          alt="Mess Hall"
          className="absolute inset-0 w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-sage/90 to-transparent flex flex-col justify-center px-12 text-white">
          <h1 className="text-3xl font-heading font-bold mb-2">Welcome back, {user?.name}!</h1>
          <p className="text-white/80 max-w-md">
            Check today's menu and provide your valuable feedback to help us improve the dining experience.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-sage/10 text-sage rounded-xl flex items-center justify-center">
            <Utensils size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Active Messes</p>
            <p className="text-2xl font-bold">{stats?.messCount || 0}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-terracotta/10 text-terracotta rounded-xl flex items-center justify-center">
            <Star size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Avg. Rating</p>
            <p className="text-2xl font-bold">{stats?.avgRating || 0}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-400 font-medium">Feedback Received</p>
            <p className="text-2xl font-bold">{stats?.feedbackCount || 0}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Chart or QR Code */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            {user?.role === 'admin' ? (
              <>
                <Clock size={20} className="text-sage" />
                Today's Mess Earnings (₹)
              </>
            ) : (
              <>
                <QrCode size={20} className="text-sage" />
                Your Mess QR Code
              </>
            )}
          </h3>
          <div className="h-64">
            {user?.role === 'admin' ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                    cursor={{fill: '#f9fafb'}}
                    formatter={(value) => `₹${value}`}
                  />
                  <Bar dataKey="count" fill="#4A7C59" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center space-y-4">
                <div className="p-4 bg-white rounded-2xl border-2 border-dashed border-gray-100 shadow-inner">
                  <img 
                    src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://www.youtube.com/watch?v=dQw4w9WgXcQ" 
                    alt="Mess QR Code"
                    className="w-40 h-40"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-700">Scan for Attendance</p>
                  <p className="text-xs text-gray-400">Present this at the counter for your meal</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Feedback or Mess Earnings List */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          {user?.role === 'admin' ? (
            <>
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <TrendingUp size={20} className="text-sage" />
                Mess Wise Revenue
              </h3>
              <div className="space-y-4">
                {Array.isArray(earnings) && earnings.map((e, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-sage/10 text-sage rounded-full flex items-center justify-center font-bold">
                        {e.name?.[0]}
                      </div>
                      <div>
                        <p className="font-bold text-gray-700">{e.name}</p>
                        <p className="text-xs text-gray-400">{e.transaction_count} Transactions</p>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-sage">₹{e.total_earned || 0}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <AlertCircle size={20} className="text-terracotta" />
                Recent Feedback
              </h3>
              <div className="space-y-4">
                {Array.isArray(feedback) && feedback.slice(0, 4).map((f) => (
                  <div key={f.complaint_id || f.id} className="flex gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-400">
                      {f.user_name?.[0] || 'U'}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-bold">{f.user_name || 'Anonymous'}</p>
                        <div className="flex items-center gap-1 text-terracotta">
                          <Star size={12} fill="currentColor" />
                          <span className="text-xs font-bold">{f.rating}</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mb-1">{f.mess_name}</p>
                      <p className="text-sm text-gray-600 line-clamp-1 italic">"{f.comment}"</p>
                    </div>
                  </div>
                ))}
                {feedback.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    No feedback received yet.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
