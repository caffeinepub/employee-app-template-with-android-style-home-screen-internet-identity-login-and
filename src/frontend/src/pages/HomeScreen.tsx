import { useNavigate } from '@tanstack/react-router';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile, useSaveCallerUserProfile, useGetAnnouncement, useListCustomModules } from '../hooks/useQueries';
import { useAccessStatus } from '../hooks/useAccessStatus';
import { LogOut, Settings, Bell } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { createImageUrl, revokeImageUrl } from '../utils/customModuleImage';

interface ModuleIcon {
  id: string;
  label: string;
  route: string;
  icon: string;
}

const builtInModules: ModuleIcon[] = [
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

function CustomModuleTile({ 
  module, 
  onClick 
}: { 
  module: { moduleId: string; title: string; image: { bytes: Uint8Array; contentType: string } };
  onClick: () => void;
}) {
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    const url = createImageUrl(module.image);
    setImageUrl(url);
    return () => {
      revokeImageUrl(url);
    };
  }, [module.image]);

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-white/80 backdrop-blur-sm hover:bg-white/95 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
    >
      {imageUrl && (
        <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center">
          <img
            src={imageUrl}
            alt={module.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <span className="text-sm font-medium text-slate-900 text-center line-clamp-2">
        {module.title}
      </span>
    </button>
  );
}

export default function HomeScreen() {
  const navigate = useNavigate();
  const { clear } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { isAdmin } = useAccessStatus();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const saveProfile = useSaveCallerUserProfile();
  const { data: announcement } = useGetAnnouncement();
  const { data: customModules } = useListCustomModules();
  
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

  const handleCustomModuleClick = (moduleId: string) => {
    navigate({ to: `/modules/${moduleId}` });
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
        
        <div className="relative z-10 bg-white/95 backdrop-blur-md rounded-3xl p-8 shadow-2xl max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome!</h2>
          <p className="text-slate-600 mb-6">Please enter your name to continue</p>
          
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              autoFocus
            />
            <button
              type="submit"
              disabled={!name.trim() || saveProfile.isPending}
              className="w-full px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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
      <div className="absolute inset-0 bg-black/20" />
      
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Status Bar */}
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="text-white text-sm font-medium">
            {userProfile?.name || 'User'}
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <button
                onClick={handleAdminClick}
                className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <Settings className="w-5 h-5 text-white" />
              </button>
            )}
            <button
              onClick={handleLogout}
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 flex items-center justify-center transition-colors"
            >
              <LogOut className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Announcement */}
        {announcement && (
          <div className="mx-6 mb-6">
            <div className="bg-emerald-500/90 backdrop-blur-md rounded-2xl p-4 shadow-lg">
              <div className="flex items-start gap-3">
                <Bell className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                <p className="text-white text-sm leading-relaxed">{announcement}</p>
              </div>
            </div>
          </div>
        )}

        {/* App Grid */}
        <div className="flex-1 px-6 pb-8">
          <div className="grid grid-cols-3 gap-6 max-w-2xl mx-auto">
            {/* Built-in modules */}
            {builtInModules.map((module) => (
              <button
                key={module.id}
                onClick={() => handleModuleClick(module.route)}
                className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-white/80 backdrop-blur-sm hover:bg-white/95 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
              >
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center">
                  <img
                    src={module.icon}
                    alt={module.label}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-sm font-medium text-slate-900 text-center line-clamp-2">
                  {module.label}
                </span>
              </button>
            ))}

            {/* Custom modules */}
            {customModules?.map((module) => (
              <CustomModuleTile
                key={module.moduleId}
                module={module}
                onClick={() => handleCustomModuleClick(module.moduleId)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
