import { create } from 'zustand';
import type { ActionConfig, DeviceId, Page, TargetOS } from '../lib/types';
import { generateUuid } from '../lib/uuid';

interface ProfileStore {
  profileName: string;
  deviceId: DeviceId;
  deviceModel: string | undefined;
  targetOS: TargetOS;
  pages: Page[];
  currentPageIndex: number;
  selectedKey: string | null;

  setProfileName: (name: string) => void;
  setDevice: (id: DeviceId) => void;
  setDeviceModel: (model: string | undefined) => void;
  setTargetOS: (os: TargetOS) => void;

  addPage: () => void;
  removePage: (index: number) => void;
  setCurrentPage: (index: number) => void;

  selectKey: (key: string | null) => void;
  setAction: (key: string, action: ActionConfig) => void;
  clearAction: (key: string) => void;
}

let pageCounter = 0;

export function createDefaultPage(name?: string): Page {
  pageCounter++;
  return { id: generateUuid(), name: name ?? `Page ${pageCounter}`, actions: {} };
}

const INITIAL_PAGE: Page = { id: '00000000-0000-4000-8000-000000000001', name: 'Page 1', actions: {} };

export const useProfileStore = create<ProfileStore>((set) => ({
  profileName: 'My Profile',
  deviceId: 'mk2',
  deviceModel: undefined,
  targetOS: 'macos',
  pages: [INITIAL_PAGE],
  currentPageIndex: 0,
  selectedKey: null,

  setProfileName: (name) => set({ profileName: name }),

  setDevice: (id) => set({ deviceId: id, selectedKey: null }),

  setDeviceModel: (model) => set({ deviceModel: model }),

  setTargetOS: (os) => set({ targetOS: os }),

  addPage: () =>
    set((state) => {
      const newPage: Page = {
        id: generateUuid(),
        name: `Page ${state.pages.length + 1}`,
        actions: {},
      };
      return {
        pages: [...state.pages, newPage],
        currentPageIndex: state.pages.length,
        selectedKey: null,
      };
    }),

  removePage: (index) =>
    set((state) => {
      if (state.pages.length <= 1) return state;
      const pages = state.pages.filter((_, i) => i !== index);
      const currentPageIndex = Math.min(state.currentPageIndex, pages.length - 1);
      return { pages, currentPageIndex, selectedKey: null };
    }),

  setCurrentPage: (index) => set({ currentPageIndex: index, selectedKey: null }),

  selectKey: (key) => set({ selectedKey: key }),

  setAction: (key, action) =>
    set((state) => {
      const pages = [...state.pages];
      const page = { ...pages[state.currentPageIndex] };
      page.actions = { ...page.actions, [key]: action };
      pages[state.currentPageIndex] = page;
      return { pages };
    }),

  clearAction: (key) =>
    set((state) => {
      const pages = [...state.pages];
      const page = { ...pages[state.currentPageIndex] };
      const actions = { ...page.actions };
      delete actions[key];
      page.actions = actions;
      pages[state.currentPageIndex] = page;
      return { pages };
    }),
}));
