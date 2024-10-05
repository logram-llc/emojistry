import { useEffect } from 'react';

type AnalyticsProps = {
  gTagId: string;
};

declare const window: Window &
  typeof globalThis & {
    dataLayer: unknown[];
  };

export function Analytics({ gTagId }: AnalyticsProps): null {
  useEffect(() => {
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gTagId}`;

    document.head.appendChild(script);

    script.onload = () => {
      window.dataLayer = window.dataLayer || [];

      function gtag(...args: unknown[]) {
        window.dataLayer.push(args);
      }

      gtag('js', new Date());
      gtag('config', gTagId);
    };

    return () => {
      const existingScript = document.querySelector(
        `script[src^="https://www.googletagmanager.com/gtag/js"]`,
      );

      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [gTagId]);

  return null;
}
