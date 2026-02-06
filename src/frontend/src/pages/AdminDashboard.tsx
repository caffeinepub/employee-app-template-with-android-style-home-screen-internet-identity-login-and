import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, CheckCircle, XCircle, Shield, User, Trash2, AlertTriangle, Plus, Image as ImageIcon } from 'lucide-react';
import { useListApprovals, useSetApproval, useAssignUserRole, useUpdateAnnouncement, useGetAnnouncement, useGetUserRole, useBackendReset, useListCustomModules, useCreateCustomModule, useDeleteCustomModule } from '../hooks/useQueries';
import { ApprovalStatus, UserRole } from '../backend';
import { useState, useEffect } from 'react';
import { Principal } from '@dfinity/principal';
import type { UserNameInfo } from '../backend';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { createImageUrl, revokeImageUrl } from '../utils/customModuleImage';
import { compressImage } from '../utils/imageCompression';
import { errorToString } from '../utils/errorToString';

// Component to display pending approval
function UserApprovalRow({ 
  approval, 
  onApprove, 
  onReject, 
  isPending 
}: { 
  approval: UserNameInfo; 
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
            <div className="space-y-2">
              {approval.name && (
                <p className="text-base font-semibold text-slate-900">{approval.name}</p>
              )}
              <div className="flex items-center gap-2">
                <p className="text-sm font-mono text-slate-500">{shortPrincipal}</p>
                {approval.fourCharId && approval.fourCharId !== 'finalized' && (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-mono rounded">
                    ID: {approval.fourCharId}
                  </span>
                )}
              </div>
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
  approval: UserNameInfo; 
  onToggleAdmin: (currentRole: UserRole) => void;
  onRemove: () => void;
  isPending: boolean;
}) {
  const principalText = approval.principal.toText();
  const shortPrincipal = `${principalText.slice(0, 12)}...${principalText.slice(-8)}`;
  
  // Fetch the actual role from backend
  const { data: userRole, isLoading: roleLoading } = useGetUserRole(approval.principal);
  
  const isAdmin = userRole === UserRole.admin;
  const roleLabel = isAdmin ? 'Admin' : 'Approved User';

  const handleToggle = () => {
    if (userRole) {
      onToggleAdmin(userRole);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-slate-50 rounded-xl">
      {/* User info section */}
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <User className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div className="min-w-0 flex-1">
          <div className="space-y-1">
            {approval.name && (
              <p className="text-base font-semibold text-slate-900 truncate">{approval.name}</p>
            )}
            <p className="font-mono text-sm text-slate-600 truncate">{shortPrincipal}</p>
            <p className="text-sm text-slate-500">
              {roleLoading ? 'Loading role...' : roleLabel}
            </p>
          </div>
        </div>
      </div>

      {/* Actions section - stacked on mobile, horizontal on tablet+ */}
      <div className="flex flex-col sm:flex-row gap-2 sm:flex-shrink-0">
        <button
          onClick={handleToggle}
          disabled={isPending || roleLoading}
          className={`w-full sm:w-auto px-4 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap ${
            isAdmin 
              ? 'bg-amber-500 hover:bg-amber-600 text-white' 
              : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
          }`}
        >
          <Shield className="w-4 h-4 flex-shrink-0" />
          <span>{isAdmin ? 'Remove Admin' : 'Make Admin'}</span>
        </button>
        <button
          onClick={onRemove}
          disabled={isPending}
          className="w-full sm:w-auto px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
        >
          <Trash2 className="w-4 h-4 flex-shrink-0" />
          <span>Remove</span>
        </button>
      </div>
    </div>
  );
}

// Component for custom module row
function CustomModuleRow({
  module,
  onDelete,
  isPending,
}: {
  module: { moduleId: string; title: string; image: { bytes: Uint8Array; contentType: string } };
  onDelete: () => void;
  isPending: boolean;
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
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {imageUrl && (
          <img
            src={imageUrl}
            alt={module.title}
            className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-slate-900 truncate">{module.title}</p>
          <p className="text-sm text-slate-500 font-mono truncate">{module.moduleId}</p>
        </div>
      </div>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button
            disabled={isPending}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 flex-shrink-0"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Module</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{module.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
  const backendReset = useBackendReset();
  const { data: customModules, isLoading: modulesLoading } = useListCustomModules();
  const createModule = useCreateCustomModule();
  const deleteModule = useDeleteCustomModule();
  
  const [announcementText, setAnnouncementText] = useState(announcement || '');
  const [isSaving, setIsSaving] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Module form state
  const [moduleTitle, setModuleTitle] = useState('');
  const [moduleImage, setModuleImage] = useState<File | null>(null);
  const [moduleError, setModuleError] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);

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

  const handleBackendReset = async () => {
    setResetSuccess(false);
    try {
      await backendReset.mutateAsync();
      setResetSuccess(true);
      setAnnouncementText('');
    } catch (error) {
      // Silently handle errors - admins should never see reset failures
      // The backend ensures admin identities persist
    }
  };

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    setModuleError('');

    // Validation
    if (!moduleTitle.trim()) {
      setModuleError('Please enter a module title');
      return;
    }
    if (!moduleImage) {
      setModuleError('Please select an image');
      return;
    }

    try {
      setIsCompressing(true);
      
      // Compress image before upload
      const compressed = await compressImage(moduleImage);
      
      setIsCompressing(false);

      // Generate moduleId from title
      const moduleId = moduleTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      await createModule.mutateAsync({
        moduleId,
        title: moduleTitle.trim(),
        image: {
          bytes: compressed.bytes,
          contentType: compressed.contentType,
        },
      });

      // Reset form
      setModuleTitle('');
      setModuleImage(null);
      const fileInput = document.getElementById('module-image-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error: unknown) {
      setIsCompressing(false);
      setModuleError(errorToString(error));
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    try {
      await deleteModule.mutateAsync(moduleId);
    } catch (error: any) {
      console.error('Failed to delete module:', error);
    }
  };

  // Filter approvals by status
  const pendingApprovals = (approvals || []).filter(a => a.status === ApprovalStatus.pending);
  const approvedUsers = (approvals || []).filter(a => a.status === ApprovalStatus.approved);

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
          {/* Backend Reset Section */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl border-2 border-red-200">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-slate-900 mb-2">Reset Application Data</h2>
                <p className="text-sm text-slate-600 mb-4">
                  This action will permanently delete all application data including user profiles, access requests, approvals, and announcements. This cannot be undone. Admin identities will persist after the reset.
                </p>
                
                {resetSuccess && (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <p className="text-sm text-emerald-800 font-medium">
                      ✓ Application data has been successfully reset. All client state has been cleared. Admin identities have been preserved.
                    </p>
                  </div>
                )}

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button
                      disabled={backendReset.isPending}
                      className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      {backendReset.isPending ? 'Resetting...' : 'Reset All Data'}
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="w-5 h-5" />
                        Confirm Data Reset
                      </AlertDialogTitle>
                      <AlertDialogDescription className="space-y-3">
                        <p className="font-semibold text-slate-900">
                          Are you absolutely sure you want to reset all application data?
                        </p>
                        <p>This will permanently delete:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          <li>All user profiles</li>
                          <li>All access requests and approvals</li>
                          <li>All announcements and content</li>
                          <li>All application state</li>
                        </ul>
                        <p className="font-semibold text-emerald-600">
                          Admin identities will be preserved.
                        </p>
                        <p className="font-semibold text-red-600">
                          This action cannot be undone.
                        </p>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleBackendReset}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Yes, Reset Everything
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>

          {/* Pending Approvals */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Pending Approvals</h2>
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
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Approved Users</h2>
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

          {/* Announcement Editor */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Announcement</h2>
            <form onSubmit={handleSaveAnnouncement} className="space-y-4">
              <textarea
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                placeholder="Enter announcement text..."
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[120px] resize-y"
              />
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Announcement'}
              </button>
            </form>
          </div>

          {/* Custom Modules Section */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Custom Modules</h2>
            
            {/* Add Module Form */}
            <form onSubmit={handleAddModule} className="space-y-4 mb-6 p-4 bg-slate-50 rounded-xl">
              <div>
                <label htmlFor="module-title" className="block text-sm font-medium text-slate-700 mb-2">
                  Module Title
                </label>
                <input
                  id="module-title"
                  type="text"
                  value={moduleTitle}
                  onChange={(e) => setModuleTitle(e.target.value)}
                  placeholder="Enter module title"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label htmlFor="module-image-input" className="block text-sm font-medium text-slate-700 mb-2">
                  Module Image
                </label>
                <div className="flex items-center gap-3">
                  <label
                    htmlFor="module-image-input"
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg cursor-pointer transition-colors flex items-center gap-2"
                  >
                    <ImageIcon className="w-4 h-4" />
                    Choose Image
                  </label>
                  <input
                    id="module-image-input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setModuleImage(file);
                        setModuleError('');
                      }
                    }}
                    className="hidden"
                  />
                  {moduleImage && (
                    <span className="text-sm text-slate-600 truncate max-w-xs">
                      {moduleImage.name}
                    </span>
                  )}
                </div>
              </div>

              {moduleError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-semibold text-red-800 mb-2">Error:</p>
                  <pre className="text-xs text-red-700 whitespace-pre-wrap font-mono overflow-x-auto">
                    {moduleError}
                  </pre>
                </div>
              )}

              <button
                type="submit"
                disabled={createModule.isPending || isCompressing}
                className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {isCompressing ? 'Compressing...' : createModule.isPending ? 'Adding...' : 'Add Module'}
              </button>
            </form>

            {/* Module List */}
            {modulesLoading ? (
              <p className="text-slate-600">Loading modules...</p>
            ) : !customModules || customModules.length === 0 ? (
              <p className="text-slate-600">No custom modules yet</p>
            ) : (
              <div className="space-y-3">
                {customModules.map((module) => (
                  <CustomModuleRow
                    key={module.moduleId}
                    module={module}
                    onDelete={() => handleDeleteModule(module.moduleId)}
                    isPending={deleteModule.isPending}
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
