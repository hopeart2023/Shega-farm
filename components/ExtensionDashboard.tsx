
import React, { useState, useEffect } from 'react';
// Added missing 'Send' icon to the lucide-react imports
import { MessageSquare, CheckCircle, FileText, Share2, HelpCircle, UserCheck, RefreshCw, Clock, MapPin, Send } from 'lucide-react';
import { db } from '../services/firebase';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';

interface ExtensionDashboardProps {
  activeTab: number;
  language: string;
}

const ExtensionDashboard: React.FC<ExtensionDashboardProps> = ({ activeTab, language }) => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeTab === 0) {
      const q = query(collection(db, "forum_questions"), orderBy("timestamp", "desc"), limit(20));
      const unsub = onSnapshot(q, (snapshot) => {
        setQuestions(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoading(false);
      });
      return () => unsub();
    }
  }, [activeTab]);

  if (activeTab === 0) {
    return (
      <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-purple-500" />
          Farmer Inquiries ({language})
        </h2>
        <div className="bg-purple-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <HelpCircle size={80} />
          </div>
          <h3 className="text-lg font-bold mb-1">Response Portal</h3>
          <p className="text-white/80 text-xs">There are {questions.length} active inquiries requiring technical guidance.</p>
          <button className="mt-4 bg-white text-purple-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-50 transition-colors">Start Responding</button>
        </div>
        
        {loading ? (
          <div className="py-12 flex flex-col items-center gap-3 text-gray-300">
            <RefreshCw className="w-6 h-6 animate-spin" />
            <p className="text-[10px] font-black uppercase">Fetching Queue...</p>
          </div>
        ) : questions.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center">
            <p className="text-sm text-gray-400 font-medium italic">All farmer inquiries have been answered.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map(q => (
              <div key={q.id} className="bg-white p-4 rounded-2xl border border-gray-100 space-y-3 shadow-sm hover:border-purple-200 transition-colors cursor-pointer group">
                <p className="text-sm font-bold text-gray-800 line-clamp-2">"{q.text}"</p>
                <div className="flex items-center justify-between text-[9px] font-bold text-gray-400 uppercase">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {q.region || 'Unknown'}</span>
                  <span className="flex items-center gap-1 group-hover:text-purple-600 transition-colors">
                    <Clock className="w-3 h-3" /> {q.timestamp?.toDate() ? q.timestamp.toDate().toLocaleTimeString() : 'Just now'}
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-50 flex items-center justify-between">
                  <span className="text-[9px] font-black text-gray-500">FARMER: {q.farmer || 'Anonymous'}</span>
                  <button className="bg-purple-50 text-purple-600 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-purple-100">Draft Reply</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 1) {
    return (
      <div className="p-4 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-green-500" />
          Field Verifications
        </h2>
        <div className="bg-white p-10 rounded-2xl border border-gray-100 text-center space-y-4">
          <div className="p-4 bg-green-50 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
            <CheckCircle className="text-green-500 w-8 h-8" />
          </div>
          <p className="text-sm font-bold text-gray-400">No pending field visits scheduled for your region today.</p>
          <button className="text-[10px] font-black text-green-600 uppercase border border-green-200 px-4 py-2 rounded-xl">Refresh Schedule</button>
        </div>
      </div>
    );
  }

  if (activeTab === 2) {
    return (
      <div className="p-4 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-[#FF6F61]" />
          Regional Advice
        </h2>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 space-y-4 shadow-sm">
           <div className="flex items-center gap-3">
             <div className="p-3 bg-orange-50 rounded-xl">
               <FileText className="w-5 h-5 text-[#FF6F61]" />
             </div>
             <div>
               <p className="text-xs font-bold text-gray-800">Weekly Advisory ({language})</p>
               <p className="text-[10px] text-gray-400">Broadcast to all farmers in your assigned zone.</p>
             </div>
           </div>
           <textarea 
             placeholder="Enter crop-specific warnings or advice..."
             className="w-full bg-gray-50 rounded-xl p-4 text-xs min-h-[150px] outline-none border border-transparent focus:border-orange-100"
           />
           <button className="w-full py-4 bg-[#FF6F61] text-white rounded-xl text-xs font-black shadow-md hover:bg-[#FF8B7F] transition-all flex items-center justify-center gap-2 uppercase tracking-widest">
             {/* Fix: Send icon is now correctly imported and referenced */}
             <Send className="w-4 h-4" /> Create New Broadcast
           </button>
        </div>
      </div>
    );
  }

  return null;
};

export default ExtensionDashboard;
