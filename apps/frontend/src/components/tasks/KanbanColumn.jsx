import React, { useState } from 'react';
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

  return (
    <div 
      className={`w-[300px] flex-shrink-0 flex flex-col bg-transparent rounded-xl transition-colors duration-200 p-2 ${isDragOver ? 'bg-[#1e2128]/60' : ''}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="flex items-center space-x-2">
          <h3 className="text-white font-medium text-sm">{title}</h3>
          <span className="bg-[#2d3240] text-gray-300 text-xs px-2 py-0.5 rounded-full font-medium">
            {count ?? tasks.length}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3 min-h-[150px]">
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} onClick={onTaskClick} />
        ))}
        
        <button
          onClick={() => onAddCard && onAddCard(title)}
          className="w-full flex items-center justify-center py-2.5 border-2 border-dashed border-[#2d3240] rounded-xl text-gray-500 hover:text-gray-300 hover:border-gray-500 hover:bg-[#1e2128] transition-colors text-sm font-medium focus:outline-none"
        >
          <span>+</span>
          <span className="ml-2">Add card</span>
        </button>
      </div>
    </div>
  );
};
