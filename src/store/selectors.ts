import { useProfileStore } from './profile-store';
import { DEVICES } from '../lib/devices';

export function useCurrentPage() {
  return useProfileStore((s) => s.pages[s.currentPageIndex]);
}

export function useCurrentDevice() {
  return useProfileStore((s) => DEVICES[s.deviceId]);
}

export function useSelectedAction() {
  return useProfileStore((s) => {
    const page = s.pages[s.currentPageIndex];
    return s.selectedKey ? page?.actions[s.selectedKey] ?? null : null;
  });
}

export function useSelectedIcon() {
  return useProfileStore((s) => {
    const page = s.pages[s.currentPageIndex];
    return s.selectedKey ? page?.icons[s.selectedKey] ?? null : null;
  });
}
