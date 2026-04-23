// apps/frontend/src/components/layout/PageWrapper.jsx
// FIX: Removed unused `import React from 'react'`

import { Sidebar } from './Sidebar.jsx';
import { Topbar } from './Topbar.jsx';

export const PageWrapper = ({
  children,
  title,
  tabs,
  activeTab,
  onTabChange,
  onNewTask,
}) => {
  return (
    <div className="flex h-screen w-full overflow-hidden text-white bg-[#13161c]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-[#13161c] overflow-hidden">
        <Topbar
          title={title}
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={onTabChange}
          onNewTask={onNewTask}
        />
        <main className="flex-1 overflow-hidden w-full relative">
          <div className="absolute inset-0 flex flex-col">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};