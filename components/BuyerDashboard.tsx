
import React, { useState, useEffect } from 'react';
import { ShoppingCart, MapPin, Package, DollarSign, ClipboardList, Truck, Search, RefreshCw } from 'lucide-react';
import { db } from '../services/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

interface BuyerDashboardProps {
  activeTab: number;
  language: string;
}

const BuyerDashboard: React.FC<BuyerDashboardProps> = ({ activeTab, language }) => {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeTab === 0) {
      const q = query(collection(db, "market_listings"), orderBy("timestamp", "desc"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setListings(data);
        setLoading(false);
      }, (error) => {
        console.error("Firestore error:", error);
        setLoading(false);
      });
      return () => unsubscribe();
    }
  }, [activeTab]);

  if (activeTab === 0) {
    return (
      <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Available Harvests</h2>
          <div className="bg-orange-100 text-[#FF6F61] px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1">
            <ShoppingCart className="w-3 h-3" /> LIVE SYNC
          </div>
        </div>

        <div className="relative">
          <input type="text" placeholder={`Search in ${language}...`} className="w-full bg-white border border-gray-100 rounded-xl py-3 pl-10 pr-4 text-xs shadow-sm focus:ring-1 focus:ring-[#FF6F61] outline-none" />
          <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-300">
            <RefreshCw className="w-8 h-8 animate-spin" />
            <p className="text-xs font-bold uppercase">Updating Marketplace...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center">
            <p className="text-sm text-gray-400 font-medium">No listings found in your region.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {listings.map(item => (
              <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-4 hover:border-[#FF6F61] transition-colors cursor-pointer group">
                <div className="bg-gray-50 w-20 h-20 rounded-2xl flex flex-col items-center justify-center border border-gray-100 group-hover:bg-orange-50 transition-colors">
                  <Package className="text-gray-300 w-8 h-8 group-hover:text-orange-300" />
                  <span className="text-[8px] font-bold text-gray-400 mt-1 uppercase">Stock</span>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-gray-900 text-base">{item.crop}</h4>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide">Farmer: {item.farmer}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-[#FF6F61]">{item.price}</span>
                      <p className="text-[10px] text-gray-400">{item.qty}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex items-center gap-1 text-[10px] text-gray-500 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-gray-300" /> {item.location || 'Remote'}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-green-500 font-bold">
                      <DollarSign className="w-3.5 h-3.5" /> Escrow Protected
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Other tabs remain similar with mock states for logistics
  return (
    <div className="p-4 text-center py-20 text-gray-400">
      Feature coming soon to backend.
    </div>
  );
};

export default BuyerDashboard;
