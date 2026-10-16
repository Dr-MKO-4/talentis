import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePersonnelStore } from '../../store/slices/personnelStore';
import { EmployeeStatus, ContractType, WorkMode } from '../../types/personnel';
import {
  Users, Plus, Search, Filter, Download, RefreshCw,
  Eye, Edit, Trash2, AlertCircle, ChevronLeft, ChevronRight,
  Building2, MapPin, Calendar, Mail, Phone, ExternalLink,
  LayoutGrid, List, ChevronUp, ChevronDown
} from 'lucide-react';

// =============================================================================
// STATUS BADGE
// =============================================================================
const StatusBadge: React.FC<{ status: EmployeeStatus }> = ({ status }) => {
  const config: Record<EmployeeStatus, { label: string; class: string }> = {
    Active:       { label: 'Actif',             class: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    TrialPeriod:  { label: 'Période d\'essai',  class: 'bg-amber-100 text-amber-700 border-amber-200' },
    OnLeave:      { label: 'En congé',           class: 'bg-blue-100 text-blue-700 border-blue-200' },
    Suspended:    { label: 'Suspendu',           class: 'bg-orange-100 text-orange-700 border-orange-200' },
    Resigned:     { label: 'Démissionné',        class: 'bg-red-100 text-red-600 border-red-200' },
    Terminated:   { label: 'Terminé',            class: 'bg-gray-100 text-gray-500 border-gray-200' },
    Retired:      { label: 'Retraité',           class: 'bg-purple-100 text-purple-600 border-purple-200' },
  };
  const { label, class: cls } = config[status] || { label: status, class: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {label}
    </span>
  );
};

// =============================================================================
// CONTRACT BADGE
// =============================================================================
const ContractBadge: React.FC<{ type: ContractType }> = ({ type }) => {
  const labels: Record<ContractType, string> = {
    CDI: 'CDI', CDD: 'CDD', Freelance: 'Freelance',
    Internship: 'Stage', Apprenticeship: 'Alternance',
    PartTime: 'Temps partiel', Interim: 'Intérim'
  };
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-600">
      {labels[type] || type}
    </span>
  );
};

