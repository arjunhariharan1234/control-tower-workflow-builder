import { create } from 'zustand';
import { IntegrationCategory, IntegrationConnection } from '@/types/integration';
import { getConnections, saveConnection as persistConnection, deleteConnection as removeConnection } from '@/lib/integrations/connections';

interface IntegrationState {
  searchQuery: string;
  selectedCategory: IntegrationCategory | 'all';
  selectedIntegrationId: string | null;
  drawerOpen: boolean;
  drawerTab: 'overview' | 'triggers-actions' | 'connections';
  connections: IntegrationConnection[];

  setSearchQuery: (q: string) => void;
  setSelectedCategory: (cat: IntegrationCategory | 'all') => void;
  openDrawer: (integrationId: string, tab?: 'overview' | 'triggers-actions' | 'connections') => void;
  closeDrawer: () => void;
  setDrawerTab: (tab: 'overview' | 'triggers-actions' | 'connections') => void;
  loadConnections: () => void;
  addConnection: (conn: IntegrationConnection) => void;
  removeConnection: (integrationId: string, label: string) => void;
}

export const useIntegrationStore = create<IntegrationState>((set) => ({
  searchQuery: '',
  selectedCategory: 'all',
  selectedIntegrationId: null,
  drawerOpen: false,
  drawerTab: 'overview',
  connections: [],

  setSearchQuery: (q) => set({ searchQuery: q }),
  setSelectedCategory: (cat) => set({ selectedCategory: cat }),
  openDrawer: (integrationId, tab = 'overview') => set({ selectedIntegrationId: integrationId, drawerOpen: true, drawerTab: tab }),
  closeDrawer: () => set({ drawerOpen: false, selectedIntegrationId: null }),
  setDrawerTab: (tab) => set({ drawerTab: tab }),
  loadConnections: () => set({ connections: getConnections() }),
  addConnection: (conn) => {
    persistConnection(conn);
    set({ connections: getConnections() });
  },
  removeConnection: (integrationId, label) => {
    removeConnection(integrationId, label);
    set({ connections: getConnections() });
  },
}));
