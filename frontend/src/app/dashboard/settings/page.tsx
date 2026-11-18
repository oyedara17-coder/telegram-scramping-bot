import DashboardLayout from '@/components/DashboardLayout';
import AdminConsole from '@/components/AdminConsole';

export default function SettingsPage() {
  return <DashboardLayout><AdminConsole initialTab="settings" /></DashboardLayout>;
}
