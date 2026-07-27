import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Bell, Send, CheckCircle2, AlertCircle, Shield } from 'lucide-react';

export const NotificationSettingsView: React.FC = () => {
  const [slackWebhook, setSlackWebhook] = useState('');
  const [telegramToken, setTelegramToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const testSlackMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/v1/notifications/test-slack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookUrl: slackWebhook, message: 'Test notification from Job Monitor V1.1' }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Slack test failed');
      return json;
    },
    onSuccess: () => {
      setTestResult({ success: true, message: 'Slack test alert successfully dispatched!' });
    },
    onError: (err: any) => {
      setTestResult({ success: false, message: err.message || 'Slack dispatch failed.' });
    },
  });

  const testTelegramMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/v1/notifications/test-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken: telegramToken, chatId: telegramChatId, message: 'Test notification from Job Monitor V1.1' }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error?.message || 'Telegram test failed');
      return json;
    },
    onSuccess: () => {
      setTestResult({ success: true, message: 'Telegram test alert successfully dispatched!' });
    },
    onError: (err: any) => {
      setTestResult({ success: false, message: err.message || 'Telegram dispatch failed.' });
    },
  });

  return (
    <div className="p-4 md:p-8 max-w-[1000px] mx-auto min-h-screen text-white">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent flex items-center gap-2">
          <Bell className="w-8 h-8 text-purple-400" /> Webhook Notification Channels
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Configure real-time job digest alerts to Slack channels and Telegram bots.
        </p>
      </div>

      {testResult && (
        <div
          className={`p-4 rounded-2xl mb-6 border flex items-center gap-3 text-sm ${
            testResult.success
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
          }`}
        >
          {testResult.success ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span>{testResult.message}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Slack Channel Config */}
        <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-6 shadow-xl">
          <h2 className="font-bold text-base text-slate-100 mb-2 flex items-center gap-2">
            Slack Webhook Integration
          </h2>
          <p className="text-xs text-slate-400 mb-4 flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-indigo-400" /> SSRF Protection enabled: Webhooks pointing to local/private IP addresses are automatically blocked.
          </p>

          <div className="space-y-3">
            <input
              type="text"
              placeholder="https://hooks.slack.com/services/T00/B00/X00..."
              value={slackWebhook}
              onChange={(e) => setSlackWebhook(e.target.value)}
              className="w-full bg-[#0b0f19] border border-[#232d3f] rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
            <div className="flex justify-end">
              <button
                onClick={() => testSlackMutation.mutate()}
                disabled={!slackWebhook || testSlackMutation.isPending}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-lg transition-colors cursor-pointer flex items-center gap-2"
              >
                <Send className="w-4 h-4" /> {testSlackMutation.isPending ? 'Testing Slack...' : 'Test Slack Dispatch'}
              </button>
            </div>
          </div>
        </div>

        {/* Telegram Bot Config */}
        <div className="bg-[#131a26] border border-[#232d3f] rounded-2xl p-6 shadow-xl">
          <h2 className="font-bold text-base text-slate-100 mb-4">Telegram Bot Integration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Bot Token</label>
              <input
                type="text"
                placeholder="123456789:ABCdef..."
                value={telegramToken}
                onChange={(e) => setTelegramToken(e.target.value)}
                className="w-full bg-[#0b0f19] border border-[#232d3f] rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Chat ID</label>
              <input
                type="text"
                placeholder="-100123456789"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
                className="w-full bg-[#0b0f19] border border-[#232d3f] rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => testTelegramMutation.mutate()}
              disabled={!telegramToken || !telegramChatId || testTelegramMutation.isPending}
              className="px-4 py-2 bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-lg transition-colors cursor-pointer flex items-center gap-2"
            >
              <Send className="w-4 h-4" /> {testTelegramMutation.isPending ? 'Testing Telegram...' : 'Test Telegram Dispatch'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
