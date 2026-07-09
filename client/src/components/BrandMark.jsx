import { useEffect, useState } from 'react';

export const BrandMark = () => {
  const [name, setName] = useState(() => localStorage.getItem('siteName') || '');
  const [logo, setLogo] = useState(() => localStorage.getItem('siteLogoText') || '');
  const [tagline, setTagline] = useState(() => localStorage.getItem('siteTagline') || '');

  useEffect(() => {
    const onStorage = () => {
      setName(localStorage.getItem('siteName') || '');
      setLogo(localStorage.getItem('siteLogoText') || '');
      setTagline(localStorage.getItem('siteTagline') || '');
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const letter = logo?.charAt(0)?.toUpperCase() || 'P';

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-sky-400 to-indigo-500 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-400/20">
        {letter}
      </div>
      <div className="leading-tight">
        <p className="font-display text-base font-semibold tracking-tight text-slate-950 dark:text-white">{name || 'Pulse'}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{tagline || 'Personal OS'}</p>
      </div>
    </div>
  );
};

