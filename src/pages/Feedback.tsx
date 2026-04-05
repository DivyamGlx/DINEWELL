import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Star, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const Feedback: React.FC = () => {
  const { token, user } = useAuth();
  const [messes, setMesses] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [messId, setMessId] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [mRes, fRes] = await Promise.all([
        fetch('/api/mess', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/feedback', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const mData = await mRes.json();
      const fData = await fRes.json();
      setMesses(Array.isArray(mData) ? mData : []);
      setFeedback(Array.isArray(fData) ? fData : []);
    } catch (err) {
      console.error(err);
      setMesses([]);
      setFeedback([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messId) return toast.error('Please select a mess');
    setSubmitting(true);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ mess_id: parseInt(messId), rating, comment }),
      });
      if (res.ok) {
        toast.success('Feedback submitted successfully!');
        setComment('');
        fetchData();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Form */}
      <div className="lg:col-span-1">
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <MessageSquare className="text-sage" size={24} />
            Share Your Experience
          </h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Mess</label>
              <select 
                value={messId}
                onChange={(e) => setMessId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-sage outline-none"
              >
                <option value="">Choose a mess...</option>
                {Array.isArray(messes) && messes.map(m => <option key={m.mess_id || m.id} value={m.mess_id || m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                      rating >= s ? 'bg-terracotta text-white' : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <Star size={20} fill={rating >= s ? 'currentColor' : 'none'} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Comments</label>
              <textarea
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="How was the food today?"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-sage outline-none resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-sage text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-sage/20 hover:bg-sage-dark transition-all disabled:opacity-70"
            >
              {submitting ? <Loader2 className="animate-spin" /> : <><Send size={20} /> Submit Feedback</>}
            </button>
          </form>
        </div>
      </div>

      {/* History */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-bold">Feedback History</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {Array.isArray(feedback) && feedback.map((f) => (
              <div key={f.complaint_id || f.id} className="p-6 hover:bg-gray-50/50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-gray-800">{f.mess_name}</p>
                    <p className="text-xs text-gray-400">{new Date(f.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-1 text-terracotta">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={14} fill={i < f.rating ? 'currentColor' : 'none'} />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-600 italic">"{f.comment}"</p>
                {user?.role === 'admin' && (
                  <p className="text-xs text-sage mt-2 font-medium">By: {f.user_name}</p>
                )}
              </div>
            ))}
            {feedback.length === 0 && (
              <div className="p-12 text-center text-gray-400 italic">
                No feedback history found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
