// Composants partagés des écrans de module construits pour la démo, dans le
// style des pages d'origine (EmployeesPage / EmployeeDetailPage).
import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';
import { apiClient, handleApiError } from '../../services/api';

export async function call<T = any>(method: 'get' | 'post' | 'put' | 'delete', url: string, data?: unknown, params?: Record<string, unknown>): Promise<T> {
  const res = await apiClient.request({ method, url, data, params });
  return res.data.data as T;
}

/** Appel d'action : toast du message de l'API (succès ou erreur). */
export async function act(method: 'post' | 'put' | 'delete', url: string, data?: unknown): Promise<boolean> {
  try {
    const res = await apiClient.request({ method, url, data });
    toast.success(res.data.message || 'Enregistré.');
    return true;
  } catch (e) {
    toast.error(handleApiError(e));
    return false;
  }
}

export function useApi<T>(url: string, params?: Record<string, unknown>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const key = url + JSON.stringify(params || {});
  const reload = useCallback(async () => {
    setLoading(true);
    try { setData(await call<T>('get', url, undefined, params)); }
    catch (e) { toast.error(handleApiError(e)); }
    finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => { reload(); }, [reload]);
  return { data, loading, reload };
}

export const fmtDate = (d?: string) => (d ? new Date(d.length === 10 ? d + 'T00:00:00' : d).toLocaleDateString('fr-FR') : '');
export const fmtDateTime = (d?: string) => (d ? new Date(d).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '');
export const fmtMoney = (n: number, cur: string) => {
  const label = cur === 'XAF' ? 'FCFA' : cur === 'XOF' ? 'F CFA (UEMOA)' : cur;
  const digits = cur === 'EUR' ? 2 : 0;
  return `${n.toLocaleString('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits })} ${label}`;
};
export const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

export const PageHeader: React.FC<{ icon: React.ReactNode; color: string; title: string; subtitle?: React.ReactNode; actions?: React.ReactNode }> = ({ icon, color, title, subtitle, actions }) => (
  <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center text-white shrink-0`}>{icon}</div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  </div>
);

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string; count?: number }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex gap-1 overflow-x-auto" role="tablist">
      {tabs.map((t) => (
        <button key={t.id} role="tab" aria-selected={value === t.id} onClick={() => onChange(t.id)}
          className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${value === t.id ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}>
          {t.label}
          {t.count !== undefined && <span className="ml-1 min-w-5 h-5 px-1.5 bg-gray-200 text-gray-600 text-xs rounded-full flex items-center justify-center">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

const PILL: Record<string, string> = {
  green: 'bg-emerald-100 text-emerald-700 border-emerald-200', amber: 'bg-amber-100 text-amber-700 border-amber-200', blue: 'bg-blue-100 text-blue-700 border-blue-200',
  red: 'bg-red-100 text-red-600 border-red-200', gray: 'bg-gray-100 text-gray-600 border-gray-200', purple: 'bg-purple-100 text-purple-700 border-purple-200',
};
export const Pill: React.FC<{ tone: keyof typeof PILL; children: React.ReactNode }> = ({ tone, children }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${PILL[tone]}`}>{children}</span>
);

export const Panel: React.FC<{ title?: React.ReactNode; actions?: React.ReactNode; children: React.ReactNode; className?: string }> = ({ title, actions, children, className = '' }) => (
  <section className={`bg-white border border-gray-200 rounded-xl shadow-sm ${className}`}>
    {(title || actions) && (
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-gray-100 flex-wrap">
        {title && <h2 className="font-semibold text-gray-800">{title}</h2>}
        {actions}
      </div>
    )}
    <div>{children}</div>
  </section>
);

export const Spinner: React.FC = () => (
  <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
);

export const Empty: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="p-10 text-center text-sm text-gray-400">{children}</div>
);

export const Dialog: React.FC<{ open: boolean; title: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode; wide?: boolean }> = ({ open, title, onClose, children, footer, wide }) => {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? 'max-w-2xl' : 'max-w-md'} max-h-[92vh] flex flex-col`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} aria-label="Fermer" className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
        {footer && <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-100">{footer}</div>}
      </div>
    </div>
  );
};

export const Field: React.FC<{ label: string; children: React.ReactNode; hint?: string }> = ({ label, children, hint }) => (
  <label className="block">
    <span className="block text-xs font-medium text-gray-500 mb-1">{label}</span>
    {children}
    {hint && <span className="block text-xs text-gray-400 mt-1">{hint}</span>}
  </label>
);

export const Stat: React.FC<{ label: string; value: React.ReactNode; tone?: string; sub?: React.ReactNode }> = ({ label, value, tone = 'text-gray-900', sub }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
    <p className="text-xs font-medium text-gray-500">{label}</p>
    <p className={`text-2xl font-bold mt-1 ${tone}`}>{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

export const Note: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-xs text-gray-500 bg-blue-50/60 border border-blue-100 rounded-lg px-3 py-2">{children}</p>
);

export interface EmpOption { id: string; fullName: string; jobTitle: string; status: string }
export function useEmployees() {
  return useApi<{ items: EmpOption[] }>('/employees', { pageSize: 200 });
}