// =============================================================================
// AVATAR
// =============================================================================
const Avatar: React.FC<{ name: string; photoUrl?: string; size?: 'sm' | 'md' }> = ({ name, photoUrl, size = 'md' }) => {
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const sz = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  if (photoUrl) return (
    <img src={`${import.meta.env.VITE_API_URL}/uploads/${photoUrl}`}
      alt={name} className={`${sz} rounded-full object-cover ring-2 ring-white`} />
  );
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold ring-2 ring-white`}>
      {initials}
    </div>
  );
};

// =============================================================================
// PAGE PRINCIPALE · LISTE EMPLOYÉS
// =============================================================================
const EmployeesPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    employees, pagedResult, filter, isLoadingList,
    setFilter, fetchEmployees, deleteEmployee, fetchAlerts, alerts
  } = usePersonnelStore();

  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState(filter.search || '');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchEmployees();
    fetchAlerts();
  }, [filter]);

  const handleSearch = useCallback(() => {
    setFilter({ search: searchInput, page: 1 });
  }, [searchInput, setFilter]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleSort = (column: string) => {
    if (filter.sortBy === column) {
      setFilter({ sortDesc: !filter.sortDesc });
    } else {
      setFilter({ sortBy: column, sortDesc: false });
    }
  };

  const SortIcon: React.FC<{ column: string }> = ({ column }) => {
    if (filter.sortBy !== column) return <ChevronUp className="w-3 h-3 text-gray-300" />;
    return filter.sortDesc ? <ChevronDown className="w-3 h-3 text-blue-500" /> : <ChevronUp className="w-3 h-3 text-blue-500" />;
  };

  const totalAlerts = (alerts?.expiringContracts.length || 0) + (alerts?.expiringTrialPeriods.length || 0);

  return (
    <div className="min-h-full bg-gray-50">
      {/* ---------------------------------------------------------------- */}
      {/* HEADER */}
      {/* ---------------------------------------------------------------- */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Personnel</h1>
              <p className="text-sm text-gray-500">
                {pagedResult?.totalCount ?? 0} collaborateur{(pagedResult?.totalCount ?? 0) > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {totalAlerts > 0 && (
              <button
                onClick={() => navigate('/personnel/alerts')}
                className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 text-amber-600 rounded-lg text-sm font-medium border border-amber-200 hover:bg-amber-100 transition-colors"
              >
                <AlertCircle className="w-4 h-4" />
                {totalAlerts} alerte{totalAlerts > 1 ? 's' : ''}
              </button>
            )}
            <button
              onClick={() => navigate('/personnel/orgchart')}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              <Building2 className="w-4 h-4" />
              Organigramme
            </button>
            <button
              onClick={() => navigate('/personnel/new')}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Ajouter
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-4 space-y-4">
        {/* ---------------------------------------------------------------- */}
        {/* BARRE DE RECHERCHE + ACTIONS */}
        {/* ---------------------------------------------------------------- */}
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-[240px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Rechercher par nom, email, matricule, poste..." aria-label="Rechercher un collaborateur"
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-1.5"
          >
            <Search className="w-4 h-4" />
            Rechercher
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2.5 border rounded-xl text-sm flex items-center gap-1.5 transition-colors ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            <Filter className="w-4 h-4" />
            Filtres
          </button>
          <button
            onClick={() => fetchEmployees()}
            className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-50 transition-colors"
            title="Actualiser"
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingList ? 'animate-spin' : ''}`} />
          </button>
          <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2.5 transition-colors ${viewMode === 'table' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
              title="Vue tableau"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-2.5 transition-colors ${viewMode === 'cards' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
              title="Vue cartes"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* FILTRES AVANCÉS */}
        {/* ---------------------------------------------------------------- */}
        {showFilters && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Statut</label>
              <select
                value={filter.status || ''}
                onChange={(e) => setFilter({ status: e.target.value as EmployeeStatus || undefined, page: 1 })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous</option>
                <option value="Active">Actif</option>
                <option value="TrialPeriod">Période d'essai</option>
                <option value="OnLeave">En congé</option>
                <option value="Suspended">Suspendu</option>
                <option value="Resigned">Démissionné</option>
                <option value="Terminated">Terminé</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Type de contrat</label>
              <select
                value={filter.contractType || ''}
                onChange={(e) => setFilter({ contractType: e.target.value as ContractType || undefined, page: 1 })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous</option>
                <option value="CDI">CDI</option>
                <option value="CDD">CDD</option>
                <option value="Internship">Stage</option>
                <option value="Apprenticeship">Alternance</option>
                <option value="Freelance">Freelance</option>
                <option value="Interim">Intérim</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Mode de travail</label>
              <select
                value={filter.workMode || ''}
                onChange={(e) => setFilter({ workMode: e.target.value as WorkMode || undefined, page: 1 })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous</option>
                <option value="OnSite">Présentiel</option>
                <option value="Remote">Télétravail</option>
                <option value="Hybrid">Hybride</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Éléments par page</label>
              <select
                value={filter.pageSize}
                onChange={(e) => setFilter({ pageSize: Number(e.target.value), page: 1 })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="col-span-2 md:col-span-4 flex justify-end gap-2 pt-1">
              <button
                onClick={() => { setFilter({ status: undefined, contractType: undefined, workMode: undefined }); setSearchInput(''); }}
                className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700"
              >
                Réinitialiser
              </button>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* VUE TABLEAU */}
        {/* ---------------------------------------------------------------- */}
        {viewMode === 'table' && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            {isLoadingList ? (
              <div className="flex items-center justify-center h-40">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : employees.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                <Users className="w-12 h-12 mb-2 opacity-30" />
                <p className="text-sm">Aucun employé trouvé</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-4 py-3 text-left">
                        <button onClick={() => handleSort('LastName')} className="flex items-center gap-1 font-semibold text-gray-600 hover:text-gray-900">
                          Collaborateur <SortIcon column="LastName" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left">
                        <button onClick={() => handleSort('Department')} className="flex items-center gap-1 font-semibold text-gray-600 hover:text-gray-900">
                          Département <SortIcon column="Department" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Site</th>
                      <th className="px-4 py-3 text-left">
                        <button onClick={() => handleSort('Status')} className="flex items-center gap-1 font-semibold text-gray-600 hover:text-gray-900">
                          Statut <SortIcon column="Status" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Contrat</th>
                      <th className="px-4 py-3 text-left">
                        <button onClick={() => handleSort('HireDate')} className="flex items-center gap-1 font-semibold text-gray-600 hover:text-gray-900">
                          Embauche <SortIcon column="HireDate" />
                        </button>
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {employees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-gray-50 transition-colors group">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={emp.fullName} photoUrl={emp.photoUrl} />
                            <div>
                              <button
                                onClick={() => navigate(`/personnel/${emp.id}`)}
                                className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                              >
                                {emp.fullName}
                              </button>
                              <p className="text-xs text-gray-500">{emp.jobTitle}</p>
                              <p className="text-xs text-gray-400">{emp.employeeNumber} · {emp.professionalEmail}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{emp.departmentName}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 text-gray-500 text-xs">
                            <MapPin className="w-3 h-3" />
                            {emp.siteName}
                            <span className="ml-1 px-1.5 py-0.5 bg-gray-100 rounded text-gray-400 font-mono">
                              {emp.countryCode}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={emp.status} /></td>
                        <td className="px-4 py-3"><ContractBadge type={emp.contractType} /></td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {new Date(emp.hireDate).toLocaleDateString('fr-FR')}
                          <span className="ml-1 text-gray-400">({emp.seniority} an{emp.seniority > 1 ? 's' : ''})</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                            <button
                              onClick={() => navigate(`/personnel/${emp.id}`)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Voir"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => navigate(`/personnel/${emp.id}/edit`)}
                              className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(emp.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* VUE CARTES */}
        {/* ---------------------------------------------------------------- */}
        {viewMode === 'cards' && !isLoadingList && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {employees.map((emp) => (
              <div key={emp.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={emp.fullName} photoUrl={emp.photoUrl} size="md" />
                    <div>
                      <button
                        onClick={() => navigate(`/personnel/${emp.id}`)}
                        className="font-semibold text-gray-900 hover:text-blue-600 text-sm leading-tight"
                      >
                        {emp.fullName}
                      </button>
                      <p className="text-xs text-gray-500 mt-0.5">{emp.jobTitle}</p>
                    </div>
                  </div>
                  <StatusBadge status={emp.status} />
                </div>
                <div className="space-y-1.5 text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3 h-3" />
                    <span>{emp.departmentName}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" />
                    <span>{emp.siteName} ({emp.countryCode})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3 h-3" />
                    <span className="truncate">{emp.professionalEmail}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(emp.hireDate).toLocaleDateString('fr-FR')} · {emp.seniority} an{emp.seniority > 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <ContractBadge type={emp.contractType} />
                  <div className="flex gap-1">
                    <button onClick={() => navigate(`/personnel/${emp.id}`)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => navigate(`/personnel/${emp.id}/edit`)} className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg">
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* PAGINATION */}
        {/* ---------------------------------------------------------------- */}
        {pagedResult && pagedResult.totalPages > 1 && (
          <div className="flex items-center justify-between py-2">
            <p className="text-sm text-gray-500">
              Affichage {((filter.page - 1) * filter.pageSize) + 1}–{Math.min(filter.page * filter.pageSize, pagedResult.totalCount)} sur {pagedResult.totalCount}
            </p>
            <div className="flex items-center gap-1">
              <button
                disabled={filter.page <= 1}
                onClick={() => setFilter({ page: filter.page - 1 })}
                className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, pagedResult.totalPages) }, (_, i) => {
                const pageNum = i + Math.max(1, Math.min(filter.page - 2, pagedResult.totalPages - 4));
                return (
                  <button
                    key={pageNum}
                    onClick={() => setFilter({ page: pageNum })}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${filter.page === pageNum ? 'bg-blue-600 text-white' : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                disabled={filter.page >= pagedResult.totalPages}
                onClick={() => setFilter({ page: filter.page + 1 })}
                className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* MODAL DE CONFIRMATION DE SUPPRESSION */}
      {/* ---------------------------------------------------------------- */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-center text-gray-900 mb-2">Confirmer la suppression</h3>
            <p className="text-sm text-center text-gray-500 mb-6">
              L'employé sera archivé (suppression logique). Cette action peut être annulée par un administrateur.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={async () => {
                  await deleteEmployee(deleteConfirm);
                  setDeleteConfirm(null);
                }}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeesPage;
