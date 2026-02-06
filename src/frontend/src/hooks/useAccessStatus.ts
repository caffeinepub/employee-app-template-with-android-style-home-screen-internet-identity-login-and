import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';

export function useAccessStatus() {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  const approvalQuery = useQuery({
    queryKey: ['accessStatus', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      const [isApproved, isAdmin] = await Promise.all([
        actor.isCallerApproved(),
        actor.isCallerAdmin(),
      ]);
      return { isApproved, isAdmin };
    },
    enabled: !!actor && !!identity && !actorFetching,
    retry: false,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  return {
    isApproved: approvalQuery.data?.isApproved ?? false,
    isAdmin: approvalQuery.data?.isAdmin ?? false,
    isLoading: actorFetching || approvalQuery.isLoading,
    isFetched: !!actor && approvalQuery.isFetched,
  };
}
