import { useCallback, useEffect, useState } from 'react';

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [supported, setSupported] = useState<boolean>(false);

  useEffect(() => {
    const canFs =
      typeof document !== 'undefined' &&
      (Boolean(document.fullscreenEnabled) ||
        Boolean((document as unknown as { webkitFullscreenEnabled?: boolean }).webkitFullscreenEnabled));
    setSupported(canFs);

    const onChange = () => {
      const fsEl =
        document.fullscreenElement ??
        (document as unknown as { webkitFullscreenElement?: Element | null }).webkitFullscreenElement;
      setIsFullscreen(Boolean(fsEl));
    };

    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    onChange();
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
    };
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      const doc = document as unknown as {
        fullscreenElement?: Element | null;
        webkitFullscreenElement?: Element | null;
        exitFullscreen?: () => Promise<void>;
        webkitExitFullscreen?: () => Promise<void>;
      };
      const el = document.documentElement as unknown as {
        requestFullscreen?: (opts?: { navigationUI?: string }) => Promise<void>;
        webkitRequestFullscreen?: () => Promise<void>;
      };

      const active = doc.fullscreenElement ?? doc.webkitFullscreenElement;
      if (active) {
        if (doc.exitFullscreen) await doc.exitFullscreen();
        else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
      } else {
        if (el.requestFullscreen) await el.requestFullscreen({ navigationUI: 'hide' });
        else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
      }
    } catch {
      // Ignore fullscreen denials inside restricted iframes or iOS Safari
    }
  }, []);

  return { isFullscreen, supported, toggleFullscreen };
}
