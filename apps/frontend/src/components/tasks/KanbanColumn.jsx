// apps/frontend/src/components/tasks/KanbanColumn.jsx
// FIX: Removed unused `import React from 'react'` — only useState is needed

import { useState } from 'react';
import { TaskCard } from './TaskCard.jsx';

export const KanbanColumn = ({ title, count, tasks, onAddCard, onDropHandler, onTaskClick }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const onDragOver = (e) => {
    e.preventDefault();
    if (!isDragOver) setIsDragOver(true);
  };

  const onDragLeave = () => {
    setIsDragOver(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId && onDropHandler) {
      onDropHandler(taskId, title);
    }
  };

  // Column accent colors per status
  const accentColors = {
    'To do':       'border-gray-600/40',
    'In progress': 'border-purple-500/40',
    'In review':   'border-blue-500/40',
    'Done':        'border-green-500/40',
  };
  const dotColors = {
    'To do':       'bg-gray-400',
    'In progress': 'bg-purple-400',
    'In review':   'bg-blue-400',
    'Done':        'bg-green-400',
  };

  return (
    <div
      className={`w-[300px] flex-shrink-0 flex flex-col rounded-xl transition-all duration-200 border ${
        isDragOver
          ? 'bg-[#1e2128]/80 border-[#6366f1]/40 scale-[1.01]'
          : `bg-[#1a1d23]/50 ${accentColors[title] || 'border-[#2d3240]'}`
      }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-[#2d3240]">
        <div className="flex items-center space-x-2">
          <span className={`w-2 h-2 rounded-full shrink-0 ${dotColors[title] || 'bg-gray-400'}`} />
          <h3 className="text-white font-medium text-sm">{title}</h3>
          <span className="bg-[#2d3240] text-gray-400 text-xs px-2 py-0.5 rounded-full font-medium min-w-[20px] text-center">
            {count ?? tasks.length}
          </span>
        </div>
      </div>

      {/* Task cards */}
      <div className="flex flex-col gap-2 p-3 min-h-[120px] flex-1 overflow-y-auto">
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} onClick={onTaskClick} />
        ))}

        <button
          onClick={() => onAddCard && onAddCard(title)}
          className="w-full flex items-center justify-center py-2 mt-1 border border-dashed border-[#2d3240] rounded-lg text-gray-600 hover:text-gray-400 hover:border-gray-500 hover:bg-[#1e2128] transition-colors text-xs font-medium focus:outline-none"
        >
          <span className="mr-1">+</span> Add card
        </button>
      </div>
    </div>
  );
};