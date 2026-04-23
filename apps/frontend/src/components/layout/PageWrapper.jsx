import React from 'react';
import { Sidebar } from './Sidebar.jsx';
import { Topbar } from './Topbar.jsx';

export const PageWrapper = ({
  children,
  title,
  tabs,
  activeTab,
  onTabChange,
  onNewTask
}) => {
  return (
    <div className="flex h-screen w-full overflow-hidden text-white bg-[#13161c]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-[#13161c]">
        {/* Topbar only renders if title or any Topbar items are provided, but can stay persistent if desired. We will render it unconditionally keeping with UI standard */}
        <Topbar
          title={title}
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={onTabChange}
          onNewTask={onNewTask}
        />
        <main className="flex-1 overflow-y-auto w-full relative">
          <div className="absolute inset-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
