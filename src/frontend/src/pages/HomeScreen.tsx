import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useSaveCallerUserProfile, useGetAnnouncement } from '../hooks/useQueries';
import { useAccessStatus } from '../hooks/useAccessStatus';
import { LogOut, Settings, Bell } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

interface ModuleIcon {
  id: string;
  label: string;
  route: string;
  icon: string;
}

const modules: ModuleIcon[] = [
  {
    id: 'friesland',
    label: 'Friesland Fungies',
    route: '/friesland-fungies',
    icon: '/assets/generated/icon-friesland-fungies.dim_512x512.png',
  },
  {
    id: 'landvanons',
    label: 'Land van Ons',
    route: '/land-van-ons',
    icon: '/assets/generated/icon-land-van-ons.dim_512x512.png',
  },
  {
    id: 'pottle',
    label: 'Pottle',
    route: '/pottle',
    icon: '/assets/generated/icon-pottle.dim_512x512.png',
  },
];

export default function HomeScreen() {
  const navigate = useNavigate();
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { isAdmin } = useAccessStatus();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const saveProfile = useSaveCallerUserProfile();
  const { data: announcement } = useGetAnnouncement();
  
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    if (isFetched && userProfile === null && !profileLoading) {
      setShowProfileSetup(true);
    }
  }, [isFetched, userProfile, profileLoading]);

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const handleModuleClick = (route: string) => {
    navigate({ to: route });
  };

  const handleAdminClick = () => {
    navigate({ to: '/admin' });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      await saveProfile.mutateAsync({ name: name.trim() });
      setShowProfileSetup(false);
    }
  };

  // Profile setup modal
  if (showProfileSetup) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center relative overflow-hidden"
        style={{
          backgroundImage: 'url(/assets/generated/employee-wallpaper.dim_1920x1080.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        
        <div className="relative z-10 bg-white/95 backdrop-blur-md rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome!</h2>
          <p className="text-slate-600 mb-6">Please enter your name to get started</p>
          
          <form onSubmit={handleSaveProfile}>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-emerald-500 focus:outline-none mb-4 text-slate-900"
              autoFocus
            />
            
            <button
              type="submit"
              disabled={!name.trim() || saveProfile.isPending}
              className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saveProfile.isPending ? 'Saving...' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundImage: 'url(/assets/generated/employee-wallpaper.dim_1920x1080.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Status bar */}
      <div className="absolute top-0 left-0 right-0 h-8 bg-black/20 backdrop-blur-sm flex items-center justify-between px-4 text-white/90 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-emerald-500" />
          <span>{userProfile?.name || 'Employee'}</span>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={handleAdminClick}
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          )}
          <button
            onClick={handleLogout}
            className="hover:text-white transition-colors flex items-center gap-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="pt-16 pb-8 px-6 flex flex-col items-center justify-center min-h-screen">
        {/* Announcement */}
        {announcement && (
          <div className="mb-8 max-w-2xl w-full">
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-4 shadow-lg flex items-start gap-3">
              <Bell className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <p className="text-slate-800 text-sm leading-relaxed">{announcement}</p>
            </div>
          </div>
        )}

        {/* App grid */}
        <div className="grid grid-cols-3 gap-8 max-w-2xl w-full">
          {modules.map((module) => (
            <button
              key={module.id}
              onClick={() => handleModuleClick(module.route)}
              className="flex flex-col items-center gap-3 group"
            >
              <div className="w-20 h-20 rounded-2xl bg-white/90 backdrop-blur-md shadow-lg flex items-center justify-center transition-all duration-200 group-hover:scale-110 group-hover:shadow-xl group-active:scale-95">
                <img 
                  src={module.icon} 
                  alt={module.label}
                  className="w-14 h-14 object-contain"
                />
              </div>
              <span className="text-white text-sm font-medium text-center drop-shadow-lg">
                {module.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 left-0 right-0 text-center text-white/70 text-xs">
        © 2026. Built with love using <a href="https://caffeine.ai" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">caffeine.ai</a>
      </div>
    </div>
  );
}
