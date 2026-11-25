import React, { useState } from 'react';
import { Download, Maximize2, Minimize2, WifiOff } from 'lucide-react';
import { STRINGS_DE } from '../content/strings.de';
import { useFullscreen } from '../core/fullscreen';
import { useOnlineStatus, usePWAInstall } from '../core/usePWAInstall';

export const FullscreenButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isFullscreen, supported, toggleFullscreen } = useFullscreen();
  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={() => void toggleFullscreen()}
      aria-label={isFullscreen ? 'Vollbild beenden' : 'Vollbild'}
      title={isFullscreen ? 'Vollbild beenden' : 'Vollbild'}
      className="min-h-[44px] px-3 py-2 rounded-xl border-2 border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shrink-0"
    >
      {isFullscreen ? <Minimize2 className="w-4 h-4 text-blue-600" /> : <Maximize2 className="w-4 h-4 text-blue-600" />}
      {!compact && <span className="hidden sm:inline short:hidden">{isFullscreen ? 'Vollbild aus' : 'Vollbild'}</span>}
    </button>
  );
};

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        className="min-h-[44px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-[0_3px_0_#1D4ED8] active:translate-y-0.5 flex items-center gap-2 whitespace-nowrap shrink-0"
      >
        <Download className="w-4 h-4" />
        <span>{STRINGS_DE.app.installButton}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold whitespace-nowrap shrink-0"
        >
          {STRINGS_DE.app.installIOSButton}
        </button>
        {showIOSGuide && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 border-2 border-slate-200 shadow-xl space-y-3">
              <h3 className="text-lg font-bold text-slate-900">{STRINGS_DE.app.installIOSTitle}</h3>
              <p className="text-sm text-slate-600">{STRINGS_DE.app.installIOSStep1}</p>
              <p className="text-sm text-slate-600">{STRINGS_DE.app.installIOSStep2}</p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full min-h-[48px] rounded-xl bg-slate-900 text-white font-bold text-sm"
              >
                {STRINGS_DE.app.close}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40 rounded-xl bg-amber-100 border border-amber-300 px-3.5 py-2 text-xs font-semibold text-amber-900 shadow-md flex items-center gap-2">
      <WifiOff className="w-4 h-4 text-amber-700" />
      <span>{STRINGS_DE.app.offlineBanner}</span>
    </div>
  );
};
