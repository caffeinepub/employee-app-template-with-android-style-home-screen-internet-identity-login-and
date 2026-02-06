import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useAccessStatus } from './hooks/useAccessStatus';
import LoginScreen from './pages/LoginScreen';
import AccessPendingScreen from './pages/AccessPendingScreen';
import AppRouter from './router/AppRouter';
import { clearPendingRequest } from './utils/pendingAccessRequest';
import { useEffect } from 'react';

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const { isApproved, isLoading: accessLoading, isFetched } = useAccessStatus();

  // Clear pending access request when user becomes approved
  useEffect(() => {
    if (identity && isApproved && isFetched) {
      clearPendingRequest();
    }
  }, [identity, isApproved, isFetched]);

  // Show loading state during initialization
  if (isInitializing || (identity && !isFetched)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  // Not logged in - show login screen
  if (!identity) {
    return <LoginScreen />;
  }

  // Logged in but not approved - show access pending screen
  if (!isApproved) {
    return <AccessPendingScreen />;
  }

  // Logged in and approved - show main app
  return <AppRouter />;
}
