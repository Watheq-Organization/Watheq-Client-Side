import { useState } from 'react';
import { SplashScreen } from './components/SplashScreen';
import { LoginScreen } from './components/LoginScreen';
import { SignupScreen } from './components/SignupScreen';
import { ContactScreen } from './components/ContactScreen';
import { PrivacyScreen } from './components/PrivacyScreen';
import { TermsScreen } from './components/TermsScreen';
import { DashboardLayout } from './components/DashboardLayout';
import { DashboardView } from './components/DashboardView';
import { SettingsView } from './components/SettingsView';
import { ClientsView } from './components/ClientsView';
import { ClientDetailView } from './components/ClientDetailView';
import { ScreenSwitcher } from './components/ScreenSwitcher';
import { ScreenType } from './components/Header';

export function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('clients');

  return (
    <div className="min-h-screen bg-slate-900 font-sans relative selection:bg-emerald-500 selection:text-white">
      {/* Floating Screen Switcher bar for quick toggling between all screens */}
      <ScreenSwitcher
        currentScreen={currentScreen}
        onChangeScreen={setCurrentScreen}
      />

      {/* Screen Render Switcher */}
      {currentScreen === 'splash' && (
        <SplashScreen
          onComplete={() => setCurrentScreen('login')}
          onNavigateLogin={() => setCurrentScreen('login')}
        />
      )}

      {currentScreen === 'login' && (
        <LoginScreen onNavigate={setCurrentScreen} />
      )}

      {currentScreen === 'signup' && (
        <SignupScreen onNavigate={setCurrentScreen} />
      )}

      {currentScreen === 'contact' && (
        <ContactScreen onNavigate={setCurrentScreen} />
      )}

      {currentScreen === 'privacy' && (
        <PrivacyScreen onNavigate={setCurrentScreen} />
      )}

      {currentScreen === 'terms' && (
        <TermsScreen onNavigate={setCurrentScreen} />
      )}

      {/* Dashboard Screen */}
      {currentScreen === 'dashboard' && (
        <DashboardLayout currentScreen={currentScreen} onNavigate={setCurrentScreen}>
          <DashboardView />
        </DashboardLayout>
      )}

      {/* Settings Screen */}
      {currentScreen === 'settings' && (
        <DashboardLayout currentScreen={currentScreen} onNavigate={setCurrentScreen}>
          <SettingsView />
        </DashboardLayout>
      )}

      {/* Clients List Screen */}
      {currentScreen === 'clients' && (
        <DashboardLayout currentScreen={currentScreen} onNavigate={setCurrentScreen}>
          <ClientsView onNavigate={setCurrentScreen} />
        </DashboardLayout>
      )}

      {/* Client Profile / Ledger Screen */}
      {currentScreen === 'client-detail' && (
        <DashboardLayout currentScreen={currentScreen} onNavigate={setCurrentScreen}>
          <ClientDetailView onNavigate={setCurrentScreen} />
        </DashboardLayout>
      )}
    </div>
  );
}

export default App;
