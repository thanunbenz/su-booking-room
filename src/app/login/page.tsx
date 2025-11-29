import LoginNavbar from '@/components/auth/LoginNavbar';
import LoginCard from '@/components/auth/LoginCard';

export default function LoginPage() {
  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen flex flex-col">
      <LoginNavbar />

      <div className="grow flex items-center justify-center p-4">
        <LoginCard />
      </div>
    </div>
  );
}
