'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { getReviews, updateReviewStatus, replyToReview } from '@/lib/api/reviews';

export function useReviews() {
  const [filters, setFilters] = useState({ page: 1, page_size: 20, status: '' });

  const query = useQuery({
    queryKey: ['reviews', filters],
    queryFn: () => getReviews({ status: filters.status || undefined, page: filters.page, page_size: filters.page_size }),
    staleTime: 30_000,
  });

  return {
    query,
    filters,
    setPage: (page: number) => setFilters((f) => ({ ...f, page })),
    setStatus: (status: string) => setFilters((f) => ({ ...f, status, page: 1 })),
  };
}

export function useUpdateReviewStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'published' | 'rejected' }) =>
      updateReviewStatus(id, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reviews'] }),
  });
}

export function useReplyToReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reply }: { id: string; reply: string }) => replyToReview(id, reply),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['reviews'] }),
  });
}
