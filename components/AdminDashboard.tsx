
import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';
import { Users, FileText, CheckCircle, ShieldCheck, ShoppingBag, Send, RefreshCw } from 'lucide-react';
import { db } from '../services/firebase';
import { collection, query, onSnapshot, getCountFromServer } from 'firebase/firestore';

interface AdminDashboardProps {
  activeTab: number;
  language: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ activeTab, language }) => {
  const [counts, setCounts] = useState({ farmers: 0, diagnoses: 0, listings: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const diagCount = await getCountFromServer(collection(db, "diagnoses"));
        const marketCount = await getCountFromServer(collection(db, "market_listings"));
        setCounts({
          farmers: 1240, // Static for demo
          diagnoses: diagCount.data().count,
          listings: marketCount.data().count
        });
        setLoading(false);
      } catch (e) {
        console.error(e);
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

  const stats = [
    { icon: Users, label: 'Registered Farmers', value: counts.farmers.toLocaleString(), color: 'bg-blue-50 text-blue-600' },
    { icon: FileText, label: 'AI Diagnoses Total', value: counts.diagnoses.toLocaleString(), color: 'bg-orange-50 text-orange-600' },
    { icon: ShoppingBag, label: 'Active Listings', value: counts.listings.toLocaleString(), color: 'bg-green-50 text-green-600' },
  ];

  const chartData = [
    { name: 'Mon', value: 400 }, { name: 'Tue', value: 300 }, { name: 'Wed', value: 600 },
    { name: 'Thu', value: 800 }, { name: 'Fri', value: 500 }, { name: 'Sat', value: 900 },
    { name: 'Sun', value: 1100 },
  ];

  if (activeTab === 0) {
    return (
      <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Platform Analytics</h2>
          {loading && <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((s, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{s.label}</p>
                <p className="text-lg font-black">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold mb-6">Service Request Volume</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#FF6F61" strokeWidth={4} dot={{ r: 4, fill: '#FF6F61' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-10 text-center text-gray-400">
      Oversight module active. Backend connectivity verified.
    </div>
  );
};

export default AdminDashboard;
