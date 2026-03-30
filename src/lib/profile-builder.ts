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
        const wireAction = actionConfigToWire(config, state.targetOS);
        // If this key has an icon, set Image reference in the state
        if (page.icons[key]) {
          wireAction.States = wireAction.States.map((s) => ({
            ...s,
            Image: 'state0.png',
          }));
        }
        wireActions[key] = wireAction;
      }
      // Also create wire actions for keys that have icons but no action
      for (const key of Object.keys(page.icons)) {
        if (!wireActions[key]) {
          // Empty action placeholder — just holds the image
          wireActions[key] = {
            ActionID: '00000000-0000-0000-0000-000000000000',
            LinkedTitle: true,
            Name: '',
            UUID: '',
            Settings: null,
            State: 0,
            States: [{ Image: 'state0.png' }],
          };
        }
      }
      return {
        uuid: page.id || generateUuid(),
        name: page.name,
        actions: wireActions,
        icons: page.icons,
      };
    }),
  };
}
