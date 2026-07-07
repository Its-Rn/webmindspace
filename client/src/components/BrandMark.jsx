export const BrandMark = () => {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-sky-400 to-indigo-500 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-400/20">
        P
      </div>
      <div className="leading-tight">
        <p className="font-display text-base font-semibold tracking-tight text-slate-950 dark:text-white">Pulse</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">Personal OS</p>
      </div>
    </div>
  );
};

