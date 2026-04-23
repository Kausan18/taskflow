import React from 'react';
import { useTaskStore } from '../../stores/taskStore.js';

export const TaskFilters = () => {
  const filters = useTaskStore(state => state.filters);
  const setFilter = useTaskStore(state => state.setFilter);

  const clearFilters = () => {
    setFilter('status', '');
    setFilter('priority', '');
    setFilter('assigneeId', '');
  };

  const hasActiveFilters = filters.status || filters.priority || filters.assigneeId;

  return (
    <div className="flex items-center space-x-4 py-3 px-6 border-b border-[#2d3240] bg-[#1a1d23]">
      <div className="flex items-center space-x-3">
        <span className="text-sm text-gray-400 font-medium whitespace-nowrap">Filter by:</span>
        
        <select 
          value={filters.status} 
          onChange={(e) => setFilter('status', e.target.value)}
          className="bg-[#1e2128] border border-[#2d3240] text-gray-300 text-sm rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#6366f1]"
        >
          <option value="">All Statuses</option>
          <option value="To do">To do</option>
          <option value="In progress">In progress</option>
          <option value="In review">In review</option>
          <option value="Done">Done</option>
        </select>

        <select 
          value={filters.priority} 
          onChange={(e) => setFilter('priority', e.target.value)}
          className="bg-[#1e2128] border border-[#2d3240] text-gray-300 text-sm rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#6366f1]"
        >
          <option value="">All Priorities</option>
          <option value="High">High</option>
          <option value="Med">Medium</option>
          <option value="Low">Low</option>
        </select>

        <input 
          type="text" 
          value={filters.assigneeId} 
          onChange={(e) => setFilter('assigneeId', e.target.value)}
          placeholder="Assignee ID"
          className="bg-[#1e2128] border border-[#2d3240] text-gray-300 text-sm rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#6366f1] w-32"
        />

        <div className="flex items-center space-x-2 ml-4 border-l border-[#2d3240] pl-4">
            <span className="text-xs text-gray-500">Date from:</span>
            <input type="date" className="bg-[#1e2128] border border-[#2d3240] text-gray-400 text-xs rounded-md px-2 py-1 focus:outline-none" />
            <span className="text-xs text-gray-500">to</span>
            <input type="date" className="bg-[#1e2128] border border-[#2d3240] text-gray-400 text-xs rounded-md px-2 py-1 focus:outline-none" />
        </div>
      </div>

      {hasActiveFilters && (
        <button 
          onClick={clearFilters}
          className="text-xs text-[#6366f1] hover:text-[#818cf8] font-medium ml-4 focus:outline-none"
        >
          Clear filters
        </button>
      )}
    </div>
  );
};
