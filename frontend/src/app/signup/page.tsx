import LoginNavbar from '@/components/auth/LoginNavbar';
import RegisterCard from '@/components/auth/RegisterCard';

export default function SignupPage() {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen flex flex-col">
      <LoginNavbar />

      <div className="flex-grow flex items-center justify-center p-4 sm:p-8">
        <RegisterCard />
      </div>
    </div>
  );
}
