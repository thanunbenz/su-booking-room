'use client';

import { FormEvent, useState, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import GoogleIcon from '@/components/icons/GoogleIcon';
import Link from 'next/link';

export default function LoginCard() {
  const { login } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(formData.email, formData.password);
      router.push('/'); // Redirect to home page after successful login
    } catch (err: any) {
      // Handle different types of errors
      if (err?.error?.code === 'INVALID_CREDENTIALS') {
        setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
      } else if (err?.message?.includes('fetch') || err?.message?.includes('Failed to fetch')) {
        setError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง');
      } else {
        setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSSOSignIn = () => {
    console.log('Google sign in clicked');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-4xl shadow-xl w-full max-w-[600px] p-8 sm:p-10 border border-gray-100 dark:border-gray-700">

      <div className="flex justify-center mb-8">
        <div className="w-32 h-32 flex items-center justify-center text-black dark:text-white font-bold text-xl bg-white dark:bg-gray-800">
          LOGO
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="block text-gray-500 dark:text-gray-400 text-sm mb-1 pl-1"
          >
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="your.email@silpakorn.edu"
            className="w-full bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-700 dark:focus:ring-teal-500 transition-all placeholder-gray-300 dark:placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
            required
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-gray-500 dark:text-gray-400 text-sm mb-1 pl-1"
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            placeholder="Password"
            className="w-full bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-700 dark:focus:ring-teal-500 transition-all placeholder-gray-300 dark:placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
            required
          />
          <div className='mt-2 flex justify-end'>
            <Link href={"/forgetpassword"} className='underline text-teal-700 hover:text-teal-800 dark:text-teal-500 dark:hover:text-teal-600 text-sm'>ลืมรหัสผ่าน ?</Link>
          </div>
        </div>


        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-teal-700 hover:bg-teal-800 disabled:bg-teal-600 disabled:cursor-not-allowed text-white font-medium rounded-xl py-3 transition-colors shadow-md flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              กำลังเข้าสู่ระบบ...
            </>
          ) : (
            'เข้าสู่ระบบ'
          )}
        </button>
      </form>

      <div className="relative flex py-6 items-center">
        <div className="grow border-t border-teal-700 dark:border-teal-500"></div>
        <span className="shrink-0 mx-4 text-gray-600 dark:text-gray-400 text-sm">OR</span>
        <div className="grow border-t border-teal-700 dark:border-teal-500"></div>
      </div>

      <button
        type="button"
        onClick={handleSSOSignIn}
        className="w-full bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-xl py-3 flex items-center justify-center gap-3 transition-colors shadow-sm"
      >
        <GoogleIcon />
        <span className="text-sm font-medium">Sign in with SU Account</span>
      </button>


      <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
        Don&apos;t have an account?
        <Link
          href="/signup"
          className="text-teal-700 dark:text-teal-500 hover:text-teal-800 dark:hover:text-teal-600 font-medium ml-1"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}
