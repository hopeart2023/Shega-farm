
import React, { useState, useEffect } from 'react';
import { UserRole } from './types';
import Navigation from './components/Navigation';
import FarmerDashboard from './components/FarmerDashboard';
import BuyerDashboard from './components/BuyerDashboard';
import ExtensionDashboard from './components/ExtensionDashboard';
import AdminDashboard from './components/AdminDashboard';
import VoiceAssistant from './components/VoiceAssistant';
import { Sprout, UserCircle, Wifi, WifiOff, CloudUpload } from 'lucide-react';
import { SyncService } from './services/syncService';
import { db } from './services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface FarmerProfile {
  name: string;
  region: string;
  trustScore: number;
  creditLimit: number;
  healthStatus: string;
}

const App: React.FC = () => {
  const [role, setRole] = useState<UserRole>(UserRole.FARMER);
  const [activeTab, setActiveTab] = useState(0);
  const [language, setLanguage] = useState<'English' | 'Amharic' | 'Oromo'>('English');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(SyncService.getQueue().length);
  const [profile, setProfile] = useState<FarmerProfile | null>(null);

  // Fetch real user profile from Firestore at the top level
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "profiles", "demo-farmer-1"), (doc) => {
      if (doc.exists()) {
        setProfile(doc.data() as FarmerProfile);
      } else {
        setProfile({
          name: "Abebe G.",
          region: "Oromia",
          trustScore: 840,
          creditLimit: 12000,
          healthStatus: "Excellent"
        });
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    setActiveTab(0);
  }, [role]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      performSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (navigator.onLine) performSync();

    const interval = setInterval(() => {
      setPendingCount(SyncService.getQueue().length);
    }, 2000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const performSync = async () => {
    if (SyncService.hasPending()) {
      setIsSyncing(true);
      await SyncService.processQueue((id, success) => {
        console.log(`Synced ${id}: ${success}`);
      }, language);
      setPendingCount(0);
      setIsSyncing(false);
    }
  };

  const renderContent = () => {
    switch (role) {
      case UserRole.FARMER:
        return <FarmerDashboard activeTab={activeTab} language={language} profile={profile} />;
      case UserRole.BUYER:
        return <BuyerDashboard activeTab={activeTab} language={language} />;
      case UserRole.EXTENSION_WORKER:
        return <ExtensionDashboard activeTab={activeTab} language={language} />;
      case UserRole.ADMIN:
        return <AdminDashboard activeTab={activeTab} language={language} />;
      default:
        return <div className="p-8 text-center text-gray-400">Select a Role</div>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      {isSyncing && (
        <div className="bg-[#FF6F61] text-white text-[10px] font-bold py-1 px-4 flex items-center justify-center gap-2 animate-pulse sticky top-0 z-50">
          <CloudUpload className="w-3 h-3" /> Syncing your offline data...
        </div>
      )}

      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-full p-0.5 border border-gray-200">
            {(['English', 'Amharic', 'Oromo'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`text-[9px] font-bold px-2 py-1 rounded-full transition-all ${
                  language === lang 
                    ? 'bg-white text-[#FF6F61] shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {lang === 'Oromo' ? 'Oromo' : lang === 'Amharic' ? 'Amharic' : 'Eng'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 border-l border-gray-200 pl-3">
            <div className="bg-[#FF6F61] p-1.5 rounded-lg">
              <Sprout className="text-white w-4 h-4" />
            </div>
            <h1 className="text-base font-bold text-[#FF6F61] hidden sm:block">Shega Farm</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {pendingCount > 0 && !isSyncing && (
            <div className="bg-orange-100 text-orange-600 text-[9px] font-bold px-2 py-0.5 rounded-full">
              {pendingCount} Pending
            </div>
          )}
          <div className="flex items-center gap-1 px-2 border-r border-gray-100 mr-1">
            {isOnline ? (
              <Wifi className="w-3 h-3 text-green-500" />
            ) : (
              <WifiOff className="w-3 h-3 text-red-500" />
            )}
          </div>
          <select 
            value={role} 
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="text-[10px] bg-gray-100 border-none rounded-full px-3 py-1.5 font-bold focus:ring-1 focus:ring-[#FF6F61] outline-none cursor-pointer"
          >
            {Object.values(UserRole).map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <button className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400">
            <UserCircle className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="flex-1 pb-24 max-w-2xl mx-auto w-full">
        {renderContent()}
      </main>

      {/* Voice Assistant now receives the profile context */}
      <VoiceAssistant language={language} profile={profile} />
      <Navigation role={role} activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default App;
