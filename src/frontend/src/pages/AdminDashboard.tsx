import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, CheckCircle, XCircle, Shield, User, Trash2, AlertCircle } from 'lucide-react';
import { useListApprovals, useSetApproval, useAssignUserRole, useUpdateAnnouncement, useGetAnnouncement } from '../hooks/useQueries';
import { ApprovalStatus, UserRole } from '../backend';
import { useState } from 'react';
import { Principal } from '@dfinity/principal';
import type { UserApprovalInfo } from '../backend';

// Component to display pending approval - backend doesn't provide name/ID yet
function UserApprovalRow({ 
  approval, 
  onApprove, 
  onReject, 
  isPending 
}: { 
  approval: UserApprovalInfo; 
  onApprove: () => void; 
  onReject: () => void; 
  isPending: boolean;
}) {
  const principalText = approval.principal.toText();
  const shortPrincipal = `${principalText.slice(0, 8)}...${principalText.slice(-6)}`;

  return (
    <div className="p-4 bg-slate-50 rounded-xl">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          <User className="w-5 h-5 text-slate-400 mt-1" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-sm font-mono text-slate-500">{shortPrincipal}</p>
            </div>
            <div className="flex items-start gap-2 p-2 bg-amber-50 rounded-lg border border-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                Backend doesn't expose requester name and ID yet. Ask the user for their 4-character ID to match their request.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-2 ml-8">
        <button
          onClick={onApprove}
          disabled={isPending}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          Approve
        </button>
        <button
          onClick={onReject}
          disabled={isPending}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <XCircle className="w-4 h-4" />
          Reject
        </button>
      </div>
    </div>
  );
}

// Component for approved user row
function ApprovedUserRow({ 
  approval, 
  onToggleAdmin, 
  onRemove,
  isPending 
}: { 
  approval: UserApprovalInfo; 
  onToggleAdmin: (currentRole: UserRole) => void;
  onRemove: () => void;
  isPending: boolean;
}) {
  // Note: Backend doesn't expose getUserRole or store names with approvals
  const [isAdmin, setIsAdmin] = useState(false);

  const principalText = approval.principal.toText();
  const shortPrincipal = `${principalText.slice(0, 12)}...${principalText.slice(-8)}`;
  const roleLabel = isAdmin ? 'Admin' : 'Approved User';

  const handleToggle = () => {
    const currentRole = isAdmin ? UserRole.admin : UserRole.user;
    onToggleAdmin(currentRole);
    setIsAdmin(!isAdmin);
  };

  return (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
      <div className="flex items-center gap-4">
        <User className="w-5 h-5 text-emerald-600" />
        <div>
          <p className="font-mono text-sm text-slate-900">{shortPrincipal}</p>
          <p className="text-sm text-slate-500">{roleLabel}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleToggle}
          disabled={isPending}
          className={`px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 ${
            isAdmin 
              ? 'bg-amber-500 hover:bg-amber-600 text-white' 
              : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
          }`}
        >
          <Shield className="w-4 h-4" />
          {isAdmin ? 'Remove Admin' : 'Make Admin'}
        </button>
        <button
          onClick={onRemove}
          disabled={isPending}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Remove
        </button>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { data: approvals, isLoading } = useListApprovals();
  const setApproval = useSetApproval();
  const assignRole = useAssignUserRole();
  const { data: announcement } = useGetAnnouncement();
  const updateAnnouncement = useUpdateAnnouncement();
  
  const [announcementText, setAnnouncementText] = useState(announcement || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleApprove = async (principal: Principal) => {
    await setApproval.mutateAsync({
      user: principal,
      status: ApprovalStatus.approved,
    });
  };

  const handleReject = async (principal: Principal) => {
    await setApproval.mutateAsync({
      user: principal,
      status: ApprovalStatus.rejected,
    });
  };

  const handleToggleAdmin = async (principal: Principal, currentRole: UserRole) => {
    const newRole = currentRole === UserRole.admin ? UserRole.user : UserRole.admin;
    await assignRole.mutateAsync({
      user: principal,
      role: newRole,
    });
  };

  const handleRemoveUser = async (principal: Principal) => {
    await setApproval.mutateAsync({
      user: principal,
      status: ApprovalStatus.rejected,
    });
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateAnnouncement.mutateAsync(announcementText);
    } finally {
      setIsSaving(false);
    }
  };

  const pendingApprovals = approvals?.filter(a => a.status === ApprovalStatus.pending) || [];
  const approvedUsers = approvals?.filter(a => a.status === ApprovalStatus.approved) || [];

  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{
        backgroundImage: 'url(/assets/generated/employee-wallpaper.dim_1920x1080.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <div className="bg-white/90 backdrop-blur-md shadow-lg">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
            <button
              onClick={() => navigate({ to: '/' })}
              className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-emerald-600" />
              <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 max-w-6xl mx-auto px-6 py-8 w-full space-y-6">
          {/* Announcement Editor */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Global Announcement</h2>
            <form onSubmit={handleSaveAnnouncement} className="space-y-4">
              <textarea
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                placeholder="Enter announcement message..."
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-emerald-500 focus:outline-none text-slate-900 min-h-[100px]"
              />
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Announcement'}
              </button>
            </form>
          </div>

          {/* Pending Approvals */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Pending Approvals ({pendingApprovals.length})
            </h2>
            {isLoading ? (
              <p className="text-slate-600">Loading...</p>
            ) : pendingApprovals.length === 0 ? (
              <p className="text-slate-600">No pending approvals</p>
            ) : (
              <div className="space-y-3">
                {pendingApprovals.map((approval) => (
                  <UserApprovalRow
                    key={approval.principal.toText()}
                    approval={approval}
                    onApprove={() => handleApprove(approval.principal)}
                    onReject={() => handleReject(approval.principal)}
                    isPending={setApproval.isPending}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Approved Users */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Approved Users ({approvedUsers.length})
            </h2>
            {isLoading ? (
              <p className="text-slate-600">Loading...</p>
            ) : approvedUsers.length === 0 ? (
              <p className="text-slate-600">No approved users</p>
            ) : (
              <div className="space-y-3">
                {approvedUsers.map((approval) => (
                  <ApprovedUserRow
                    key={approval.principal.toText()}
                    approval={approval}
                    onToggleAdmin={(currentRole) => handleToggleAdmin(approval.principal, currentRole)}
                    onRemove={() => handleRemoveUser(approval.principal)}
                    isPending={setApproval.isPending || assignRole.isPending}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
