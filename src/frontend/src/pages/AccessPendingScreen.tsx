import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useRequestApprovalWithName } from '../hooks/useQueries';
import { Clock, LogOut, AlertCircle } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { getPendingRequest, savePendingRequest, clearPendingRequest, type PendingRequest } from '../utils/pendingAccessRequest';

export default function AccessPendingScreen() {
  const { clear, identity } = useInternetIdentity();
  const requestApprovalWithName = useRequestApprovalWithName();
  const queryClient = useQueryClient();
  
  const [name, setName] = useState('');
  const [pendingRequest, setPendingRequest] = useState<PendingRequest | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load pending request from localStorage on mount
  useEffect(() => {
    if (!identity) return;
    
    const principal = identity.getPrincipal().toString();
    const stored = getPendingRequest(principal);
    
    if (stored) {
      setPendingRequest(stored);
      setName(stored.name);
    }
  }, [identity]);

  const handleLogout = async () => {
    // Clear pending request data on logout
    clearPendingRequest();
    await clear();
    queryClient.clear();
  };

  const handleRequestApproval = async () => {
    // Validate name is not empty
    if (!name.trim()) {
      setError('Please enter your name to request access.');
      return;
    }
    
    if (!identity) {
      setError('Authentication required. Please sign in again.');
      return;
    }
    
    setError(null);

    try {
      // Submit approval request to backend with name
      const response = await requestApprovalWithName.mutateAsync(name.trim());
      
      // Use backend-returned data
      const principal = identity.getPrincipal().toString();
      const request: PendingRequest = {
        name: response.name,
        fourCharId: response.fourCharId,
        principal,
        timestamp: Date.now(),
      };
      
      // Store in localStorage for persistence
      savePendingRequest(request);
      setPendingRequest(request);
      
    } catch (err: any) {
      console.error('Error requesting approval:', err);
      
      // Show user-friendly error message
      let errorMessage = 'Failed to submit access request. Please try again.';
      
      if (err?.message) {
        const message = err.message.toLowerCase();
        
        // Map backend errors to user-friendly messages
        if (message.includes('already approved')) {
          errorMessage = 'You are already approved. Please refresh the page.';
        } else if (message.includes('deprecated') || message.includes('requestapprovalwithname')) {
          // Hide deprecated API message from users
          errorMessage = 'Request failed due to a system error. Please try again or contact support.';
        } else if (message.includes('trap')) {
          errorMessage = 'Request failed. Please try again or contact support.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    }
  };

  const isSubmitting = requestApprovalWithName.isPending;
  const showPendingState = !!pendingRequest;

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
        
        {!showPendingState && (
          <>
            <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">
              Request Access
            </h1>
            <p className="text-lg text-white/90 mb-8">
              Please enter your name to request access to the application.
            </p>
            
            {error && (
              <div className="mb-6 p-4 bg-red-500/90 backdrop-blur-sm rounded-xl flex items-start gap-3 text-left">
                <AlertCircle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                <p className="text-white text-sm">{error}</p>
              </div>
            )}
            
            <div className="space-y-4 mb-6">
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null); // Clear error when user types
                }}
                placeholder="Enter your name"
                className="w-full px-6 py-3 rounded-full bg-white/95 backdrop-blur-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-lg"
                disabled={isSubmitting}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRequestApproval();
                  }
                }}
              />
            </div>
            
            <div className="space-y-3">
              <button
                onClick={handleRequestApproval}
                disabled={isSubmitting}
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

        {showPendingState && pendingRequest && (
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
                  <p className="text-white font-semibold text-lg">{pendingRequest.name}</p>
                </div>
                <div>
                  <p className="text-white/70 text-sm mb-1">Your ID</p>
                  <p className="text-white font-mono font-bold text-2xl tracking-wider">{pendingRequest.fourCharId}</p>
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
