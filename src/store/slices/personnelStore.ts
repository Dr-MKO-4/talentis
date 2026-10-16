import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { employeeService } from '../../services/employeeService';
import {
  EmployeeListItem, EmployeeDetail, EmployeeFilter,
  PagedResult, References, OrgChartNode, AlertsResponse
} from '../../types/personnel';
import toast from 'react-hot-toast';

interface PersonnelState {
  // Liste
  employees: EmployeeListItem[];
  pagedResult: PagedResult<EmployeeListItem> | null;
  filter: EmployeeFilter;
  isLoadingList: boolean;

  // Détail
  selectedEmployee: EmployeeDetail | null;
  isLoadingDetail: boolean;

  // Formulaire
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;

  // Références
  references: References | null;
  isLoadingRefs: boolean;

  // Organigramme
  orgChart: OrgChartNode[] | null;
  isLoadingOrgChart: boolean;

  // Alertes
  alerts: AlertsResponse | null;
  isLoadingAlerts: boolean;

  // Upload
  isUploading: boolean;

  // Actions
  setFilter: (filter: Partial<EmployeeFilter>) => void;
  resetFilter: () => void;
  fetchEmployees: () => Promise<void>;
  fetchEmployee: (id: string) => Promise<void>;
  createEmployee: (dto: import('../../types/personnel').CreateEmployeeDto) => Promise<EmployeeDetail | null>;
  updateEmployee: (id: string, dto: import('../../types/personnel').UpdateEmployeeDto) => Promise<boolean>;
  deleteEmployee: (id: string) => Promise<boolean>;
  fetchReferences: (companyId: string) => Promise<void>;
  fetchOrgChart: (companyId: string) => Promise<void>;
  fetchAlerts: () => Promise<void>;
  uploadDocument: (id: string, file: File, docType: string, desc?: string, expiry?: string) => Promise<boolean>;
  deleteDocument: (empId: string, docId: string) => Promise<boolean>;
  uploadPhoto: (id: string, photo: File) => Promise<boolean>;
  createMutation: (id: string, dto: import('../../types/personnel').CreateMutationDto) => Promise<boolean>;
  gdprExport: (id: string) => Promise<void>;
  gdprAnonymize: (id: string) => Promise<boolean>;
  clearSelected: () => void;
}

const DEFAULT_FILTER: EmployeeFilter = {
  page: 1,
  pageSize: 20,
  sortBy: 'LastName',
  sortDesc: false,
};

