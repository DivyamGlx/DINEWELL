import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Hash, MapPin, Shield, Calendar } from 'lucide-react';

export const Portfolio: React.FC = () => {
  const { user, token } = useAuth();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetch(`/api/users/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => setProfile(data));
    }
  }, [user, token]);

  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="h-32 bg-sage/10 relative">
          <div className="absolute -bottom-12 left-12">
            <div className="w-24 h-24 bg-white rounded-2xl shadow-md p-1">
              <div className="w-full h-full bg-terracotta/20 text-terracotta rounded-xl flex items-center justify-center text-3xl font-bold">
                {profile.name?.[0]}
              </div>
            </div>
          </div>
        </div>
        
        <div className="pt-16 pb-12 px-12">
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-3xl font-heading font-bold text-gray-900">{profile.name}</h2>
              <p className="text-sage font-medium uppercase tracking-widest text-xs mt-1">{profile.role}</p>
            </div>
            <div className="bg-gray-50 px-4 py-2 rounded-xl border border-gray-100 flex items-center gap-2">
              <Shield size={16} className="text-sage" />
              <span className="text-sm font-bold text-gray-600">Verified Member</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                  <Mail size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase">Email Address</p>
                  <p className="text-gray-700 font-medium">{profile.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                  <Hash size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase">Roll Number</p>
                  <p className="text-gray-700 font-medium">{profile.roll_number || 'Not Assigned'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase">Academic Year</p>
                  <p className="text-gray-700 font-medium">{profile.year || 'Not Assigned'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase">Member Since</p>
                  <p className="text-gray-700 font-medium">January 2026</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
