import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";

export function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className="leirisonda-layout">
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

      <div className="lg:ml-72">
        <main className="leirisonda-main">
          <div className="w-full">
            <div className="animate-leirisonda-fade">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
