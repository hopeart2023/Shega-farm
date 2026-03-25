
import React from 'react';
import { UserRole } from '../types';
import { 
  Home, Search, ShoppingBag, MessageSquare, 
  ShieldCheck, Activity, Send, ShoppingCart, 
  Truck, ClipboardList, UserCheck, HelpCircle 
} from 'lucide-react';

interface NavigationProps {
  role: UserRole;
  activeTab: number;
  onTabChange: (index: number) => void;
}

const Navigation: React.FC<NavigationProps> = ({ role, activeTab, onTabChange }) => {
  const getTabs = () => {
    switch (role) {
      case UserRole.FARMER:
        return [
          { icon: Home, label: 'Home' },
          { icon: Search, label: 'Diagnosis' },
          { icon: ShoppingBag, label: 'Market' },
          { icon: MessageSquare, label: 'Forum' },
        ];
      case UserRole.BUYER:
        return [
          { icon: ShoppingCart, label: 'Market' },
          { icon: ClipboardList, label: 'Bids' },
          { icon: Truck, label: 'Logistics' },
        ];
      case UserRole.EXTENSION_WORKER:
        return [
          { icon: HelpCircle, label: 'Questions' },
          { icon: UserCheck, label: 'Verify' },
          { icon: MessageSquare, label: 'Advice' },
        ];
      case UserRole.ADMIN:
        return [
          { icon: Activity, label: 'Analytics' },
          { icon: ShieldCheck, label: 'Verify' },
          { icon: ShoppingBag, label: 'Oversight' },
          { icon: Send, label: 'Broadcast' },
        ];
      default:
        return [];
    }
  };

  const tabs = getTabs();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-2 flex justify-around items-center shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-50">
      {tabs.map((tab, idx) => {
        const isActive = activeTab === idx;
        return (
          <button 
            key={idx} 
            onClick={() => onTabChange(idx)}
            className="flex flex-col items-center gap-1 min-w-[64px] transition-all duration-200"
          >
            <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-orange-100 text-[#FF6F61] scale-110' : 'text-gray-400'}`}>
              <tab.icon className="w-6 h-6" />
            </div>
            <span className={`text-[10px] font-bold tracking-tight ${isActive ? 'text-[#FF6F61]' : 'text-gray-500'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default Navigation;
