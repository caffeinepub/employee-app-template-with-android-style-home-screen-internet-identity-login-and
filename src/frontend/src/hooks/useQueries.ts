import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { UserApprovalInfo, ApprovalStatus, UserNameInfo, CustomModule } from '../backend';
import { UserRole } from '../backend';
import { Principal } from '@dfinity/principal';

// Type for user profile
type UserProfile = { name: string };

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useGetUserProfile(userPrincipal: Principal | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserProfile | null>({
    queryKey: ['userProfile', userPrincipal?.toText()],
    queryFn: async () => {
      if (!actor || !userPrincipal) throw new Error('Actor or user not available');
      return actor.getUserProfile(userPrincipal);
    },
    enabled: !!actor && !!userPrincipal && !actorFetching,
    retry: false,
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['accessStatus'] });
    },
  });
}

// Approval Queries
export function useRequestApprovalWithName() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.requestApprovalWithName(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accessStatus'] });
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
    },
  });
}

// Admin Queries - Updated to use getAllUsersWithFullName
export function useListApprovals() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserNameInfo[]>({
    queryKey: ['approvals'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getAllUsersWithFullName();
    },
    enabled: !!actor && !actorFetching,
    refetchInterval: 5000, // Auto-refetch every 5 seconds while the query is enabled
  });
}

export function useSetApproval() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user, status }: { user: Principal; status: ApprovalStatus }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setApproval(user, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['accessStatus'] });
      queryClient.invalidateQueries({ queryKey: ['userRole'] });
    },
  });
}

export function useGetUserRole(userPrincipal: Principal | null) {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserRole>({
    queryKey: ['userRole', userPrincipal?.toText()],
    queryFn: async () => {
      if (!actor || !userPrincipal) throw new Error('Actor or user not available');
      return actor.getUserRole(userPrincipal);
    },
    enabled: !!actor && !!userPrincipal && !actorFetching,
    retry: false,
  });
}

export function useAssignUserRole() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ user, role }: { user: Principal; role: UserRole }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.assignCallerUserRole(user, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      queryClient.invalidateQueries({ queryKey: ['userRole'] });
      queryClient.invalidateQueries({ queryKey: ['accessStatus'] });
    },
  });
}

// Content/Announcement Queries
export function useGetAnnouncement() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<string | null>({
    queryKey: ['announcement'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.getContent('global_announcement');
      } catch (error) {
        // Content not found is expected initially
        return null;
      }
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useUpdateAnnouncement() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addContent('global_announcement', content);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcement'] });
    },
  });
}

// Backend Reset Mutation
export function useBackendReset() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.backendReset();
    },
    onSuccess: () => {
      // Clear all React Query cache
      queryClient.clear();
      
      // Remove localStorage key used by AccessPendingScreen
      localStorage.removeItem('pending_access_request');
    },
    // Suppress error handling - admins should never see reset failures
    // The backend ensures admin identities persist
    onError: () => {
      // Silently handle errors
    },
  });
}

// Custom Module Queries
export function useListCustomModules() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<CustomModule[]>({
    queryKey: ['customModules'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.listCustomModules();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useCreateCustomModule() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (module: CustomModule) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createCustomModule(module);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customModules'] });
    },
  });
}

export function useDeleteCustomModule() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (moduleId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteCustomModule(moduleId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customModules'] });
    },
  });
}

export function useGetCustomModule(moduleId: string | undefined) {
  const { data: modules, isLoading } = useListCustomModules();

  return {
    data: moduleId ? modules?.find(m => m.moduleId === moduleId) : undefined,
    isLoading,
  };
}
