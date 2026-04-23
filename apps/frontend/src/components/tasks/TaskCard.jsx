// apps/frontend/src/components/tasks/TaskCard.jsx
// FIX: Removed unused `import React from 'react'`

const getInitials = (name) => {
  if (!name) return 'U';
  const split = name.split(' ').filter(Boolean);
  if (split.length === 1) return split[0].substring(0, 2).toUpperCase();
  return (split[0][0] + split[split.length - 1][0]).toUpperCase();
};

const getAvatarColor = (name = '') => {
  const colors = [
    'bg-red-500', 'bg-blue-500', 'bg-green-500',
    'bg-yellow-500', 'bg-purple-500', 'bg-pink-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const PriorityBadge = ({ priority }) => {
  const styles = {
    High: 'bg-red-500/20 text-red-400 border-red-500/30',
    Med:  'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    Low:  'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };
  return (
    <span className={`px-2 py-0.5 text-[10px] font-semibold border rounded ${styles[priority] || styles.Low}`}>
      {priority}
    </span>
  );
};

const CategoryBadge = ({ category }) => {
  if (!category) return null;
  const styles = {
    Backend:  'bg-blue-500/20 text-blue-400 border-blue-500/30',
    Frontend: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
    Security: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  };
  const defaultStyle = 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
  return (
    <span className={`px-2 py-0.5 text-[10px] font-semibold border rounded ml-1 ${styles[category] || defaultStyle}`}>
      {category}
    </span>
  );
};

export const TaskCard = ({ task, onClick }) => {
  const isOverdue = task.isOverdue || (task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Done');

  const onDragStart = (e) => {
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={() => onClick && onClick(task)}
      className="bg-[#242830] rounded-xl p-4 border border-transparent hover:border-[#6366f1]/60 transition-all cursor-grab active:cursor-grabbing flex flex-col space-y-3 hover:shadow-lg hover:shadow-black/20 group"
    >
      {/* Badges row */}
      <div className="flex flex-wrap items-center gap-1">
        <PriorityBadge priority={task.priority} />
        {task.category && <CategoryBadge category={task.category} />}
      </div>

      {/* Title */}
      <h4 className="text-white font-medium text-sm line-clamp-2 leading-snug group-hover:text-gray-100">
        {task.title}
      </h4>

      {/* Footer row: assignee + due date */}
      <div className="flex items-center justify-between pt-1">
        {task.assignee ? (
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white font-bold ${getAvatarColor(task.assignee.name)}`}
            title={task.assignee.name}
          >
            {getInitials(task.assignee.name)}
          </div>
        ) : (
          <div className="w-6 h-6 rounded-full bg-[#1e2128] border border-dashed border-[#2d3240]" title="Unassigned" />
        )}

        <div className={`flex items-center space-x-1 ${isOverdue ? 'text-red-400' : 'text-gray-500'}`}>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className={`text-[11px] font-medium ${isOverdue ? 'text-red-400' : 'text-gray-500'}`}>
            {task.dueDate
              ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
              : 'No date'}
          </span>
          {isOverdue && <span className="text-[10px] font-bold text-red-400">!</span>}
        </div>
      </div>
    </div>
  );
};