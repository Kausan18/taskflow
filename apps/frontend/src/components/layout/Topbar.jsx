// apps/frontend/src/components/layout/Topbar.jsx
// FIX: Removed unused `import React from 'react'`

export const Topbar = ({ title, tabs, activeTab, onTabChange, onNewTask }) => {
  return (
    <header className="h-16 px-6 flex items-center justify-between border-b border-[#2d3240] shrink-0 bg-[#1a1d23]">
      <h1 className="text-lg font-semibold text-white">{title}</h1>

      <div className="flex items-center space-x-4">
        {/* View Switcher Tabs */}
        {tabs && tabs.length > 0 && (
          <div className="flex items-center bg-[#13161c] rounded-lg p-1 border border-[#2d3240]">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => onTabChange && onTabChange(tab.value)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-[#2d3240] text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}

        {/* New Task / Primary Action Button */}
        {onNewTask && (
          <button
            onClick={onNewTask}
            className="bg-[#1a7a5e] hover:bg-[#14604a] text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a5e] focus:ring-offset-2 focus:ring-offset-[#1a1d23]"
          >
            + New Task
          </button>
        )}
      </div>
    </header>
  );
};