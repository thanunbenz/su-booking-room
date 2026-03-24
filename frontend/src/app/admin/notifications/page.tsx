'use client';

import { useState, useEffect } from 'react';
import { FaBell, FaPaperPlane, FaServer, FaEnvelope, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { notificationApi } from '@/lib/api/client';
import { withRole } from '@/lib/withRole';
import type { NotificationSettings } from '@/lib/api/types';

function NotificationsSettingsPage() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingTest, setSendingTest] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testSubject, setTestSubject] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await notificationApi.getSettings();
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail) return;

    try {
      setSendingTest(true);
      setTestResult(null);
      await notificationApi.sendTestEmail({
        to: testEmail,
        subject: testSubject || undefined,
        message: testMessage || undefined,
      });
      setTestResult({ success: true, message: 'Test email queued successfully. Check the recipient inbox.' });
      setTestEmail('');
      setTestSubject('');
      setTestMessage('');
    } catch (error: any) {
      setTestResult({ success: false, message: error.error?.message || 'Failed to send test email' });
    } finally {
      setSendingTest(false);
    }
  };

  const templateLabels: Record<string, string> = {
    booking_created: 'Booking Created',
    booking_approved: 'Booking Approved',
    booking_rejected: 'Booking Rejected',
    booking_cancelled: 'Booking Cancelled',
    booking_reminder: 'Booking Reminder',
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <FaBell className="text-3xl text-teal-600 dark:text-teal-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Notification Settings
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Email service status, templates, and test email
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Email Service Status */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <div className="flex items-center gap-3 mb-4">
                <FaServer className="text-xl text-teal-600 dark:text-teal-400" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Email Service Status
                </h2>
              </div>

              {settings?.email_service ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Status</div>
                    <div className="flex items-center gap-2">
                      {settings.email_service.enabled ? (
                        <>
                          <FaCheckCircle className="text-green-500" />
                          <span className="text-green-700 dark:text-green-400 font-medium">Active</span>
                        </>
                      ) : (
                        <>
                          <FaTimesCircle className="text-red-500" />
                          <span className="text-red-700 dark:text-red-400 font-medium">Disabled</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Workers</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {settings.email_service.workers}
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Queue Usage</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {settings.email_service.queue_size} / {settings.email_service.queue_capacity}
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Queue Capacity</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {settings.email_service.queue_capacity}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">Unable to load email service status</p>
              )}
            </div>

            {/* Email Templates */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <div className="flex items-center gap-3 mb-4">
                <FaEnvelope className="text-xl text-teal-600 dark:text-teal-400" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Email Templates
                </h2>
              </div>

              {settings?.templates && settings.templates.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Template Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Event Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {settings.templates.map((template) => (
                        <tr key={template} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-mono text-gray-900 dark:text-white">
                              {template}.html
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {templateLabels[template] || template}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Available
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No email templates found</p>
              )}
            </div>

            {/* Send Test Email */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
              <div className="flex items-center gap-3 mb-4">
                <FaPaperPlane className="text-xl text-teal-600 dark:text-teal-400" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Send Test Email
                </h2>
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Send a test email to verify the SMTP configuration is working correctly.
              </p>

              <form onSubmit={handleSendTestEmail} className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Recipient Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="recipient@example.com"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Subject (optional)
                  </label>
                  <input
                    type="text"
                    value={testSubject}
                    onChange={(e) => setTestSubject(e.target.value)}
                    placeholder="Test Email from SU Booking Room"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Message (optional)
                  </label>
                  <textarea
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    placeholder="This is a test email to verify SMTP configuration."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-teal-500 dark:bg-gray-700 dark:text-white resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sendingTest || !settings?.email_service?.enabled}
                  className="flex items-center gap-2 px-6 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
                >
                  {sendingTest ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <FaPaperPlane />
                      <span>Send Test Email</span>
                    </>
                  )}
                </button>

                {!settings?.email_service?.enabled && (
                  <p className="text-sm text-red-500 dark:text-red-400">
                    Email service is disabled. Configure SMTP environment variables to enable.
                  </p>
                )}
              </form>

              {testResult && (
                <div className={`mt-4 p-4 rounded-lg border-l-4 ${
                  testResult.success
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-700 dark:text-green-400'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-400'
                }`}>
                  <div className="flex items-center gap-2">
                    {testResult.success ? <FaCheckCircle /> : <FaTimesCircle />}
                    <span className="text-sm font-medium">{testResult.message}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default withRole(NotificationsSettingsPage, ['admin']);
