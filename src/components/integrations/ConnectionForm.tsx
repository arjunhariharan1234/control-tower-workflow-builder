'use client';

import React, { useState } from 'react';
import { Integration, IntegrationConnection } from '@/types/integration';
import { useIntegrationStore } from '@/store/integration-store';

const G = '#FFBE07';

interface Props {
  integration: Integration;
  onSaved: () => void;
}

export default function ConnectionForm({ integration, onSaved }: Props) {
  const { addConnection } = useIntegrationStore();
  const [label, setLabel] = useState(`My ${integration.name}`);
  const [values, setValues] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  const handleTest = () => {
    setTesting(true);
    setTestResult(null);
    // Simulate connection test
    setTimeout(() => {
      setTesting(false);
      const allFilled = integration.authFields.filter((f) => f.required).every((f) => values[f.key]?.trim());
      setTestResult(allFilled ? 'success' : 'error');
    }, 1200);
  };

  const handleSave = () => {
    const conn: IntegrationConnection = {
      integrationId: integration.id,
      label,
      credentials: values,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: testResult === 'success' ? 'connected' : 'unchecked',
    };
    addConnection(conn);
    onSaved();
  };

  const canSave = label.trim() && integration.authFields.filter((f) => f.required).every((f) => values[f.key]?.trim());

  return (
    <div className="space-y-4">
      {/* Connection label */}
      <div>
        <label className="block text-[11px] font-medium mb-1.5" style={{ color: '#9ca3af' }}>Connection Name</label>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: '#0f1117', border: '1px solid #2a2d3a', color: '#fff' }}
        />
      </div>

      {/* Auth fields */}
      {integration.authFields.map((field) => (
        <div key={field.key}>
          <label className="block text-[11px] font-medium mb-1.5" style={{ color: '#9ca3af' }}>
            {field.label} {field.required && <span style={{ color: G }}>*</span>}
          </label>
          <div className="relative">
            <input
              type={field.type === 'password' && !showPasswords[field.key] ? 'password' : 'text'}
              value={values[field.key] || ''}
              onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
              placeholder={field.placeholder || ''}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none pr-10"
              style={{ background: '#0f1117', border: '1px solid #2a2d3a', color: '#fff' }}
            />
            {field.type === 'password' && (
              <button
                onClick={() => setShowPasswords({ ...showPasswords, [field.key]: !showPasswords[field.key] })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px]"
                style={{ color: '#6b7280' }}
              >
                {showPasswords[field.key] ? 'Hide' : 'Show'}
              </button>
            )}
          </div>
        </div>
      ))}

      {/* Test result */}
      {testResult && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium"
          style={{
            background: testResult === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            color: testResult === 'success' ? '#10b981' : '#ef4444',
          }}
        >
          {testResult === 'success' ? '✓ Connection successful' : '✕ Connection failed — check your credentials'}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2">
        <button
          onClick={handleTest}
          disabled={!canSave || testing}
          className="px-4 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-40"
          style={{ border: '1px solid #2a2d3a', color: '#d1d5db' }}
        >
          {testing ? 'Testing...' : 'Test Connection'}
        </button>
        <button
          onClick={handleSave}
          disabled={!canSave}
          className="px-4 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-40"
          style={{ background: G, color: '#000' }}
        >
          Save Connection
        </button>
      </div>
    </div>
  );
}
