'use client';

import { FormEvent } from 'react';

export default function LoginCard() {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Login submitted');
  };

  const handleSSOSignIn = () => {
    console.log('Google sign in clicked');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl w-full max-w-[530px] p-8 sm:p-10 border border-gray-100 dark:border-gray-700">

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
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          ></path>
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          ></path>
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          ></path>
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          ></path>
        </svg>
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
