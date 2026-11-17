import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getMe, updateMe, type UpdateMePayload, type User } from "../api/auth";
import { useAuth } from "../context/AuthContext";

export const ME_QUERY_KEY = ["me"] as const;

export function useMe() {
  const { isAuthenticated } = useAuth();

  return useQuery<User>({
    queryKey: ME_QUERY_KEY,
    queryFn: getMe,
    enabled: isAuthenticated,
  });
}

export function useUpdateMe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateMePayload) => updateMe(payload),
    onSuccess: (user) => {
      queryClient.setQueryData(ME_QUERY_KEY, user);
      queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY });
    },
  });
}