export const usePersonnelStore = create<PersonnelState>()(
  devtools(
    (set, get) => ({
      employees: [],
      pagedResult: null,
      filter: DEFAULT_FILTER,
      isLoadingList: false,
      selectedEmployee: null,
      isLoadingDetail: false,
      isCreating: false,
      isUpdating: false,
      isDeleting: false,
      references: null,
      isLoadingRefs: false,
      orgChart: null,
      isLoadingOrgChart: false,
      alerts: null,
      isLoadingAlerts: false,
      isUploading: false,

      // ----------------------------------------------------------------
      setFilter: (f) => set((state) => ({ filter: { ...state.filter, ...f, page: f.page ?? 1 } })),
      resetFilter: () => set({ filter: DEFAULT_FILTER }),

      // ----------------------------------------------------------------
      fetchEmployees: async () => {
        set({ isLoadingList: true });
        try {
          const response = await employeeService.getAll(get().filter);
          if (response.success && response.data) {
            set({
              employees: response.data.items,
              pagedResult: response.data,
            });
          }
        } catch (err) {
          toast.error('Erreur lors du chargement des employés.');
        } finally {
          set({ isLoadingList: false });
        }
      },

      // ----------------------------------------------------------------
      fetchEmployee: async (id) => {
        set({ isLoadingDetail: true });
        try {
          const response = await employeeService.getById(id);
          if (response.success && response.data) {
            set({ selectedEmployee: response.data });
          }
        } catch {
          toast.error('Employé introuvable.');
        } finally {
          set({ isLoadingDetail: false });
        }
      },

      // ----------------------------------------------------------------
      createEmployee: async (dto) => {
        set({ isCreating: true });
        try {
          const response = await employeeService.create(dto);
          if (response.success && response.data) {
            toast.success('Employé créé avec succès !');
            await get().fetchEmployees();
            return response.data;
          }
          toast.error(response.message || 'Erreur lors de la création.');
          return null;
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Erreur lors de la création.');
          return null;
        } finally {
          set({ isCreating: false });
        }
      },

      // ----------------------------------------------------------------
      updateEmployee: async (id, dto) => {
        set({ isUpdating: true });
        try {
          const response = await employeeService.update(id, dto);
          if (response.success && response.data) {
            set({ selectedEmployee: response.data });
            toast.success('Employé mis à jour.');
            return true;
          }
          toast.error(response.message || 'Erreur lors de la mise à jour.');
          return false;
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Erreur lors de la mise à jour.');
          return false;
        } finally {
          set({ isUpdating: false });
        }
      },

      // ----------------------------------------------------------------
      deleteEmployee: async (id) => {
        set({ isDeleting: true });
        try {
          const response = await employeeService.delete(id);
          if (response.success) {
            set((state) => ({
              employees: state.employees.filter((e) => e.id !== id),
            }));
            toast.success('Employé archivé.');
            return true;
          }
          return false;
        } catch {
          toast.error('Erreur lors de la suppression.');
          return false;
        } finally {
          set({ isDeleting: false });
        }
      },

      // ----------------------------------------------------------------
      fetchReferences: async (companyId) => {
        if (get().references) return; // Cache
        set({ isLoadingRefs: true });
        try {
          const response = await employeeService.getReferences(companyId);
          if (response.success && response.data) set({ references: response.data });
        } catch {
          toast.error('Erreur lors du chargement des référentiels.');
        } finally {
          set({ isLoadingRefs: false });
        }
      },

      // ----------------------------------------------------------------
      fetchOrgChart: async (companyId) => {
        set({ isLoadingOrgChart: true });
        try {
          const response = await employeeService.getFullOrgChart(companyId);
          if (response.success && response.data) set({ orgChart: response.data });
        } catch {
          toast.error('Erreur lors du chargement de l\'organigramme.');
        } finally {
          set({ isLoadingOrgChart: false });
        }
      },

      // ----------------------------------------------------------------
      fetchAlerts: async () => {
        set({ isLoadingAlerts: true });
        try {
          const response = await employeeService.getAlerts(60);
          if (response.success && response.data) set({ alerts: response.data });
        } finally {
          set({ isLoadingAlerts: false });
        }
      },

      // ----------------------------------------------------------------
      uploadDocument: async (id, file, docType, desc, expiry) => {
        set({ isUploading: true });
        try {
          const response = await employeeService.uploadDocument(id, file, docType, desc, expiry);
          if (response.success) {
            toast.success('Document uploadé.');
            await get().fetchEmployee(id);
            return true;
          }
          toast.error(response.message || 'Erreur upload.');
          return false;
        } catch {
          toast.error('Erreur lors de l\'upload.');
          return false;
        } finally {
          set({ isUploading: false });
        }
      },

      // ----------------------------------------------------------------
      deleteDocument: async (empId, docId) => {
        try {
          const response = await employeeService.deleteDocument(empId, docId);
          if (response.success) {
            toast.success('Document supprimé.');
            await get().fetchEmployee(empId);
            return true;
          }
          return false;
        } catch {
          toast.error('Erreur lors de la suppression du document.');
          return false;
        }
      },

      // ----------------------------------------------------------------
      uploadPhoto: async (id, photo) => {
        set({ isUploading: true });
        try {
          const response = await employeeService.uploadPhoto(id, photo);
          if (response.success && response.data) {
            set((state) => ({
              selectedEmployee: state.selectedEmployee
                ? { ...state.selectedEmployee, photoUrl: response.data!.photoUrl }
                : null,
            }));
            toast.success('Photo mise à jour.');
            return true;
          }
          return false;
        } catch {
          toast.error('Erreur lors de l\'upload de la photo.');
          return false;
        } finally {
          set({ isUploading: false });
        }
      },

      // ----------------------------------------------------------------
      createMutation: async (id, dto) => {
        try {
          const response = await employeeService.createMutation(id, dto);
          if (response.success) {
            toast.success('Mutation enregistrée.');
            await get().fetchEmployee(id);
            return true;
          }
          return false;
        } catch {
          toast.error('Erreur lors de la mutation.');
          return false;
        }
      },

      // ----------------------------------------------------------------
      gdprExport: async (id) => {
        try {
          const response = await employeeService.gdprExport(id);
          if (response.success) {
            // Télécharger le JSON
            const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `rgpd_export_${id}_${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Export RGPD téléchargé.');
          }
        } catch {
          toast.error('Erreur lors de l\'export RGPD.');
        }
      },

      // ----------------------------------------------------------------
      gdprAnonymize: async (id) => {
        try {
          const response = await employeeService.gdprAnonymize(id);
          if (response.success) {
            toast.success('Employé anonymisé (RGPD).');
            await get().fetchEmployees();
            return true;
          }
          toast.error(response.message || 'Erreur anonymisation.');
          return false;
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Erreur anonymisation.');
          return false;
        }
      },

      // ----------------------------------------------------------------
      clearSelected: () => set({ selectedEmployee: null }),
    }),
    { name: 'personnel-store' }
  )
);
