// ---- Device Types ----

export type DeviceId = 'mini' | 'neo' | 'mk2' | 'xl' | 'plus' | 'plus-xl' | 'pedal' | 'studio';

export interface DeviceDefinition {
  id: DeviceId;
  name: string;
  cols: number;
  rows: number;
  totalKeys: number;
  model?: string;
  deviceType: number;
}

// ---- App-Level Action Types (form-friendly) ----

export type TargetOS = 'macos' | 'windows';

export interface ModifierFlags {
  cmd: boolean;
  ctrl: boolean;
  option: boolean;
  shift: boolean;
}

export interface KeyCodeEntry {
  name: string;
  nativeCode: number;
  qtKeyCode: number;
  vKeyCode: number;
}

export type NavigationType = 'switch-profile' | 'open-folder' | 'back-to-parent' | 'next-page' | 'previous-page';
export type MediaType = 'mute' | 'volume-up' | 'volume-down' | 'play-pause' | 'next-track' | 'previous-track';

export type ActionConfig =
  | { type: 'hotkey'; title: string; modifiers: ModifierFlags; keyCode: KeyCodeEntry }
  | { type: 'open'; title: string; path: string }
  | { type: 'website'; title: string; url: string }
  | { type: 'text'; title: string; text: string; sendEnter: boolean }
  | { type: 'multi-action'; title: string; subActions: SubActionConfig[] }
  | { type: 'multi-action-toggle'; title: string; routine: SubActionConfig[]; routineAlt: SubActionConfig[] }
  | { type: 'navigation'; title: string; navType: NavigationType; profileUuid?: string }
  | { type: 'media'; title: string; mediaType: MediaType };

export type SubActionConfig =
  | { id: string; type: 'delay'; delayMs: number }
  | { id: string; type: 'action'; action: SimpleActionConfig };

export type SimpleActionConfig = Extract<ActionConfig,
  | { type: 'hotkey' }
  | { type: 'open' }
  | { type: 'website' }
  | { type: 'text' }
  | { type: 'navigation' }
  | { type: 'media' }
>;

// ---- Icon Config ----

export interface IconConfig {
  emoji?: string;
  bgColor: string;
  imageDataUrl?: string;
}

// ---- Page / Profile ----

export interface Page {
  id: string;
  name: string;
  actions: Record<string, ActionConfig>;
  icons: Record<string, IconConfig>;
}

// ---- Wire Format Types (Elgato V2) ----

export interface WireActionState {
  Title?: string;
  Image?: string;
  ShowTitle?: boolean;
  TitleAlignment?: 'top' | 'middle' | 'bottom';
  TitleColor?: string;
  FontFamily?: string;
  FontSize?: number;
  FontStyle?: 'Regular' | 'Bold' | 'Italic' | 'Bold Italic';
  FontUnderline?: boolean;
}

export interface WireAction {
  ActionID: string;
  LinkedTitle: boolean;
  Name: string;
  UUID: string;
  Settings: Record<string, unknown> | null;
  State: number;
  States: WireActionState[];
}

export interface WireSubAction {
  Name: string;
  UUID: string;
  Settings: Record<string, unknown> | null;
  OverrideState: number;
  State: number;
  States: WireActionState[];
}

export interface WirePageManifest {
  Controllers: Array<{
    Actions: Record<string, WireAction>;
    Type: 'Keypad';
  }>;
}

export interface WireBundleManifest {
  Name: string;
  Pages: {
    Current: string;
    Pages: string[];
  };
  Version: '2.0';
  Device?: {
    Model: string;
    UUID: string;
  };
}

export interface WireHotkeyDefinition {
  KeyCmd: boolean;
  KeyCtrl: boolean;
  KeyModifiers: number;
  KeyOption: boolean;
  KeyShift: boolean;
  NativeCode: number;
  QTKeyCode: number;
  VKeyCode: number;
}

export interface ProfilePage {
  uuid: string;
  name: string;
  actions: Record<string, WireAction>;
  icons: Record<string, IconConfig>;
}

export interface ProfileDefinition {
  name: string;
  pages: ProfilePage[];
  deviceModel?: string;
}
