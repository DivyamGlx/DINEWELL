import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  Edit2, 
  Save, 
  X, 
  User, 
  Mail, 
  Phone, 
  Calendar,
  Database
} from 'lucide-react';

interface Student {
  student_id: number;
  name: string;
  roll_no: string;
  email: string;
  mobile: string;
  year: string;
}

export const AdminStudents: React.FC = () => {
  const { token } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Student>>({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/admin/bplus-students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setStudents([]);
    }
  };

  const handleEdit = (student: Student) => {
    setEditingId(student.student_id);
    setEditForm(student);
  };

  const handleSave = async () => {
    try {
      const res = await fetch('/api/admin/bplus-students/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        setEditingId(null);
        fetchStudents();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.roll_no.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
            <Database className="text-sage" />
            B+ Tree Student Index
          </h1>
          <p className="text-gray-400 text-sm">Manage student records indexed via B+ Tree structure</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by name or roll no..." 
            className="pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage/20 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredStudents.map(student => (
          <div key={`${student.student_id}-${student.roll_no}`} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
            {editingId === student.student_id ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase">Name</label>
                    <input 
                      type="text" 
                      className="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg focus:outline-none"
                      value={editForm.name}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase">Roll No</label>
                    <input 
                      type="text" 
                      className="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg focus:outline-none"
                      value={editForm.roll_no}
                      onChange={(e) => setEditForm({...editForm, roll_no: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase">Email</label>
                    <input 
                      type="email" 
                      className="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg focus:outline-none"
                      value={editForm.email}
                      onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase">Mobile</label>
                    <input 
                      type="text" 
                      className="w-full p-2 bg-gray-50 border border-gray-100 rounded-lg focus:outline-none"
                      value={editForm.mobile}
                      onChange={(e) => setEditForm({...editForm, mobile: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button 
                    onClick={() => setEditingId(null)}
                    className="px-4 py-2 text-gray-400 hover:text-gray-600 font-bold text-sm flex items-center gap-2"
                  >
                    <X size={16} /> Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    className="px-6 py-2 bg-sage text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-sage/20"
                  >
                    <Save size={16} /> Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-sage/10 text-sage rounded-xl flex items-center justify-center font-bold text-lg">
                    {student.name?.[0]}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-gray-800">{student.name}</h3>
                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <User size={14} /> {student.roll_no}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Mail size={14} /> {student.email}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Phone size={14} /> {student.mobile}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <Calendar size={14} /> Year {student.year}
                      </div>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleEdit(student)}
                  className="p-2 text-gray-300 hover:text-sage transition-colors"
                >
                  <Edit2 size={18} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
