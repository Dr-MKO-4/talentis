import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi, handleApiError } from '../../services/api';
import { HRDashboard, HRKPI } from '../../types';
import { StatCard, Card, LoadingSpinner } from '../../components/common';

export const DashboardPage: React.FC = () => {
  const [dashboard, setDashboard] = useState<HRDashboard | null>(null);
  const [kpis, setKPIs] = useState<HRKPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const companyId = localStorage.getItem('companyId') || '';

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [dashboardRes, kpisRes] = await Promise.all([
        dashboardApi.getHRDashboard(companyId),
        dashboardApi.getKPIs(companyId),
      ]);

      setDashboard(dashboardRes.data.data);
      setKPIs(kpisRes.data.data);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-600 p-4">Erreur: {error}</div>;
  if (!dashboard) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord RH</h1>
        <p className="text-gray-600 mt-1">Vue d'ensemble de votre entreprise</p>
      </div>

      {/* Stats principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Effectif total"
          value={dashboard.totalEmployees}
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
        
        <StatCard
          title="Nouvelles embauches"
          value={dashboard.newHiresThisMonth}
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          }
        />
        
        <StatCard
          title="Départs"
          value={dashboard.departuresThisMonth}
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
            </svg>
          }
        />
        
        <StatCard
          title="Taux de turnover"
          value={`${dashboard.turnoverRate.toFixed(1)}%`}
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
      </div>

      {/* KPIs */}
      <Card title="Indicateurs clés de performance">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {kpis.map((kpi) => (
            <div key={kpi.name} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-600">{kpi.name}</p>
                <span className={`text-xs font-medium ${
                  kpi.trend === 'Up' ? 'text-green-600' : 
                  kpi.trend === 'Down' ? 'text-red-600' : 
                  'text-gray-600'
                }`}>
                  {kpi.trend === 'Up' && '↑'}
                  {kpi.trend === 'Down' && '↓'}
                  {kpi.trend === 'Stable' && '→'}
                </span>
              </div>
              <div className="flex items-end justify-between">
                <p className="text-2xl font-bold text-gray-900">
                  {kpi.value} <span className="text-sm font-normal text-gray-600">{kpi.unit}</span>
                </p>
                {kpi.target && (
                  <p className="text-xs text-gray-500">Objectif: {kpi.target}{kpi.unit}</p>
                )}
              </div>
              {kpi.variance && (
                <p className={`text-xs mt-1 ${kpi.variance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {kpi.variance > 0 && '+'}{kpi.variance.toFixed(1)}% vs période précédente
                </p>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Postes ouverts</h3>
            <span className="text-2xl font-bold text-blue-600">{dashboard.openPositions}</span>
          </div>
          <Link to="/recruitment" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Voir les offres →
          </Link>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Congés en attente</h3>
            <span className="text-2xl font-bold text-orange-600">{dashboard.pendingLeaveRequests}</span>
          </div>
          <Link to="/time-attendance" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Traiter les demandes →
          </Link>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Masse salariale <span className="block text-xs font-normal text-gray-400">salaires de base mensuels, consolidés en FCFA</span></h3>
            <span className="text-2xl font-bold text-green-600">
              {(dashboard.totalPayrollCost / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} M FCFA
            </span>
          </div>
          <Link to="/payroll" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Voir les détails →
          </Link>
        </Card>
      </div>

      {/* Répartition des employés */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Par département">
          <div className="space-y-3">
            {Object.entries(dashboard.employeesByDepartment).map(([dept, count]) => (
              <div key={dept} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{dept}</span>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full w-32">
                    <div
                      className="h-2 bg-blue-600 rounded-full"
                      style={{ width: `${(count / dashboard.totalEmployees) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Par type de contrat">
          <div className="space-y-3">
            {Object.entries(dashboard.employeesByContractType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{type}</span>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full w-32">
                    <div
                      className="h-2 bg-green-600 rounded-full"
                      style={{ width: `${(count / dashboard.totalEmployees) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
