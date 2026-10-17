import { useEffect } from 'react';

/**
 * useScrollReveal: Hook to observe elements with the `.reveal-init` class
 * and add `.reveal-visible` when they enter the viewport.
 */
export const useScrollReveal = () => {
  useEffect(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      // Fallback: make everything visible immediately if no IntersectionObserver
      document.querySelectorAll('.reveal-init').forEach((el) => {
        el.classList.add('reveal-visible');
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-visible');
            obs.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    const elements = document.querySelectorAll('.reveal-init');
    elements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, []);
};
