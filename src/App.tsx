import { useState } from 'react';
import { SplashScreen } from './components/SplashScreen';
import { LoginScreen } from './components/LoginScreen';
import { SignupScreen } from './components/SignupScreen';
import { ForgotPasswordScreen } from './components/ForgotPasswordScreen';
import { ContactScreen } from './components/ContactScreen';
import { PrivacyScreen } from './components/PrivacyScreen';
import { TermsScreen } from './components/TermsScreen';
import { DashboardLayout } from './components/DashboardLayout';
import { DashboardView } from './components/DashboardView';
import { SettingsView } from './components/SettingsView';
import { ClientsView } from './components/ClientsView';
import { ClientDetailView } from './components/ClientDetailView';
import { AddDebtView } from './components/AddDebtView';
import { RecordPaymentView } from './components/RecordPaymentView';
import { ScreenSwitcher } from './components/ScreenSwitcher';
import { ScreenType } from './components/Header';
import { Client } from './types/client';
import { INITIAL_CLIENTS } from './data/mockClients';

export function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('clients');
  const [clients, setClients] = useState<Client[]>(INITIAL_CLIENTS);
  const [selectedClientId, setSelectedClientId] = useState<string>(INITIAL_CLIENTS[0].id);

  const selectedClient = clients.find(c => c.id === selectedClientId) || clients[0];

  const handleSelectClient = (client: Client) => {
    setSelectedClientId(client.id);
  };

  const handleAddClient = (newClient: Client) => {
    setClients(prev => [newClient, ...prev]);
    setSelectedClientId(newClient.id);
  };

  const handleUpdateClient = (updatedClient: Client) => {
    setClients(prev => prev.map(c => c.id === updatedClient.id ? updatedClient : c));
  };

  const handleAddDebt = ({
    clientId,
    clientName,
    amount,
    dueDate,
    notes,
  }: {
    clientId: string;
    clientName: string;
    amount: number;
    dueDate: string;
    notes: string;
    sendWhatsapp: boolean;
  }) => {
    setClients(prev => {
      const existing = prev.find(c => c.id === clientId);
      if (existing) {
        const currentDebtNum = parseFloat(String(existing.debt).replace(/,/g, '')) || 0;
        const newDebtNum = currentDebtNum + amount;
        const newTx = {
          id: `t-${Date.now()}`,
          type: 'debt' as const,
          title: `إضافة دين جديد - فاتورة #${Math.floor(1000 + Math.random() * 9000)}`,
          amount: `+${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          amountColor: 'text-rose-600',
          desc: notes || 'تسجيل مديونية جديدة على الحساب.',
          date: 'اليوم',
          status: 'غير مدفوع',
          badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
        };

        return prev.map(c => c.id === clientId ? {
          ...c,
          debt: newDebtNum.toLocaleString(undefined, { minimumFractionDigits: 2 }),
          dueDate: dueDate || c.dueDate,
          status: 'active' as const,
          statusText: 'دين نشط',
          statusColor: 'bg-blue-50 text-blue-700 border-blue-200',
          transactions: [newTx, ...(c.transactions || [])],
        } : c);
      } else {
        const newClient: Client = {
          id: clientId,
          name: clientName,
          type: 'عميل أفراد',
          initial: clientName.charAt(0),
          avatarColor: 'bg-teal-600 text-white',
          idNum: `10${Math.floor(10000000 + Math.random() * 90000000)}`,
          phone: '+966 50 000 0000',
          registeredDate: 'اليوم',
          debt: amount.toLocaleString(undefined, { minimumFractionDigits: 2 }),
          dueDate: dueDate || 'بعد شهر',
          status: 'active',
          statusText: 'دين نشط',
          statusColor: 'bg-blue-50 text-blue-700 border-blue-200',
          transactions: [{
            id: `t-${Date.now()}`,
            type: 'debt',
            title: `إضافة دين جديد - فاتورة #${Math.floor(1000 + Math.random() * 9000)}`,
            amount: `+${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            amountColor: 'text-rose-600',
            desc: notes || 'تسجيل مديونية جديدة على الحساب.',
            date: 'اليوم',
            status: 'غير مدفوع',
            badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
          }]
        };
        return [newClient, ...prev];
      }
    });
  };

  const handleRecordPayment = ({
    clientId,
    amount,
    notes,
  }: {
    clientId: string;
    clientName: string;
    amount: number;
    paymentDate: string;
    paymentMethod: 'cash' | 'bank' | 'wallet';
    notes: string;
  }) => {
    setClients(prev => {
      return prev.map(c => {
        if (c.id === clientId) {
          const currentDebtNum = parseFloat(String(c.debt).replace(/,/g, '')) || 0;
          const newDebtNum = Math.max(0, currentDebtNum - amount);
          const newTx = {
            id: `t-${Date.now()}`,
            type: 'payment' as const,
            title: `استلام دفعة سداد`,
            amount: `-${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            amountColor: 'text-emerald-600',
            desc: notes || 'دفعة نقدية مسددة لحساب المديونية.',
            date: 'اليوم',
            status: 'مؤكدة',
            badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          };

          return {
            ...c,
            debt: newDebtNum.toLocaleString(undefined, { minimumFractionDigits: 2 }),
            lastPayment: `${amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} ر.س`,
            status: newDebtNum > 0 ? c.status : 'paid',
            statusText: newDebtNum > 0 ? c.statusText : 'تم السداد',
            statusColor: newDebtNum > 0 ? c.statusColor : 'bg-emerald-50 text-emerald-700 border-emerald-200',
            transactions: [newTx, ...(c.transactions || [])],
          };
        }
        return c;
      });
    });
  };

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

      {currentScreen === 'forgot-password' && (
        <ForgotPasswordScreen onNavigate={setCurrentScreen} />
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
          <ClientsView 
            onNavigate={setCurrentScreen}
            clients={clients}
            onSelectClient={handleSelectClient}
            onAddClient={handleAddClient}
          />
        </DashboardLayout>
      )}

      {/* Client Profile / Ledger Screen */}
      {currentScreen === 'client-detail' && (
        <DashboardLayout currentScreen={currentScreen} onNavigate={setCurrentScreen}>
          <ClientDetailView 
            onNavigate={setCurrentScreen}
            client={selectedClient}
            onUpdateClient={handleUpdateClient}
          />
        </DashboardLayout>
      )}

      {/* Add New Debt Screen */}
      {currentScreen === 'add-debt' && (
        <DashboardLayout currentScreen={currentScreen} onNavigate={setCurrentScreen}>
          <AddDebtView 
            onNavigate={setCurrentScreen}
            clients={clients}
            selectedClient={selectedClient}
            onSelectClient={handleSelectClient}
            onAddDebt={handleAddDebt}
          />
        </DashboardLayout>
      )}

      {/* Record New Payment Screen */}
      {currentScreen === 'record-payment' && (
        <DashboardLayout currentScreen={currentScreen} onNavigate={setCurrentScreen}>
          <RecordPaymentView 
            onNavigate={setCurrentScreen}
            clients={clients}
            selectedClient={selectedClient}
            onSelectClient={handleSelectClient}
            onRecordPayment={handleRecordPayment}
          />
        </DashboardLayout>
      )}
    </div>
  );
}

export default App;
