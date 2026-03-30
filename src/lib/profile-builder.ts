import type { Page, TargetOS, ProfileDefinition, WireAction } from './types';
import { DEVICES } from './devices';
import type { DeviceId } from './types';
import { actionConfigToWire } from './actions';
import { generateUuid } from './uuid';

export interface ProfileStoreState {
  profileName: string;
  deviceId: DeviceId;
  deviceModel: string | undefined;
  targetOS: TargetOS;
  pages: Page[];
}

export function buildProfileDefinition(state: ProfileStoreState): ProfileDefinition {
  const device = DEVICES[state.deviceId];

  return {
    name: state.profileName || 'Untitled Profile',
    deviceModel: state.deviceModel ?? device.model,
    pages: state.pages.map((page) => {
      const wireActions: Record<string, WireAction> = {};
      for (const [key, config] of Object.entries(page.actions)) {
        wireActions[key] = actionConfigToWire(config, state.targetOS);
      }
      return {
        uuid: page.id || generateUuid(),
        name: page.name,
        actions: wireActions,
      };
    }),
  };
}
