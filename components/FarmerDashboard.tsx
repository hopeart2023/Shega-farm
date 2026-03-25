
import React, { useState, useEffect } from 'react';
import { 
  Camera, CloudRain, TrendingUp, AlertTriangle, 
  ShieldCheck, CreditCard, MessageCircle, 
  Send, Package, RefreshCw, Trash2, Sprout
} from 'lucide-react';
import { diagnoseCrop, getMarketInsights } from '../services/geminiService';
import { SyncService } from '../services/syncService';
import { db } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface FarmerDashboardProps {
  activeTab: number;
  language: string;
  profile: {
    name: string;
    region: string;
    trustScore: number;
    creditLimit: number;
    healthStatus: string;
  } | null;
}

const FarmerDashboard: React.FC<FarmerDashboardProps> = ({ activeTab, language, profile }) => {
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosisResult, setDiagnosisResult] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [marketInsights, setMarketInsights] = useState<{ text: string; sources: any[] } | null>(null);
  const [loadingMarket, setLoadingMarket] = useState(false);
  const [offlineQueued, setOfflineQueued] = useState(false);
  const [postSuccess, setPostSuccess] = useState(false);
  const [forumQuestion, setForumQuestion] = useState('');

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setPreviewImage(base64);
      setOfflineQueued(false);
      setDiagnosisResult(null);

      const payload = { 
        image: base64, 
        cropType: 'Teff', 
        farmerName: profile?.name || 'Anonymous', 
        region: profile?.region || 'Ethiopia' 
      };

      if (!navigator.onLine) {
        SyncService.enqueue({ type: 'DIAGNOSIS', payload });
        setOfflineQueued(true);
        return;
      }

      setIsDiagnosing(true);
      try {
        const result = await diagnoseCrop(base64, 'Teff', language);
        setDiagnosisResult(result);
        
        await addDoc(collection(db, "diagnoses"), {
          ...payload,
          result,
          timestamp: serverTimestamp(),
          language
        });
      } catch (err) {
        SyncService.enqueue({ type: 'DIAGNOSIS', payload });
        setDiagnosisResult("An error occurred. Your photo is queued for sync.");
        setOfflineQueued(true);
      } finally {
        setIsDiagnosing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const clearDiagnosis = () => {
    setPreviewImage(null);
    setDiagnosisResult(null);
    setOfflineQueued(false);
  };

  const handlePostListing = async () => {
    const listing = {
      farmer: profile?.name || 'Abebe G.',
      crop: 'Coffee Arabica',
      qty: '500kg',
      price: '450 ETB/kg',
      location: profile?.region || 'Jimma',
      timestamp: serverTimestamp()
    };

    try {
      if (!navigator.onLine) {
        SyncService.enqueue({ type: 'MARKET_LISTING', payload: listing });
      } else {
        await addDoc(collection(db, "market_listings"), listing);
      }
      setPostSuccess(true);
      setTimeout(() => setPostSuccess(false), 3000);
    } catch (e) {
      SyncService.enqueue({ type: 'MARKET_LISTING', payload: listing });
      setPostSuccess(true);
    }
  };

  const handleForumSubmit = async () => {
    if (!forumQuestion.trim()) return;
    
    const question = {
      farmer: profile?.name || 'Anonymous Farmer',
      region: profile?.region || 'Unknown',
      text: forumQuestion,
      language,
      timestamp: serverTimestamp()
    };

    try {
      if (!navigator.onLine) {
        SyncService.enqueue({ type: 'FORUM_QUESTION', payload: question });
        alert("Queued offline!");
      } else {
        await addDoc(collection(db, "forum_questions"), question);
      }
      setForumQuestion('');
    } catch (e) {
      SyncService.enqueue({ type: 'FORUM_QUESTION', payload: question });
      setForumQuestion('');
    }
  };

  useEffect(() => {
    if (activeTab === 2 && navigator.onLine) {
      setLoadingMarket(true);
      getMarketInsights('Coffee', profile?.region || 'Oromia', language)
        .then(setMarketInsights)
        .finally(() => setLoadingMarket(false));
    }
  }, [activeTab, language, profile?.region]);

  if (!profile && activeTab === 0) {
    return (
      <div className="p-12 text-center space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-300" />
        <p className="text-xs font-bold uppercase text-gray-400">Loading Shega Profile...</p>
      </div>
    );
  }

  if (activeTab === 0) {
    return (
      <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="bg-gradient-to-br from-[#FF6F61] to-[#FFB6C1] rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Sprout size={120} />
          </div>
          <h2 className="text-2xl font-bold mb-1">Welcome, {profile?.name}!</h2>
          <p className="text-white/80 text-sm">Region: {profile?.region} | Health Status: {profile?.healthStatus}</p>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="bg-white/20 rounded-xl p-3 backdrop-blur-md border border-white/20">
              <p className="text-[10px] uppercase font-bold opacity-70">Trust Score</p>
              <p className="text-xl font-black tracking-tight">{profile?.trustScore}</p>
            </div>
            <div className="bg-white/20 rounded-xl p-3 backdrop-blur-md border border-white/20">
              <p className="text-[10px] uppercase font-bold opacity-70">Credit Limit</p>
              <p className="text-xl font-black tracking-tight">{profile?.creditLimit?.toLocaleString()} ETB</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col gap-2 shadow-sm cursor-pointer hover:bg-blue-100 transition-colors">
            <CloudRain className="text-blue-500 w-6 h-6" />
            <div>
              <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wide">Weather</p>
              <p className="text-sm font-bold font-mono tracking-tight">Rain in 2 Days</p>
            </div>
          </div>
          <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex flex-col gap-2 shadow-sm cursor-pointer hover:bg-red-100 transition-colors">
            <AlertTriangle className="text-red-500 w-6 h-6" />
            <div>
              <p className="text-[10px] text-red-600 font-bold uppercase tracking-wide">Alerts</p>
              <p className="text-sm font-bold font-mono tracking-tight">Locust Warning</p>
            </div>
          </div>
        </div>

        <section className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <CreditCard className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold">Agricultural Credit</h3>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-800">CBE Micro-Loan Status</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></span>
                <p className="text-xs text-gray-400 font-medium">Under Review - 2 days remaining</p>
              </div>
            </div>
            <button className="bg-purple-100 text-purple-600 p-2 rounded-lg hover:bg-purple-200 transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </section>
      </div>
    );
  }

  if (activeTab === 1) {
    return (
      <div className="p-4 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Camera className="w-5 h-5 text-[#FF6F61]" />
              Crop Analysis
            </h3>
            <p className="text-xs text-gray-500">Professional AI pest & disease detection.</p>
          </div>
          {(previewImage || diagnosisResult) && (
            <button onClick={clearDiagnosis} className="p-2 text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1 text-[10px] font-bold uppercase">
              <Trash2 className="w-4 h-4" /> Reset
            </button>
          )}
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden flex flex-col min-h-[450px]">
          {previewImage ? (
            <div className="flex-1 flex flex-col">
              <div className="relative h-56 bg-black overflow-hidden group">
                <img src={previewImage} alt="Crop preview" className={`w-full h-full object-cover transition-all duration-700 ${isDiagnosing ? 'opacity-40 scale-105 grayscale' : 'opacity-100 scale-100'}`} />
                {isDiagnosing && (
                  <div className="absolute inset-0 z-10">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#FF6F61] to-transparent animate-scan shadow-[0_0_20px_#FF6F61]"></div>
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                      <RefreshCw className="w-10 h-10 text-white animate-spin relative z-10" />
                      <p className="text-xs font-black text-white uppercase tracking-[0.2em] drop-shadow-lg">Shega AI Scanning...</p>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-3 left-3 flex gap-2">
                  {offlineQueued && <span className="bg-orange-600 text-white text-[9px] font-black px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-xl">OFFLINE QUEUED</span>}
                  {diagnosisResult && !isDiagnosing && <span className="bg-green-600 text-white text-[9px] font-black px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-xl">VERIFIED</span>}
                </div>
              </div>
              <div className="p-6 flex-1 overflow-y-auto">
                {diagnosisResult ? (
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-2xl border border-gray-100 p-5">
                      <p className="text-sm text-gray-700 whitespace-pre-line font-medium leading-relaxed">{diagnosisResult}</p>
                    </div>
                    <button onClick={clearDiagnosis} className="w-full py-4 bg-gray-900 text-white rounded-2xl text-sm font-black flex items-center justify-center gap-3">
                      <RefreshCw className="w-5 h-5" /> RE-START ANALYSIS
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 gap-3 text-gray-300">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                    <p className="text-[10px] font-bold uppercase">Awaiting AI Core...</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <label className="flex-1 flex flex-col items-center justify-center border-4 border-dashed border-gray-50 rounded-3xl m-6 p-12 cursor-pointer hover:border-[#FF6F61] hover:bg-orange-50 transition-all active:scale-[0.98]">
              <Camera className="w-12 h-12 text-gray-200" />
              <h4 className="text-sm font-black text-gray-900 uppercase mt-4">Capture Crop Health</h4>
              <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase">High-res Photo Required</p>
              <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoUpload} />
            </label>
          )}
        </div>
      </div>
    );
  }

  if (activeTab === 2) {
    return (
      <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-500" />
          Market Transparency
        </h3>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-6 relative overflow-hidden">
          {postSuccess && (
            <div className="absolute inset-0 bg-green-500/95 flex items-center justify-center z-20 text-white font-black text-sm uppercase tracking-widest">
              <ShieldCheck className="mr-2" /> Listing Recorded!
            </div>
          )}
          <div className="flex justify-between items-end border-b border-gray-50 pb-6">
            <div>
              <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Current Focus</p>
              <p className="text-xl font-black text-gray-800">Coffee Arabica (Grade 1)</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black text-green-600">450 <span className="text-[10px] font-bold text-gray-400">ETB/kg</span></p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-2xl p-5 min-h-[100px] flex items-center justify-center">
             {loadingMarket ? (
               <RefreshCw className="w-5 h-5 animate-spin text-gray-300" />
             ) : (
               <p className="text-xs text-gray-700 italic leading-relaxed">{marketInsights?.text || "Connect to view trends."}</p>
             )}
          </div>
          <button onClick={handlePostListing} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 active:scale-95 transition-all">
            <Package className="w-5 h-5 text-[#FF6F61]" /> POST HARVEST FOR SALE
          </button>
        </div>
      </div>
    );
  }

  if (activeTab === 3) {
    return (
      <div className="p-4 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-blue-500" />
          Farmer Knowledge Network
        </h3>
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
          <textarea 
            value={forumQuestion}
            onChange={(e) => setForumQuestion(e.target.value)}
            placeholder={`Ask in ${language}...`} 
            className="w-full bg-gray-50 rounded-2xl p-4 text-xs outline-none min-h-[120px] focus:ring-1 focus:ring-blue-100 transition-all" 
          />
          <button onClick={handleForumSubmit} className="w-full py-4 bg-[#FF6F61] text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-lg hover:bg-[#FF8B7F] transition-colors">
            <Send className="w-4 h-4" /> BROADCAST QUESTION
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default FarmerDashboard;
