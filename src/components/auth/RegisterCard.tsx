'use client';

import { FormEvent } from 'react';
import Link from 'next/link';

export default function RegisterCard() {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Registration submitted');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-4xl shadow-xl w-full max-w-[600px] p-8 sm:p-12 border border-gray-100 dark:border-gray-700">


      <div className="flex justify-center mb-8">
        <div className="w-32 h-32 flex items-center justify-center text-black dark:text-white font-bold text-xl bg-white dark:bg-gray-800">
          LOGO
        </div>
      </div>


      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 mb-8">
          <div className="flex flex-col">
            <label htmlFor="username" className="mb-2 text-gray-600 dark:text-gray-400 text-sm font-medium">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              placeholder="Username"
              className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-700 dark:focus:ring-teal-500 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
              required
            />
          </div>

          <div className="flex flex-col">
            <label htmlFor="email" className="mb-2 text-gray-600 dark:text-gray-400 text-sm font-medium">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Email"
              className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-700 dark:focus:ring-teal-500 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
              required
            />
          </div>

          {/* First Name */}
          <div className="flex flex-col">
            <label htmlFor="firstname" className="mb-2 text-gray-600 dark:text-gray-400 text-sm font-medium">
              First Name
            </label>
            <input
              type="text"
              id="firstname"
              name="firstname"
              placeholder="First Name"
              className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-700 dark:focus:ring-teal-500 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
              required
            />
          </div>

          {/* Last Name */}
          <div className="flex flex-col">
            <label htmlFor="lastname" className="mb-2 text-gray-600 dark:text-gray-400 text-sm font-medium">
              Last Name
            </label>
            <input
              type="text"
              id="lastname"
              name="lastname"
              placeholder="Last Name"
              className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-700 dark:focus:ring-teal-500 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
              required
            />
          </div>

          {/* Password */}
          <div className="flex flex-col">
            <label htmlFor="password" className="mb-2 text-gray-600 dark:text-gray-400 text-sm font-medium">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Password"
              className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-700 dark:focus:ring-teal-500 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
              required
            />
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col">
            <label htmlFor="confirmpassword" className="mb-2 text-gray-600 dark:text-gray-400 text-sm font-medium">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmpassword"
              name="confirmpassword"
              placeholder="Confirm Password"
              className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-700 dark:focus:ring-teal-500 placeholder-gray-400 dark:placeholder-gray-500 transition-all"
              required
            />
          </div>

        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-teal-700 hover:bg-teal-800 text-white font-semibold py-3 rounded-lg transition-colors duration-300 mb-6 shadow-md"
        >
          Sign up
        </button>

        {/* Sign In Link */}
        <div className="text-center text-gray-500 dark:text-gray-400 text-sm">
          Have an account?
          <Link
            href="/login"
            className="text-teal-700 dark:text-teal-500 hover:text-teal-800 dark:hover:text-teal-600 font-medium ml-1 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </form>
    </div>
  );
}
