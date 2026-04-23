import React from 'react';

export const Topbar = ({ title, tabs, activeTab, onTabChange, onNewTask }) => {
  return (
    <header className="h-20 px-8 flex items-center justify-between border-b border-[#2d3240] shrink-0 bg-[#1a1d23]">
      <h1 className="text-2xl font-semibold text-white">{title}</h1>
      
      <div className="flex items-center space-x-6">
        {/* View Switcher Tabs */}
        {tabs && tabs.length > 0 && (
          <div className="flex items-center space-x-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => onTabChange && onTabChange(tab.value)}
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-[#2d3240] text-white border border-gray-600 shadow'
                      : 'bg-transparent text-gray-400 hover:text-gray-200 border border-transparent'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}

        {/* New Task Button */}
        {onNewTask && (
          <button
            onClick={onNewTask}
            className="bg-[#1a7a5e] hover:bg-[#14604a] text-white px-5 py-2.5 rounded-md text-sm font-medium transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a5e] focus:ring-offset-2 focus:ring-offset-[#1a1d23]"
          >
            + New Task
          </button>
        )}
      </div>
    </header>
  );
};
