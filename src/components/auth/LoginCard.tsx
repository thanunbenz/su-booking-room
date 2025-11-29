'use client';

import { FormEvent } from 'react';
import GoogleIcon from '@/components/icons/GoogleIcon';

export default function LoginCard() {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Login submitted');
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
        <div>
          <label
            htmlFor="username"
            className="block text-gray-500 dark:text-gray-400 text-sm mb-1 pl-1"
          >
            Username or Email
          </label>
          <input
            type="text"
            id="username"
            name="username"
            placeholder="Username or Email"
            className="w-full bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-700 dark:focus:ring-teal-500 transition-all placeholder-gray-300 dark:placeholder-gray-500"
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
            placeholder="Password"
            className="w-full bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-700 dark:focus:ring-teal-500 transition-all placeholder-gray-300 dark:placeholder-gray-500"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-teal-700 hover:bg-teal-800 text-white font-medium rounded-xl py-3 transition-colors shadow-md"
        >
          Sign in
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
        <a
          href="/signup"
          className="text-teal-700 dark:text-teal-500 hover:text-teal-800 dark:hover:text-teal-600 font-medium ml-1"
        >
          Sign up
        </a>
      </div>
    </div>
  );
}
