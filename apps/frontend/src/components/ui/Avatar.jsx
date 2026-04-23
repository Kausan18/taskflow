import React from 'react';

const getInitials = (name) => {
  if (!name) return 'U';
  const split = name.split(' ').filter(Boolean);
  if (split.length === 1) return split[0].substring(0, 2).toUpperCase();
  return (split[0][0] + split[split.length - 1][0]).toUpperCase();
};

const getAvatarColor = (name = '') => {
  const colors = ['bg-purple-500', 'bg-blue-500', 'bg-teal-500', 'bg-green-500', 'bg-orange-500', 'bg-orange-400'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const Avatar = ({ name, size = 'md' }) => {
  const sizeMap = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm'
  };

  return (
    <div 
      className={`rounded-full flex items-center justify-center font-bold text-white shrink-0 shadow-sm ${sizeMap[size] || sizeMap.md} ${getAvatarColor(name)}`}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
};
