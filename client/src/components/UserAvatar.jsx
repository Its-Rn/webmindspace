export const UserAvatar = ({ user, size = 'md', className = '' }) => {
  const dimensions = {
    sm: 'h-9 w-9 text-sm',
    md: 'h-11 w-11 text-sm',
    lg: 'h-20 w-20 text-xl'
  };

  const initials = (user?.name || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-cyan-400 via-sky-400 to-indigo-500 font-bold text-slate-950 ${dimensions[size]} ${className}`}
    >
      {user?.avatarUrl ? (
        <img src={user.avatarUrl} alt={user?.name || 'Profile avatar'} className="h-full w-full object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
};

