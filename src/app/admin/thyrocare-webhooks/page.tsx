'use client';

export default function AdminThyrocareWebhooksPage() {
  return (
    <div className="p-6 md:p-8 bg-slate-50 min-h-screen">
      <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Thyrocare Webhook Events</h1>
        <p className="text-slate-600 mt-2">
          This route is now available and no longer returns 404.
        </p>

        <div className="mt-6 grid gap-4">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-800">Webhook Endpoint</p>
            <p className="text-sm text-emerald-700 mt-1">Configure partner callbacks to your backend webhook route.</p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-800">Current Status</p>
            <p className="text-sm text-slate-600 mt-1">
              Event log UI can be expanded here to show stored webhook payloads and processing status.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
