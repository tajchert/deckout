import type {
  ActionConfig, SubActionConfig, SimpleActionConfig, TargetOS,
  WireAction, WireSubAction, WireHotkeyDefinition, ModifierFlags,
} from './types';
import { computeModifierBitmask, NULL_HOTKEY } from './keycodes';

export const ACTION_UUIDS = {
  HOTKEY: 'com.elgato.streamdeck.system.hotkey',
  OPEN: 'com.elgato.streamdeck.system.open',
  WEBSITE: 'com.elgato.streamdeck.system.website',
  TEXT: 'com.elgato.streamdeck.system.text',
  MULTI_ACTION: 'com.elgato.streamdeck.multiactions.routine',
  DELAY: 'com.elgato.streamdeck.multiactions.delay',
  SWITCH_PROFILE: 'com.elgato.streamdeck.profile.rotate',
  OPEN_FOLDER: 'com.elgato.streamdeck.profile.openchild',
  BACK_TO_PARENT: 'com.elgato.streamdeck.profile.backtoparent',
  NEXT_PAGE: 'com.elgato.streamdeck.page.next',
  PREVIOUS_PAGE: 'com.elgato.streamdeck.page.previous',
  MUTE: 'com.elgato.streamdeck.system.mute',
  VOLUME_UP: 'com.elgato.streamdeck.system.volumeup',
  VOLUME_DOWN: 'com.elgato.streamdeck.system.volumedown',
  MEDIA_PLAY: 'com.elgato.streamdeck.system.mediaplay',
  MEDIA_NEXT: 'com.elgato.streamdeck.system.medianext',
  MEDIA_PREVIOUS: 'com.elgato.streamdeck.system.mediaprevious',
} as const;

const ZERO_ACTION_ID = '00000000-0000-0000-0000-000000000000';

function buildHotkeyDef(modifiers: ModifierFlags, keyCode: { nativeCode: number; qtKeyCode: number; vKeyCode: number }): WireHotkeyDefinition {
  return {
    KeyCmd: modifiers.cmd,
    KeyCtrl: modifiers.ctrl,
    KeyModifiers: computeModifierBitmask(modifiers),
    KeyOption: modifiers.option,
    KeyShift: modifiers.shift,
    NativeCode: keyCode.nativeCode,
    QTKeyCode: keyCode.qtKeyCode,
    VKeyCode: keyCode.vKeyCode,
  };
}

const MEDIA_UUID_MAP: Record<string, string> = {
  'mute': ACTION_UUIDS.MUTE,
  'volume-up': ACTION_UUIDS.VOLUME_UP,
  'volume-down': ACTION_UUIDS.VOLUME_DOWN,
  'play-pause': ACTION_UUIDS.MEDIA_PLAY,
  'next-track': ACTION_UUIDS.MEDIA_NEXT,
  'previous-track': ACTION_UUIDS.MEDIA_PREVIOUS,
};

const MEDIA_NAME_MAP: Record<string, string> = {
  'mute': 'Mute',
  'volume-up': 'Volume Up',
  'volume-down': 'Volume Down',
  'play-pause': 'Play / Pause',
  'next-track': 'Next Track',
  'previous-track': 'Previous Track',
};

const NAV_UUID_MAP: Record<string, string> = {
  'switch-profile': ACTION_UUIDS.SWITCH_PROFILE,
  'open-folder': ACTION_UUIDS.OPEN_FOLDER,
  'back-to-parent': ACTION_UUIDS.BACK_TO_PARENT,
  'next-page': ACTION_UUIDS.NEXT_PAGE,
  'previous-page': ACTION_UUIDS.PREVIOUS_PAGE,
};

const NAV_NAME_MAP: Record<string, string> = {
  'switch-profile': 'Switch Profile',
  'open-folder': 'Create Folder',
  'back-to-parent': 'Open Folder',
  'next-page': 'Next Page',
  'previous-page': 'Previous Page',
};

function simpleActionToWire(config: SimpleActionConfig, _targetOS: TargetOS): { uuid: string; name: string; settings: Record<string, unknown> | null } {
  switch (config.type) {
    case 'hotkey':
      return {
        uuid: ACTION_UUIDS.HOTKEY,
        name: 'Hotkey',
        settings: { Hotkeys: [buildHotkeyDef(config.modifiers, config.keyCode), NULL_HOTKEY] },
      };
    case 'open':
      return {
        uuid: ACTION_UUIDS.OPEN,
        name: 'Open',
        settings: { openInBrowser: true, path: `"${config.path}"` },
      };
    case 'website':
      return {
        uuid: ACTION_UUIDS.WEBSITE,
        name: 'Website',
        settings: { openInBrowser: true, path: config.url },
      };
    case 'text':
      return {
        uuid: ACTION_UUIDS.TEXT,
        name: 'Text',
        settings: { text: config.text, sendEnter: config.sendEnter },
      };
    case 'navigation':
      return {
        uuid: NAV_UUID_MAP[config.navType],
        name: NAV_NAME_MAP[config.navType],
        settings: config.profileUuid ? { ProfileUUID: config.profileUuid } : null,
      };
    case 'media':
      return {
        uuid: MEDIA_UUID_MAP[config.mediaType],
        name: MEDIA_NAME_MAP[config.mediaType],
        settings: null,
      };
  }
}

function subActionToWire(sub: SubActionConfig, targetOS: TargetOS): WireSubAction {
  if (sub.type === 'delay') {
    return {
      Name: 'Delay',
      UUID: ACTION_UUIDS.DELAY,
      Settings: { Delay: sub.delayMs },
      OverrideState: -1,
      State: 0,
      States: [{}],
    };
  }
  const { uuid, name, settings } = simpleActionToWire(sub.action, targetOS);
  return {
    Name: name,
    UUID: uuid,
    Settings: settings,
    OverrideState: -1,
    State: 0,
    States: [{ Title: sub.action.title }],
  };
}

export function actionConfigToWire(config: ActionConfig, targetOS: TargetOS): WireAction {
  if (config.type === 'multi-action') {
    return {
      ActionID: ZERO_ACTION_ID,
      LinkedTitle: true,
      Name: 'Multi Action',
      UUID: ACTION_UUIDS.MULTI_ACTION,
      Settings: {
        Routine: config.subActions.map(s => subActionToWire(s, targetOS)),
        RoutineAlt: [],
      },
      State: 0,
      States: [{ Title: config.title }],
    };
  }

  if (config.type === 'multi-action-toggle') {
    return {
      ActionID: ZERO_ACTION_ID,
      LinkedTitle: false,
      Name: 'Multi Action',
      UUID: ACTION_UUIDS.MULTI_ACTION,
      Settings: {
        Routine: config.routine.map(s => subActionToWire(s, targetOS)),
        RoutineAlt: config.routineAlt.map(s => subActionToWire(s, targetOS)),
      },
      State: 0,
      States: [{ Title: config.title }, { Title: config.title }],
    };
  }

  const { uuid, name, settings } = simpleActionToWire(config, targetOS);
  return {
    ActionID: ZERO_ACTION_ID,
    LinkedTitle: true,
    Name: name,
    UUID: uuid,
    Settings: settings,
    State: 0,
    States: [{ Title: config.title }],
  };
}
