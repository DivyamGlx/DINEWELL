import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Utensils, MapPin, Users, Star, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const MessDetails: React.FC = () => {
  const { token, user } = useAuth();
  const [messes, setMesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMesses();
  }, []);

  const fetchMesses = async () => {
    try {
      const res = await fetch('/api/mess', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setMesses(data);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-sage" size={40} /></div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold">Available Dining Halls</h3>
          <p className="text-gray-500">View mess locations and capacities</p>
        </div>
        {user?.role === 'admin' && (
          <button className="bg-sage text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-sage/20">
            <Plus size={20} /> Add Mess
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {messes.map((mess) => (
          <div key={mess.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-32 bg-sage/5 flex items-center justify-center text-sage">
              <Utensils size={48} />
            </div>
            <div className="p-6">
              <h4 className="text-xl font-bold mb-4">{mess.name}</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-500 text-sm">
                  <MapPin size={16} />
                  <span>{mess.location}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-500 text-sm">
                  <Users size={16} />
                  <span>Capacity: {mess.capacity} students</span>
                </div>
              </div>
              <button className="w-full mt-6 py-3 rounded-xl border border-sage text-sage font-bold hover:bg-sage hover:text-white transition-colors">
                View Menu
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
