'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const trackPageVisit = async () => {
        try {
          await fetch('/api/analytics/track', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ path: pathname }),
          });
        } catch (error) {
          console.error('Failed to report analytics telemetry:', error);
        }
      };

      trackPageVisit();
    }
  }, [pathname]);

  return null;
}
