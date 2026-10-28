import React, { useState } from 'react';
import { PortalType, UserProfile } from './types';
import { DEMO_USERS } from './data/mockData';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { Breadcrumb } from './components/layout/Breadcrumb';
import { DemoNoticeBanner } from './components/layout/DemoNoticeBanner';
import { LoginScreen } from './components/auth/LoginScreen';

// Views
import { AdminOverview } from './views/admin/AdminOverview';
import { UserOperationsDashboard } from './views/user/UserOperationsDashboard';
import { AssetManagementView } from './views/modules/AssetManagementView';
import { DeviceManagementView } from './views/modules/DeviceManagementView';
import { DeviceMonitoringView } from './views/modules/DeviceMonitoringView';
import { ScadaManagementView } from './views/modules/ScadaManagementView';
import { ScadaDashboardView } from './views/modules/ScadaDashboardView';
import { DigitalTwinManagementView } from './views/modules/DigitalTwinManagementView';
import { DigitalTwinView } from './views/modules/DigitalTwinView';
import { EspManagementView } from './views/modules/EspManagementView';
import { EspMonitoringView } from './views/modules/EspMonitoringView';
import { PumpDashboardView } from './views/modules/PumpDashboardView';
import { AlarmCenterView } from './views/modules/AlarmCenterView';
import { EventCenterView } from './views/modules/EventCenterView';
import { JobWorkflowsView } from './views/modules/JobWorkflowsView';
import { FailureMonitoringView } from './views/modules/FailureMonitoringView';
import { VehicleTrackingView } from './views/modules/VehicleTrackingView';
import { UserManagementView } from './views/modules/UserManagementView';
import { ReportsAnalyticsView } from './views/modules/ReportsAnalyticsView';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<UserProfile>(DEMO_USERS[0]);
  const [currentPortal, setCurrentPortal] = useState<PortalType>('admin');
  const [currentRoute, setCurrentRoute] = useState<string>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [activeField, setActiveField] = useState<string>('Permian Basin — Delaware North');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [globalNotice, setGlobalNotice] = useState<string | null>(null);

  const showGlobalNotice = (msg: string) => {
    setGlobalNotice(msg);
    setTimeout(() => setGlobalNotice(null), 3500);
  };

  const handleLogin = (user: UserProfile) => {
    setCurrentUser(user);
    setCurrentPortal(user.defaultPortal);
    setCurrentRoute(user.defaultPortal === 'admin' ? 'overview' : 'operations');
    setIsAuthenticated(true);
    showGlobalNotice(`Logged in as ${user.name} (${user.roleTitle})`);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  const handleSelectPortal = (portal: PortalType) => {
    setCurrentPortal(portal);
    if (portal === 'admin') {
      setCurrentRoute('overview');
    } else {
      setCurrentRoute('operations');
    }
    showGlobalNotice(`Switched to ${portal === 'admin' ? 'Admin Portal' : 'User Operations Portal'}`);
  };

  const handleSelectRoute = (routeId: string) => {
    setCurrentRoute(routeId);
  };

  const handleRefresh = () => {
    showGlobalNotice('Polled live simulated SCADA registers across all basin pads.');
  };

  const handleExport = () => {
    showGlobalNotice('Exported operational view dataset to CSV.');
  };

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // Render content based on currentPortal and currentRoute
  const renderViewContent = () => {
    if (currentPortal === 'admin') {
      switch (currentRoute) {
        case 'overview':
          return <AdminOverview onNavigateToRoute={handleSelectRoute} />;
        case 'assets':
          return <AssetManagementView />;
        case 'devices':
          return <DeviceManagementView />;
        case 'scada-admin':
          return <ScadaManagementView />;
        case 'digital-twin-admin':
          return <DigitalTwinManagementView />;
        case 'esp-admin':
          return <EspManagementView />;
        case 'pump-admin':
          return <PumpDashboardView />;
        case 'alarms-admin':
          return <AlarmCenterView />;
        case 'events-admin':
          return <EventCenterView />;
        case 'workflows':
          return <JobWorkflowsView />;
        case 'failure-monitoring-admin':
          return <FailureMonitoringView />;
        case 'fleet':
          return <VehicleTrackingView />;
        case 'users':
          return <UserManagementView onSwitchUser={(u) => { setCurrentUser(u); showGlobalNotice(`Active user set to ${u.name}`); }} />;
        case 'reports-admin':
          return <ReportsAnalyticsView />;
        default:
          return <AdminOverview onNavigateToRoute={handleSelectRoute} />;
      }
    } else {
      // User Portal
      switch (currentRoute) {
        case 'operations':
          return <UserOperationsDashboard onNavigateToRoute={handleSelectRoute} />;
        case 'devices-user':
          return <DeviceMonitoringView />;
        case 'scada-user':
          return <ScadaDashboardView />;
        case 'digital-twin-user':
          return <DigitalTwinView />;
        case 'esp-user':
          return <EspMonitoringView />;
        case 'pump-user':
          return <PumpDashboardView />;
        case 'alarms-user':
          return <AlarmCenterView />;
        case 'events-user':
          return <EventCenterView />;
        case 'workflows-user':
          return <JobWorkflowsView />;
        case 'failure-monitoring-user':
          return <FailureMonitoringView />;
        case 'fleet-user':
          return <VehicleTrackingView />;
        case 'reports-user':
          return <ReportsAnalyticsView />;
        default:
          return <UserOperationsDashboard onNavigateToRoute={handleSelectRoute} />;
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Banner Notice */}
      <DemoNoticeBanner />

      {/* Global Toast */}
      {globalNotice && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 border border-cyan-500/50 text-cyan-300 px-4 py-2.5 rounded-lg text-xs shadow-2xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>{globalNotice}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <Header
        currentPortal={currentPortal}
        onSelectPortal={handleSelectPortal}
        currentUser={currentUser}
        onChangeUser={(user) => {
          setCurrentUser(user);
          showGlobalNotice(`Switched persona to ${user.name} (${user.roleTitle})`);
        }}
        onLogout={handleLogout}
        activeField={activeField}
        onChangeField={(field) => {
          setActiveField(field);
          showGlobalNotice(`Switched operational field to ${field}`);
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNavigateToRoute={handleSelectRoute}
      />

      {/* Body with Persistent Sidebar and Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Persistent Left Sidebar */}
        <Sidebar
          currentPortal={currentPortal}
          currentRoute={currentRoute}
          onSelectRoute={handleSelectRoute}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Main Viewport */}
        <main className="flex-1 overflow-y-auto bg-slate-950 flex flex-col">
          {/* Breadcrumb Bar */}
          <Breadcrumb
            currentPortal={currentPortal}
            currentRoute={currentRoute}
            onRefresh={handleRefresh}
            onExport={handleExport}
          />

          {/* View Content */}
          <div className="flex-1 pb-12">
            {renderViewContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
