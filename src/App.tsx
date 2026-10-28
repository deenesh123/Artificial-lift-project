import React, { useState, useEffect } from 'react';
import { PortalType, UserProfile, WellAsset } from './types';
import { DEMO_USERS } from './data/mockData';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { UserHeader } from './components/layout/UserHeader';
import { UserTopNav } from './components/layout/UserTopNav';
import { UserSidebar } from './components/layout/UserSidebar';
import { AssetMonitoringPanel } from './components/layout/AssetMonitoringPanel';
import { Breadcrumb } from './components/layout/Breadcrumb';
import { DemoNoticeBanner } from './components/layout/DemoNoticeBanner';
import { LoginScreen } from './components/auth/LoginScreen';
import { AccountPendingApproval } from './components/auth/AccountPendingApproval';
import { UnauthorizedAccess } from './components/auth/UnauthorizedAccess';
import { AuthService } from './services/authService';
import { StorageService } from './services/storageService';

// Admin & Shared Views
import { AdminOverview } from './views/admin/AdminOverview';
import { UserOperationsDashboard } from './views/user/UserOperationsDashboard';
import { UserAssetMonitoringView } from './views/user/UserAssetMonitoringView';
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
import { CableShopView } from './views/modules/CableShopView';
import { FailureMonitoringView } from './views/modules/FailureMonitoringView';
import { VehicleTrackingView } from './views/modules/VehicleTrackingView';
import { UserManagementView } from './views/modules/UserManagementView';
import { ReportsAnalyticsView } from './views/modules/ReportsAnalyticsView';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return Boolean(AuthService.getSession());
  });
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const session = AuthService.getSession();
    return session?.user || DEMO_USERS[0];
  });
  const [currentPortal, setCurrentPortal] = useState<PortalType>(() => {
    const session = AuthService.getSession();
    if (session?.user) {
      return session.user.defaultPortal || (session.user.allowedPortals.includes('admin') ? 'admin' : 'user');
    }
    return 'admin';
  });
  const [currentRoute, setCurrentRoute] = useState<string>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [userNavCollapsed, setUserNavCollapsed] = useState<boolean>(false);
  const [assetPanelCollapsed, setAssetPanelCollapsed] = useState<boolean>(false);
  const [activeField, setActiveField] = useState<string>('Permian Basin — Delaware North');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [globalNotice, setGlobalNotice] = useState<string | null>(null);

  // Selected Asset state for User Portal (PART 5 & 6)
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [wells, setWells] = useState<WellAsset[]>(() => StorageService.getWells());

  // Sync users & storage
  useEffect(() => {
    const handleUsersUpdate = () => {
      const session = AuthService.getSession();
      if (session) {
        const freshUsers = AuthService.getUsers();
        const updated = freshUsers.find(u => u.id === session.user.id);
        if (updated) {
          setCurrentUser(updated);
        }
      }
    };
    const handleStorageUpdate = () => {
      setWells(StorageService.getWells());
    };

    window.addEventListener('auth_users_update', handleUsersUpdate);
    window.addEventListener('storage', handleStorageUpdate);
    return () => {
      window.removeEventListener('auth_users_update', handleUsersUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, []);

  // Listen for direct URL navigation changes (e.g. #admin, #user, ?portal=admin)
  useEffect(() => {
    const handleHashOrUrl = () => {
      const hash = window.location.hash.toLowerCase();
      const urlParams = new URLSearchParams(window.location.search);
      const portalParam = urlParams.get('portal')?.toLowerCase();

      if (hash.startsWith('#admin') || portalParam === 'admin') {
        setCurrentPortal('admin');
        const routeMatch = hash.replace('#admin/', '').replace('#admin', '');
        if (routeMatch) setCurrentRoute(routeMatch);
      } else if (hash.startsWith('#user') || hash.startsWith('#operations') || portalParam === 'user') {
        setCurrentPortal('user');
        const routeMatch = hash.replace('#user/', '').replace('#user', '');
        if (routeMatch) setCurrentRoute(routeMatch || 'operations');
      }
    };

    if (window.location.hash || window.location.search) {
      handleHashOrUrl();
    }

    window.addEventListener('hashchange', handleHashOrUrl);
    return () => window.removeEventListener('hashchange', handleHashOrUrl);
  }, []);

  // Synchronize browser URL hash with current portal and route
  useEffect(() => {
    if (isAuthenticated) {
      const targetHash = `#${currentPortal}/${currentRoute}`;
      if (window.location.hash !== targetHash) {
        window.history.replaceState(null, '', targetHash);
      }
    }
  }, [currentPortal, currentRoute, isAuthenticated]);

  const selectedAsset = selectedAssetId 
    ? wells.find(w => w.id === selectedAssetId || w.wellCode === selectedAssetId) || null 
    : null;

  const showGlobalNotice = (msg: string) => {
    setGlobalNotice(msg);
    setTimeout(() => setGlobalNotice(null), 3500);
  };

  const handleLogin = (user: UserProfile) => {
    setCurrentUser(user);
    const targetPortal = user.defaultPortal || (user.allowedPortals.includes('admin') ? 'admin' : 'user');
    setCurrentPortal(targetPortal);
    setCurrentRoute(targetPortal === 'admin' ? 'overview' : 'operations');
    setIsAuthenticated(true);
    if (user.status !== 'pending_approval') {
      AuthService.saveSession(user);
    }
    showGlobalNotice(`Logged in as ${user.name} (${user.roleTitle})`);
  };

  const handleGoogleLoginSuccess = (user: UserProfile, isPending: boolean) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    if (!isPending && user.status !== 'pending_approval') {
      AuthService.saveSession(user);
      const targetPortal = user.defaultPortal || (user.allowedPortals.includes('admin') ? 'admin' : 'user');
      setCurrentPortal(targetPortal);
      setCurrentRoute(targetPortal === 'admin' ? 'overview' : 'operations');
      showGlobalNotice(`Authenticated via Google as ${user.name}`);
    } else {
      showGlobalNotice(`Google Account authenticated. Security role approval required.`);
    }
  };

  const handleLogout = () => {
    AuthService.clearSession();
    setIsAuthenticated(false);
    showGlobalNotice('Signed out of ALS enterprise session.');
  };

  const handleSelectPortal = (portal: PortalType) => {
    if (portal === 'admin' && !currentUser.allowedPortals?.includes('admin')) {
      showGlobalNotice(`Access Denied: ${currentUser.roleTitle} role is restricted from Admin Portal.`);
      return;
    }
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
    return (
      <LoginScreen 
        onLogin={handleLogin} 
        onGoogleLoginSuccess={handleGoogleLoginSuccess} 
      />
    );
  }

  // Handle unapproved pending accounts
  if (currentUser?.status === 'pending_approval') {
    return (
      <AccountPendingApproval
        user={currentUser}
        onSignOut={handleLogout}
        onApproved={(approvedUser) => {
          handleLogin(approvedUser);
        }}
      />
    );
  }

  // Security Gate: Non-admin users cannot access Admin Portal by URL hash or direct parameter
  if (currentPortal === 'admin' && !currentUser.allowedPortals?.includes('admin')) {
    return (
      <UnauthorizedAccess
        currentUser={currentUser}
        attemptedPortal="Admin Portal"
        onReturnToUserPortal={() => handleSelectPortal('user')}
        onSignOut={handleLogout}
      />
    );
  }

  // Render Admin Portal View Content
  const renderAdminView = () => {
    // 403 Forbidden Gate for non-admin accounts
    if (!currentUser.allowedPortals?.includes('admin')) {
      return (
        <UnauthorizedAccess
          currentUser={currentUser}
          attemptedPortal="Admin Portal"
          onReturnToUserPortal={() => handleSelectPortal('user')}
          onSignOut={handleLogout}
        />
      );
    }

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
  };

  // Render User Portal View Content (PART 4 & 6)
  const renderUserView = () => {
    switch (currentRoute) {
      case 'operations':
        return (
          <UserOperationsDashboard
            onNavigateToRoute={handleSelectRoute}
            selectedAssetId={selectedAssetId}
            onSelectAssetId={setSelectedAssetId}
          />
        );
      case 'asset-monitoring-user':
        return (
          <UserAssetMonitoringView 
            selectedAssetId={selectedAssetId}
            onSelectAssetId={(id) => {
              setSelectedAssetId(id);
              if (id) {
                const w = wells.find(item => item.id === id || item.wellCode === id);
                showGlobalNotice(`Focused telemetry on asset ${w?.wellCode || id} (${w?.name || 'Well'}).`);
              } else {
                showGlobalNotice('Returned to All Monitored Assets Overview');
              }
            }}
            onNavigateToRoute={handleSelectRoute}
          />
        );
      case 'scada-user':
        return <ScadaDashboardView selectedAssetId={selectedAssetId} onSelectAssetId={setSelectedAssetId} />;
      case 'digital-twin-user':
        return <DigitalTwinView selectedAssetId={selectedAssetId} onSelectAssetId={setSelectedAssetId} />;
      case 'esp-user':
        return <EspMonitoringView selectedAssetId={selectedAssetId} onSelectAssetId={setSelectedAssetId} />;
      case 'pump-user':
        return <PumpDashboardView selectedAssetId={selectedAssetId} onSelectAssetId={setSelectedAssetId} />;
      case 'alarms-user':
        return <AlarmCenterView selectedAssetId={selectedAssetId} onSelectAssetId={setSelectedAssetId} />;
      case 'events-user':
        return <EventCenterView selectedAssetId={selectedAssetId} onSelectAssetId={setSelectedAssetId} />;
      case 'failure-monitoring-user':
        return <FailureMonitoringView selectedAssetId={selectedAssetId} onSelectAssetId={setSelectedAssetId} />;
      case 'workflows-user':
        return <JobWorkflowsView selectedAssetId={selectedAssetId} onSelectAssetId={setSelectedAssetId} />;
      case 'cable-shop-user':
        return <CableShopView selectedAssetId={selectedAssetId} onSelectAssetId={setSelectedAssetId} />;
      case 'fleet-user':
        return <VehicleTrackingView />;
      case 'reports-user':
        return <ReportsAnalyticsView selectedAssetId={selectedAssetId} onSelectAssetId={setSelectedAssetId} />;
      default:
        return (
          <UserOperationsDashboard
            onNavigateToRoute={handleSelectRoute}
            selectedAssetId={selectedAssetId}
            onSelectAssetId={setSelectedAssetId}
          />
        );
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

      {/* ======================================================== */}
      {/* ADMIN PORTAL EXPERIENCE (Preserved 100% - PART 21)       */}
      {/* ======================================================== */}
      {currentPortal === 'admin' ? (
        <>
          {/* Admin Header */}
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

          <div className="flex-1 flex overflow-hidden">
            {/* Admin Persistent Sidebar */}
            <Sidebar
              currentPortal={currentPortal}
              currentRoute={currentRoute}
              onSelectRoute={handleSelectRoute}
              collapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
              onLogout={handleLogout}
            />

            {/* Admin Main Viewport */}
            <main className="flex-1 overflow-y-auto bg-slate-950 flex flex-col">
              <Breadcrumb
                currentPortal={currentPortal}
                currentRoute={currentRoute}
                onRefresh={handleRefresh}
                onExport={handleExport}
              />
              <div className="flex-1 pb-12">
                {renderAdminView()}
              </div>
            </main>
          </div>
        </>
      ) : (
        /* ======================================================== */
        /* USER PORTAL EXPERIENCE (Dedicated Layout - PART 4 & 5)   */
        /* ======================================================== */
        <>
          {/* Dedicated User Portal Header */}
          <UserHeader
            currentUser={currentUser}
            selectedAsset={selectedAsset}
            onClearSelectedAsset={() => setSelectedAssetId(null)}
            onSelectPortal={currentUser.allowedPortals?.includes('admin') ? handleSelectPortal : undefined}
            onLogout={handleLogout}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onNavigateToRoute={handleSelectRoute}
          />

          {/* Dedicated Horizontal Module Navigation Bar with Icons & Categories */}
          <UserTopNav
            currentRoute={currentRoute}
            onSelectRoute={handleSelectRoute}
            selectedAsset={selectedAsset}
            onClearSelectedAsset={() => setSelectedAssetId(null)}
            onSelectAssetId={(id) => setSelectedAssetId(id)}
          />

          {/* User Portal 2-Column Layout below UserTopNav: Left well selector + Right module workspace */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Column: Persistent Collapsible Well/Asset Selector (PART A) */}
            <AssetMonitoringPanel
              wells={wells}
              selectedAssetId={selectedAssetId}
              onSelectAsset={(w) => {
                const newId = w ? w.id : null;
                setSelectedAssetId(newId);
                if (w) {
                  showGlobalNotice(`Focused workspace on ${w.wellCode || w.id} (${w.name})`);
                } else {
                  showGlobalNotice('Field-Wide View Active — All 20 Wells Monitored');
                }
              }}
              collapsed={assetPanelCollapsed}
              onToggleCollapse={() => setAssetPanelCollapsed(!assetPanelCollapsed)}
            />

            {/* Right Column: Active Module Workspace */}
            <main className="flex-1 overflow-y-auto bg-slate-950 flex flex-col min-w-0">
              {/* Selected Well Heading Banner (PART A) */}
              {selectedAsset && (
                <div className="bg-slate-900/95 border-b border-cyan-500/30 px-6 py-3.5 shrink-0 flex flex-wrap items-center justify-between gap-4 shadow-lg backdrop-blur">
                  <div className="flex items-center gap-3">
                    <div className={`w-3.5 h-3.5 rounded-full ${
                      selectedAsset.status === 'Nominal' ? 'bg-emerald-400 animate-pulse' :
                      selectedAsset.status === 'Warning' ? 'bg-amber-400' : 'bg-rose-500'
                    }`} />
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-sm text-cyan-300 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">
                          {selectedAsset.wellCode || selectedAsset.id}
                        </span>
                        <span className="text-slate-500">·</span>
                        <h2 className="text-sm font-bold text-white tracking-wide">{selectedAsset.name}</h2>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          selectedAsset.status === 'Nominal' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                          selectedAsset.status === 'Warning' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                          'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}>
                          {selectedAsset.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-slate-400 font-mono mt-1">
                        <span>Pad: <strong className="text-slate-200">{selectedAsset.padName}</strong></span>
                        <span className="text-slate-600">·</span>
                        <span>ESP S/N: <strong className="text-cyan-400">{selectedAsset.espSerialNumber || 'ESP-2026-X89'}</strong></span>
                        <span className="text-slate-600">·</span>
                        <span>Freq: <strong className="text-cyan-300">{selectedAsset.vfdFrequencyHz || 58.5} Hz</strong></span>
                        <span className="text-slate-600">·</span>
                        <span>Production: <strong className="text-emerald-400">{selectedAsset.currentBopd || 0} BPD</strong></span>
                        <span className="text-slate-600">·</span>
                        <span>PIP: <strong className="text-blue-300">{selectedAsset.intakePressurePsi} psi</strong></span>
                        <span className="text-slate-600">·</span>
                        <span>Motor Temp: <strong className={(selectedAsset.motorTempF || 0) > 225 ? 'text-rose-400' : 'text-slate-200'}>{selectedAsset.motorTempF}°F</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedAssetId(null);
                        showGlobalNotice('Field-Wide View Active — All 20 Wells Monitored');
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-semibold shadow-sm transition-colors"
                      title="Clear asset selection and view field-wide telemetry"
                    >
                      <span>✕ Clear Selection / View All Wells</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="flex-1 pb-12">
                {renderUserView()}
              </div>
            </main>
          </div>
        </>
      )}
    </div>
  );
}
