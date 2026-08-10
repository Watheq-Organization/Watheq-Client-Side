import { useState } from 'react';
import { SplashScreen } from './components/SplashScreen';
import { LoginScreen } from './components/LoginScreen';
import { SignupScreen } from './components/SignupScreen';
import { ContactScreen } from './components/ContactScreen';
import { PrivacyScreen } from './components/PrivacyScreen';
import { TermsScreen } from './components/TermsScreen';
import { ScreenSwitcher } from './components/ScreenSwitcher';
import { ScreenType } from './components/Header';

export function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('contact');

  return (
    <div className="min-h-screen bg-slate-900 font-sans relative selection:bg-emerald-500 selection:text-white">
      {/* Floating Screen Switcher bar for quick toggling between all 6 screens */}
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
    </div>
  );
}

export default App;
