// apps/frontend/src/components/tasks/TaskFilters.jsx
// FIX: Removed unused `import React from 'react'`

import { useTaskStore } from '../../stores/taskStore.js';

export const TaskFilters = () => {
  const filters    = useTaskStore(state => state.filters);
  const setFilter  = useTaskStore(state => state.setFilter);

  const clearFilters = () => {
    setFilter('status', '');
    setFilter('priority', '');
    setFilter('assigneeId', '');
  };

  const hasActiveFilters = filters.status || filters.priority || filters.assigneeId;

  return (
    <div className="flex items-center flex-wrap gap-3 py-2.5 px-6 border-b border-[#2d3240] bg-[#1a1d23] shrink-0">
      <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Filter:</span>

      <select
        value={filters.status}
        onChange={(e) => setFilter('status', e.target.value)}
        className="bg-[#13161c] border border-[#2d3240] text-gray-300 text-xs rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#6366f1] focus:border-[#6366f1]"
      >
        <option value="">All statuses</option>
        <option value="To do">To do</option>
        <option value="In progress">In progress</option>
        <option value="In review">In review</option>
        <option value="Done">Done</option>
      </select>

      <select
        value={filters.priority}
        onChange={(e) => setFilter('priority', e.target.value)}
        className="bg-[#13161c] border border-[#2d3240] text-gray-300 text-xs rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#6366f1] focus:border-[#6366f1]"
      >
        <option value="">All priorities</option>
        <option value="High">High</option>
        <option value="Med">Medium</option>
        <option value="Low">Low</option>
      </select>

      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="text-xs text-[#6366f1] hover:text-[#818cf8] font-medium transition-colors focus:outline-none"
        >
          Clear filters
        </button>
      )}

      {/* Active filter chips */}
      {filters.status && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-[#2d3240] text-gray-300 border border-[#3d4255]">
          {filters.status}
          <button onClick={() => setFilter('status', '')} className="ml-1.5 text-gray-500 hover:text-white">×</button>
        </span>
      )}
      {filters.priority && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-[#2d3240] text-gray-300 border border-[#3d4255]">
          {filters.priority}
          <button onClick={() => setFilter('priority', '')} className="ml-1.5 text-gray-500 hover:text-white">×</button>
        </span>
      )}
    </div>
  );
};