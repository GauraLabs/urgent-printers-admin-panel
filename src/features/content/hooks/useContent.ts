'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getBanners, createBanner, updateBanner, deleteBanner, reorderBanners,
  getTestimonials, createTestimonial, updateTestimonial, deleteTestimonial,
  getAnnouncement, updateAnnouncement,
  getFaqs, createFaq, updateFaq, deleteFaq, reorderFaqs,
  getNavLinks, createNavLink, updateNavLink, deleteNavLink, reorderNavLinks,
} from '@/lib/api/content';
import type { Banner, Testimonial, Announcement, Faq, NavLink } from '@/types';

const invalidate = (qc: ReturnType<typeof useQueryClient>, key: string) =>
  () => qc.invalidateQueries({ queryKey: [key] });

// ── Banners ──────────────────────────────────────────────────
export function useBanners() {
  return useQuery({ queryKey: ['banners'], queryFn: getBanners, staleTime: 60_000 });
}

export function useBannerMutations() {
  const qc = useQueryClient();
  const inv = invalidate(qc, 'banners');
  return {
    create: useMutation({ mutationFn: (d: Partial<Banner>) => createBanner(d), onSuccess: inv }),
    update: useMutation({ mutationFn: ({ id, d }: { id: string; d: Partial<Banner> }) => updateBanner(id, d), onSuccess: inv }),
    remove: useMutation({ mutationFn: (id: string) => deleteBanner(id), onSuccess: inv }),
    reorder: useMutation({ mutationFn: (ids: string[]) => reorderBanners(ids), onSuccess: inv }),
  };
}

// ── Testimonials ─────────────────────────────────────────────
export function useTestimonials() {
  return useQuery({ queryKey: ['testimonials'], queryFn: getTestimonials, staleTime: 60_000 });
}

export function useTestimonialMutations() {
  const qc = useQueryClient();
  const inv = invalidate(qc, 'testimonials');
  return {
    create: useMutation({ mutationFn: (d: Partial<Testimonial>) => createTestimonial(d), onSuccess: inv }),
    update: useMutation({ mutationFn: ({ id, d }: { id: string; d: Partial<Testimonial> }) => updateTestimonial(id, d), onSuccess: inv }),
    remove: useMutation({ mutationFn: (id: string) => deleteTestimonial(id), onSuccess: inv }),
  };
}

// ── Announcement ─────────────────────────────────────────────
export function useAnnouncement() {
  return useQuery({ queryKey: ['announcement'], queryFn: getAnnouncement, staleTime: 60_000 });
}

export function useAnnouncementMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d: Partial<Announcement>) => updateAnnouncement(d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['announcement'] }),
  });
}

// ── FAQs ─────────────────────────────────────────────────────
export function useFaqs() {
  return useQuery({ queryKey: ['faqs'], queryFn: getFaqs, staleTime: 60_000 });
}

export function useFaqMutations() {
  const qc = useQueryClient();
  const inv = invalidate(qc, 'faqs');
  return {
    create: useMutation({ mutationFn: (d: Partial<Faq>) => createFaq(d), onSuccess: inv }),
    update: useMutation({ mutationFn: ({ id, d }: { id: string; d: Partial<Faq> }) => updateFaq(id, d), onSuccess: inv }),
    remove: useMutation({ mutationFn: (id: string) => deleteFaq(id), onSuccess: inv }),
    reorder: useMutation({ mutationFn: (ids: string[]) => reorderFaqs(ids), onSuccess: inv }),
  };
}

// ── Nav Links ──────────────────────────────────────────────────
// placement is part of the query key so header/footer lists cache
// independently — never a single combined list.
export function useNavLinks(placement: 'header' | 'footer') {
  return useQuery({
    queryKey: ['nav-links', placement],
    queryFn: () => getNavLinks(placement),
    staleTime: 60_000,
  });
}

export function useNavLinkMutations(placement: 'header' | 'footer') {
  const qc = useQueryClient();
  const inv = () => qc.invalidateQueries({ queryKey: ['nav-links', placement] });
  return {
    create: useMutation({ mutationFn: (d: Partial<NavLink>) => createNavLink(d), onSuccess: inv }),
    update: useMutation({ mutationFn: ({ id, d }: { id: string; d: Partial<NavLink> }) => updateNavLink(id, d), onSuccess: inv }),
    remove: useMutation({ mutationFn: (id: string) => deleteNavLink(id), onSuccess: inv }),
    reorder: useMutation({ mutationFn: (ids: string[]) => reorderNavLinks(placement, ids), onSuccess: inv }),
  };
}
