import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useRequestApproval, useGetCallerUserProfile, useSaveCallerUserProfile } from '../hooks/useQueries';
import { Clock, LogOut } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

export default function AccessPendingScreen() {
  const { clear } = useInternetIdentity();
  const requestApproval = useRequestApproval();
  const queryClient = useQueryClient();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const saveProfile = useSaveCallerUserProfile();
  
  const [name, setName] = useState('');
  const [hasRequestedApproval, setHasRequestedApproval] = useState(false);
  const [generatedId, setGeneratedId] = useState('');

  // Generate a simple 4-character ID (client-side for now)
  const generateId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  useEffect(() => {
    // If user already has a profile, they've likely already requested approval
    if (userProfile && userProfile.name) {
      setHasRequestedApproval(true);
      setName(userProfile.name);
      // Generate consistent ID based on name (simple hash)
      const id = generateId();
      setGeneratedId(id);
    }
  }, [userProfile]);

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const handleRequestApproval = async () => {
    if (!name.trim()) return;

    try {
      // First save the profile with the name
      await saveProfile.mutateAsync({ name: name.trim() });
      
      // Generate ID
      const id = generateId();
      setGeneratedId(id);
      
      // Then request approval
      await requestApproval.mutateAsync();
      
      setHasRequestedApproval(true);
    } catch (error) {
      console.error('Error requesting approval:', error);
    }
  };

  const isSubmitting = saveProfile.isPending || requestApproval.isPending;
  const showNameInput = !hasRequestedApproval && isFetched;
  const showPendingState = hasRequestedApproval;

  if (profileLoading) {
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
        <div className="relative z-10 text-white text-lg">Loading...</div>
      </div>
    );
  }

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
      
      <div className="relative z-10 text-center px-6 max-w-md w-full">
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-2xl">
            <Clock className="w-12 h-12 text-white" />
          </div>
        </div>
        
        {showNameInput && (
          <>
            <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">
              Request Access
            </h1>
            <p className="text-lg text-white/90 mb-8">
              Please enter your name to request access to the application.
            </p>
            
            <div className="space-y-4 mb-6">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-6 py-3 rounded-full bg-white/95 backdrop-blur-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-lg"
                disabled={isSubmitting}
              />
            </div>
            
            <div className="space-y-3">
              <button
                onClick={handleRequestApproval}
                disabled={isSubmitting || !name.trim()}
                className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-full shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Request Approval'}
              </button>
              
              <button
                onClick={handleLogout}
                disabled={isSubmitting}
                className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-full backdrop-blur-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </>
        )}

        {showPendingState && (
          <>
            <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">
              Access Pending
            </h1>
            <p className="text-lg text-white/90 mb-6">
              Your request is awaiting approval from an administrator.
            </p>
            
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8 text-left">
              <div className="space-y-3">
                <div>
                  <p className="text-white/70 text-sm mb-1">Your Name</p>
                  <p className="text-white font-semibold text-lg">{name}</p>
                </div>
                <div>
                  <p className="text-white/70 text-sm mb-1">Your ID</p>
                  <p className="text-white font-mono font-bold text-2xl tracking-wider">{generatedId}</p>
                </div>
              </div>
            </div>

            <p className="text-white/80 text-sm mb-6">
              Please share your ID with an administrator to expedite approval.
            </p>
            
            <button
              onClick={handleLogout}
              className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-full backdrop-blur-sm transition-all duration-200 flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </>
        )}
      </div>
    </div>
  );
}
