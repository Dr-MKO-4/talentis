import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePersonnelStore } from '../../store/slices/personnelStore';
import { employeeService } from '../../services/employeeService';
import {
  ArrowLeft, Edit, Mail, Phone, MapPin, Calendar, Briefcase,
  Building2, User, Clock, FileText, History, Users, Shield,
  Globe, Upload, Download, Trash2, ExternalLink, AlertCircle,
  CheckCircle, XCircle, Star, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

// =============================================================================
// TAB COMPONENT
// =============================================================================
const TAB_IDS = ['overview', 'documents', 'career', 'subordinates', 'gdpr'] as const;
type TabId = typeof TAB_IDS[number];

const TAB_LABELS: Record<TabId, { label: string; icon: React.ReactNode }> = {
  overview:     { label: 'Vue d\'ensemble',    icon: <User className="w-4 h-4" /> },
  documents:    { label: 'Documents',          icon: <FileText className="w-4 h-4" /> },
  career:       { label: 'Carrière',           icon: <History className="w-4 h-4" /> },
  subordinates: { label: 'Équipe',             icon: <Users className="w-4 h-4" /> },
  gdpr:         { label: 'RGPD',               icon: <Shield className="w-4 h-4" /> },
};

// =============================================================================
// STATUS COLOR
// =============================================================================
const statusColors: Record<string, string> = {
  Active: 'text-emerald-600 bg-emerald-50',
  TrialPeriod: 'text-amber-600 bg-amber-50',
  OnLeave: 'text-blue-600 bg-blue-50',
  Suspended: 'text-orange-600 bg-orange-50',
  Resigned: 'text-red-600 bg-red-50',
  Terminated: 'text-gray-500 bg-gray-100',
  Retired: 'text-purple-600 bg-purple-50',
};

const statusLabels: Record<string, string> = {
  Active: 'Actif', TrialPeriod: "Période d'essai", OnLeave: 'En congé',
  Suspended: 'Suspendu', Resigned: 'Démissionné', Terminated: 'Terminé', Retired: 'Retraité',
};

// =============================================================================
// SECTION CARD
// =============================================================================
const SectionCard: React.FC<{ title: string; icon?: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
    <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
      {icon && <span className="text-gray-400">{icon}</span>}
      <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

// =============================================================================
// INFO FIELD
// =============================================================================
const InfoField: React.FC<{ label: string; value?: string | number | null; mono?: boolean }> = ({ label, value, mono }) => (
  <div>
    <p className="text-xs text-gray-400 font-medium mb-0.5">{label}</p>
    <p className={`text-sm text-gray-800 ${mono ? 'font-mono' : ''}`}>
      {value ?? <span className="text-gray-300 italic">Non renseigné</span>}
    </p>
  </div>
);

// =============================================================================
// AVATAR LARGE
// =============================================================================
const AvatarLarge: React.FC<{ name: string; photoUrl?: string; onUpload?: (f: File) => void }> = ({ name, photoUrl, onUpload }) => {
  const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const ref = React.useRef<HTMLInputElement>(null);

  return (
    <div className="relative group">
      {photoUrl ? (
        <img src={`${import.meta.env.VITE_API_URL}/uploads/${photoUrl}`} alt={name}
          className="w-24 h-24 rounded-2xl object-cover ring-4 ring-white shadow-md" />
      ) : (
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-2xl font-bold ring-4 ring-white shadow-md">
          {initials}
        </div>
      )}
      {onUpload && (
        <button
          onClick={() => ref.current?.click()}
          className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Upload className="w-6 h-6 text-white" />
        </button>
      )}
      <input ref={ref} type="file" accept="image/*" className="hidden"
        onChange={(e) => e.target.files?.[0] && onUpload?.(e.target.files[0])} />
    </div>
  );
};

// =============================================================================
// PAGE PRINCIPALE — FICHE EMPLOYÉ
// =============================================================================
const EmployeeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedEmployee, isLoadingDetail, fetchEmployee, uploadPhoto, uploadDocument, deleteDocument, gdprExport, gdprAnonymize, isUploading } = usePersonnelStore();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [showMutationModal, setShowMutationModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const docInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) fetchEmployee(id);
    return () => usePersonnelStore.getState().clearSelected();
  }, [id]);

  if (isLoadingDetail) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!selectedEmployee) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-16 h-16 text-gray-300" />
        <p className="text-gray-500">Employé introuvable</p>
        <button onClick={() => navigate('/personnel')} className="text-blue-600 text-sm underline">Retour à la liste</button>
      </div>
    );
  }

  const emp = selectedEmployee;
  const seniority = emp.seniority;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ---------------------------------------------------------------- */}
      {/* HEADER */}
      {/* ---------------------------------------------------------------- */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4 mb-4">
            <button onClick={() => navigate('/personnel')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </button>
            <div className="flex items-center gap-4 flex-1">
              <AvatarLarge
                name={emp.firstName + ' ' + emp.lastName}
                photoUrl={emp.photoUrl}
                onUpload={async (f) => { if (id) await uploadPhoto(id, f); }}
              />
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold text-gray-900">{emp.firstName} {emp.lastName}</h1>
                  {emp.maidenName && <span className="text-gray-400 text-sm">({emp.maidenName})</span>}
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[emp.status] || 'bg-gray-100 text-gray-600'}`}>
                    {statusLabels[emp.status] || emp.status}
                  </span>
                </div>
                <p className="text-gray-600 mt-0.5">{emp.jobTitle} · {emp.departmentName}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                  <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{emp.employeeNumber}</span>
                  <span>·</span>
                  <span>{emp.companyName}</span>
                  <span>·</span>
                  <span>{emp.siteName}, {emp.countryName}</span>
                  <span>·</span>
                  <span>{seniority} an{seniority > 1 ? 's' : ''} d'ancienneté</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => navigate(`/personnel/${emp.id}/edit`)}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Modifier
              </button>
            </div>
          </div>

          {/* Onglets */}
          <div className="flex gap-1 overflow-x-auto">
            {TAB_IDS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${activeTab === tab ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
              >
                {TAB_LABELS[tab].icon}
                {TAB_LABELS[tab].label}
                {tab === 'documents' && emp.documents.length > 0 && (
                  <span className="ml-1 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center">
                    {emp.documents.length}
                  </span>
                )}
                {tab === 'subordinates' && emp.subordinates.length > 0 && (
                  <span className="ml-1 w-5 h-5 bg-gray-200 text-gray-600 text-xs rounded-full flex items-center justify-center">
                    {emp.subordinates.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* CONTENU DES ONGLETS */}
      {/* ---------------------------------------------------------------- */}
      <div className="px-6 py-6">

        {/* ====== ONGLET VUE D'ENSEMBLE ====== */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Colonne gauche */}
            <div className="lg:col-span-2 space-y-5">
              <SectionCard title="Informations personnelles" icon={<User className="w-4 h-4" />}>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <InfoField label="Prénom" value={emp.firstName} />
                  <InfoField label="Nom" value={emp.lastName} />
                  <InfoField label="Nom de jeune fille" value={emp.maidenName} />
                  <InfoField label="Genre" value={emp.gender === 'Male' ? 'Homme' : emp.gender === 'Female' ? 'Femme' : emp.gender} />
                  <InfoField label="Date de naissance" value={emp.dateOfBirth ? new Date(emp.dateOfBirth).toLocaleDateString('fr-FR') : undefined} />
                  <InfoField label="Nationalité" value={emp.nationality} />
                  <InfoField label="N° d'identité" value={emp.nationalId} mono />
                  <InfoField label="Numéro de SS" value={emp.socialSecurityNumber} mono />
                  <InfoField label="Langue préférée" value={emp.preferredLanguage?.toUpperCase()} />
                </div>
              </SectionCard>

              <SectionCard title="Coordonnées" icon={<Phone className="w-4 h-4" />}>
                <div className="grid grid-cols-2 gap-4">
                  <InfoField label="Email professionnel" value={emp.professionalEmail} />
                  <InfoField label="Email personnel" value={emp.personalEmail} />
                  <InfoField label="Téléphone professionnel" value={emp.professionalPhone} />
                  <InfoField label="Téléphone personnel" value={emp.personalPhone} />
                  <InfoField label="Adresse" value={emp.address} />
                  <InfoField label="Ville / CP" value={emp.city && emp.postalCode ? `${emp.city} (${emp.postalCode})` : emp.city || emp.postalCode} />
                </div>
                {(emp.emergencyContactName || emp.emergencyContactPhone) && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Contact d'urgence</p>
                    <div className="grid grid-cols-3 gap-4">
                      <InfoField label="Nom" value={emp.emergencyContactName} />
                      <InfoField label="Téléphone" value={emp.emergencyContactPhone} />
                      <InfoField label="Relation" value={emp.emergencyContactRelation} />
                    </div>
                  </div>
                )}
              </SectionCard>

              <SectionCard title="Informations contractuelles" icon={<Briefcase className="w-4 h-4" />}>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <InfoField label="Type de contrat" value={emp.contractType} />
                  <InfoField label="Statut" value={statusLabels[emp.status] || emp.status} />
                  <InfoField label="Mode de travail" value={emp.workMode === 'OnSite' ? 'Présentiel' : emp.workMode === 'Remote' ? 'Télétravail' : 'Hybride'} />
                  <InfoField label="Date d'embauche" value={new Date(emp.hireDate).toLocaleDateString('fr-FR')} />
                  {emp.trialPeriodEndDate && <InfoField label="Fin période d'essai" value={new Date(emp.trialPeriodEndDate).toLocaleDateString('fr-FR')} />}
                  {emp.contractEndDate && <InfoField label="Fin de contrat" value={new Date(emp.contractEndDate).toLocaleDateString('fr-FR')} />}
                  <InfoField label="Heures hebdo" value={`${emp.weeklyHours}h`} />
                  {emp.remoteDaysPerWeek && <InfoField label="Jours télétravail/sem." value={emp.remoteDaysPerWeek} />}
                  <InfoField label="Fréquence de paie" value={emp.payrollFrequency} />
                </div>
              </SectionCard>
            </div>

            {/* Colonne droite */}
            <div className="space-y-5">
              <SectionCard title="Affectation" icon={<Building2 className="w-4 h-4" />}>
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Building2 className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-400">Entreprise</p>
                      <p className="text-sm font-medium text-gray-800">{emp.companyName}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-400">Site</p>
                      <p className="text-sm font-medium text-gray-800">{emp.siteName}</p>
                      <p className="text-xs text-gray-500">{emp.countryName} ({emp.countryCode})</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Briefcase className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-400">Département</p>
                      <p className="text-sm font-medium text-gray-800">{emp.departmentName}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Star className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-400">Poste</p>
                      <p className="text-sm font-medium text-gray-800">{emp.jobTitle}</p>
                    </div>
                  </div>
                  {emp.managerFullName && (
                    <div className="flex items-start gap-2">
                      <User className="w-4 h-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-400">Manager</p>
                        <button
                          onClick={() => emp.managerId && navigate(`/personnel/${emp.managerId}`)}
                          className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          {emp.managerFullName}
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </SectionCard>

              {/* Rémunération - visible RH seulement */}
              <SectionCard title="Rémunération" icon={<Briefcase className="w-4 h-4" />}>
                <div className="text-center py-2">
                  <p className="text-2xl font-bold text-gray-900">
                    {emp.baseSalary.toLocaleString('fr-FR')} <span className="text-lg font-normal text-gray-500">{emp.currency}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Salaire de base brut mensuel</p>
                </div>
              </SectionCard>

              {/* Biographie */}
              {emp.bio && (
                <SectionCard title="À propos" icon={<User className="w-4 h-4" />}>
                  <p className="text-sm text-gray-600 leading-relaxed">{emp.bio}</p>
                  {emp.linkedInUrl && (
                    <a href={emp.linkedInUrl} target="_blank" rel="noopener noreferrer"
                      className="mt-3 flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700">
                      <ExternalLink className="w-3.5 h-3.5" />
                      LinkedIn
                    </a>
                  )}
                </SectionCard>
              )}

              {/* Actions rapides */}
              <SectionCard title="Actions" icon={<CheckCircle className="w-4 h-4" />}>
                <div className="space-y-2">
                  <button
                    onClick={() => setShowMutationModal(true)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-600 transition-colors"
                  >
                    <Building2 className="w-4 h-4 text-gray-400" />
                    Créer une mutation
                  </button>
                  <button
                    onClick={() => navigate(`/personnel/${emp.id}/edit`)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-600 transition-colors"
                  >
                    <Edit className="w-4 h-4 text-gray-400" />
                    Modifier le dossier
                  </button>
                  <button
                    onClick={() => id && gdprExport(id)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-600 transition-colors"
                  >
                    <Download className="w-4 h-4 text-gray-400" />
                    Export RGPD
                  </button>
                </div>
              </SectionCard>
            </div>
          </div>
        )}

        {/* ====== ONGLET DOCUMENTS ====== */}
        {activeTab === 'documents' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">{emp.documents.length} document{emp.documents.length > 1 ? 's' : ''}</h3>
              <button
                onClick={() => docInputRef.current?.click()}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700"
              >
                <Upload className="w-4 h-4" />
                Uploader
              </button>
              <input ref={docInputRef} type="file" className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && id) uploadDocument(id, file, 'Other');
                }} />
            </div>

            {emp.documents.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-12 flex flex-col items-center justify-center text-gray-300">
                <FileText className="w-12 h-12 mb-3" />
                <p className="text-sm text-gray-400">Aucun document dans le dossier</p>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Document</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Type</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Version</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Expiration</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600">Ajouté le</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {emp.documents.map((doc) => (
                      <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="font-medium text-gray-800">{doc.fileName}</p>
                              {doc.description && <p className="text-xs text-gray-400">{doc.description}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">{doc.documentType}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">v{doc.version}</td>
                        <td className="px-4 py-3">
                          {doc.expiryDate ? (
                            <span className={`text-xs ${new Date(doc.expiryDate) < new Date() ? 'text-red-600' : 'text-gray-500'}`}>
                              {new Date(doc.expiryDate).toLocaleDateString('fr-FR')}
                            </span>
                          ) : <span className="text-gray-300 text-xs">—</span>}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {new Date(doc.createdAt).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <a
                              href={employeeService.downloadDocument(emp.id, doc.id)}
                              target="_blank" rel="noopener noreferrer"
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Télécharger"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                            <button
                              onClick={() => id && deleteDocument(id, doc.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
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

        {/* ====== ONGLET CARRIÈRE ====== */}
        {activeTab === 'career' && (
          <div className="max-w-2xl">
            {emp.careerHistory.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-12 flex flex-col items-center justify-center text-gray-300">
                <History className="w-12 h-12 mb-3" />
                <p className="text-sm text-gray-400">Aucun historique de carrière</p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-100" />
                <div className="space-y-0">
                  {emp.careerHistory.map((h, i) => (
                    <div key={h.id} className="relative flex gap-4 pb-6">
                      <div className="w-10 h-10 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center z-10 shrink-0">
                        <History className="w-4 h-4 text-gray-400" />
                      </div>
                      <div className="flex-1 bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-gray-800 text-sm">{h.changeType}</p>
                            {h.previousValue && h.newValue && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                <span className="line-through text-gray-400">{h.previousValue}</span>
                                <span className="mx-1.5 text-gray-300">→</span>
                                <span className="text-emerald-600 font-medium">{h.newValue}</span>
                              </p>
                            )}
                            {h.comments && <p className="text-xs text-gray-400 mt-1 italic">{h.comments}</p>}
                          </div>
                          <span className="text-xs text-gray-400 whitespace-nowrap ml-3">
                            {new Date(h.effectiveDate).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ====== ONGLET ÉQUIPE ====== */}
        {activeTab === 'subordinates' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {emp.subordinates.length === 0 ? (
              <div className="col-span-3 bg-white border border-gray-200 rounded-xl p-12 flex flex-col items-center justify-center text-gray-300">
                <Users className="w-12 h-12 mb-3" />
                <p className="text-sm text-gray-400">Aucun subordonné direct</p>
              </div>
            ) : emp.subordinates.map((sub) => (
              <div key={sub.id}
                onClick={() => navigate(`/personnel/${sub.id}`)}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md cursor-pointer transition-shadow flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                  {sub.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{sub.fullName}</p>
                  <p className="text-xs text-gray-500">{sub.jobTitle}</p>
                  <p className="text-xs text-gray-400">{sub.departmentName}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
              </div>
            ))}
          </div>
        )}

        {/* ====== ONGLET RGPD ====== */}
        {activeTab === 'gdpr' && (
          <div className="max-w-xl space-y-4">
            <SectionCard title="Conformité RGPD" icon={<Shield className="w-4 h-4" />}>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Consentement RGPD</p>
                    <p className="text-xs text-gray-400">
                      {emp.gdprConsentGiven && emp.gdprConsentDate
                        ? `Donné le ${new Date(emp.gdprConsentDate).toLocaleDateString('fr-FR')}`
                        : 'Non recueilli'}
                    </p>
                  </div>
                  {emp.gdprConsentGiven
                    ? <CheckCircle className="w-5 h-5 text-emerald-500" />
                    : <XCircle className="w-5 h-5 text-red-400" />}
                </div>

                <div className="space-y-2 pt-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase">Actions RGPD</p>
                  <button
                    onClick={() => id && gdprExport(id)}
                    className="w-full flex items-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-xl text-sm hover:bg-blue-100 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Exporter toutes les données personnelles (JSON)
                  </button>
                  {emp.status === 'Terminated' || emp.status === 'Resigned' ? (
                    <button
                      onClick={async () => {
                        if (id && window.confirm('⚠️ Anonymisation IRRÉVERSIBLE. Confirmer ?')) {
                          await gdprAnonymize(id);
                          navigate('/personnel');
                        }
                      }}
                      className="w-full flex items-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-xl text-sm hover:bg-red-100 transition-colors border border-red-200"
                    >
                      <Shield className="w-4 h-4" />
                      Anonymiser les données (Droit à l'oubli) — Irréversible
                    </button>
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 text-gray-400 rounded-xl text-xs">
                      L'anonymisation n'est disponible que pour les employés dont le contrat est terminé.
                    </div>
                  )}
                </div>
              </div>
            </SectionCard>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeDetailPage;
