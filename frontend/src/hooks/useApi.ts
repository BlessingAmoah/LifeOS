import { useQuery, useMutation, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import api from '../services/api';

export const useApiQuery = <T>(
  key: string[],
  endpoint: string,
  options?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<T>({
    queryKey: key,
    queryFn: () => api.get(endpoint).then(res => res.data),
    ...options,
  });
};

export const useApiMutation = <TData = any, TVariables = any>(
  endpoint: string,
  method: 'post' | 'put' | 'delete' = 'post',
  options?: UseMutationOptions<TData, Error, TVariables>
) => {
  return useMutation<TData, Error, TVariables>({
    mutationFn: (data: TVariables) => {
      switch (method) {
        case 'post':
          return api.post(endpoint, data).then(res => res.data);
        case 'put':
          return api.put(endpoint, data).then(res => res.data);
        case 'delete':
          return api.delete(endpoint).then(res => res.data);
        default:
          return api.post(endpoint, data).then(res => res.data);
      }
    },
    ...options,
  });
};
