# Elgato Stream Deck Profile File Format (.streamDeckProfile)

## Reverse-Engineered Specification for Programmatic Profile Generation

> **Status:** Community reverse-engineered — not an official Elgato specification.
> **Target audience:** Developers building tools (especially web/TypeScript/JS) to programmatically create `.streamDeckProfile` files without requiring the Elgato Stream Deck desktop application.
> **Last updated:** 2026-03-30

---

## Table of Contents

1. [Overview](#1-overview)
2. [File Container Structure](#2-file-container-structure)
3. [Format Versions (V1 vs V2)](#3-format-versions-v1-vs-v2)
4. [Top-Level Manifest (Bundle Manifest)](#4-top-level-manifest-bundle-manifest)
5. [Page / Profile Manifest](#5-page--profile-manifest)
6. [Action Object Schema](#6-action-object-schema)
7. [Built-In Action UUIDs & Settings](#7-built-in-action-uuids--settings)
    - [Multi-Action (Sequence)](#multi-action-run-multiple-actions-in-sequence)
    - [Multi-Action Toggle (Two-State)](#multi-action-toggle-schema-two-state-toggle)
    - [Toggle Actions](#toggle-actions-two-state-actions)
8. [Hotkey Encoding Reference](#8-hotkey-encoding-reference)
9. [Button Images](#9-button-images)
10. [Device Types & Grid Layouts](#10-device-types--grid-layouts)
11. [UUID & Folder ID Generation](#11-uuid--folder-id-generation)
12. [Putting It All Together — TypeScript Implementation Guide](#12-putting-it-all-together--typescript-implementation-guide)
13. [Complete Working Example](#13-complete-working-example)
14. [Known Quirks & Gotchas](#14-known-quirks--gotchas)
15. [References & Prior Art](#15-references--prior-art)

---

## 1. Overview

A `.streamDeckProfile` file is a **ZIP archive** (standard deflate compression) that packages one or more profile pages along with optional button images. When a user double-clicks this file, the Elgato Stream Deck application imports it as a new profile.

The file is conceptually similar to macOS `.app` bundles or Office Open XML — a directory hierarchy compressed into a single distributable file.

### High-Level Architecture

```
MyProfile.streamDeckProfile          ← ZIP archive
└── {ROOT_UUID}.sdProfile/           ← Root directory (UUID of main profile)
    ├── manifest.json                ← Top-level bundle manifest
    ├── Profiles/                    ← Sub-profiles / pages directory
    │   ├── {PAGE_FOLDER_ID}/        ← Base32-encoded page folder
    │   │   ├── manifest.json        ← Page action layout
    │   │   └── {col},{row}/         ← Per-button directories (optional)
    │   │       └── CustomImages/
    │   │           └── state0.png   ← Button icon for state 0
    │   └── {PAGE_FOLDER_ID_2}/
    │       └── manifest.json
    ├── {col},{row}/                  ← V1: Button dirs at root level
    │   └── CustomImages/
    │       └── state0.png
    └── Profiles/                    ← Child profiles (folders) go here
```

---

## 2. File Container Structure

### ZIP Archive Rules

- Standard ZIP format, compatible with any ZIP library (JSZip, archiver, etc.)
- The root entry inside the ZIP is a folder named `{UUID}.sdProfile` where `{UUID}` is an uppercase UUID v4 (e.g., `2E9FD815-4DF9-4152-BB96-09F20FE43165.sdProfile`)
- The file extension **must** be `.streamDeckProfile` (case-sensitive on macOS)
- There is no file signature or magic bytes beyond the standard ZIP header (`PK`)

### Minimal Valid Archive

At minimum, a valid `.streamDeckProfile` contains:

```
{UUID}.sdProfile/
├── manifest.json          ← The bundle manifest (see §4)
└── Profiles/
    └── {PAGE_FOLDER_ID}/
        └── manifest.json  ← At least one page with button actions (see §5)
```

---

## 3. Format Versions (V1 vs V2)

Two manifest format generations have been observed in the wild.

### V1 (Legacy — Stream Deck software < 6.x)

The V1 format uses a **flat structure** where `Actions` is a top-level key in the manifest:

```json
{
  "Actions": { "0,0": { ... }, "1,0": { ... } },
  "DeviceModel": "20GAA9901",
  "Name": "My Profile",
  "Version": "1.0"
}
```

- Actions, custom images, and folders live directly inside the `.sdProfile` root
- The `Actions` key maps `"col,row"` strings directly to action objects
- Image directories (`{col},{row}/CustomImages/`) are siblings of `manifest.json`
- No `Profiles/` subdirectory is used for pages — only for child folder profiles

### V2 (Current — Stream Deck software 6.x+)

The V2 format introduces a **page-based hierarchy** using the `Controllers` array:

```json
{
  "Controllers": [
    {
      "Actions": { "0,0": { ... }, "1,0": { ... } },
      "Type": "Keypad"
    }
  ]
}
```

The top-level bundle manifest (§4) references page UUIDs, and each page has its own `manifest.json` inside `Profiles/{PAGE_FOLDER_ID}/`.

### Which Version Should You Generate?

**V2 is recommended** for new tooling. It is compatible with Stream Deck software 6.x and later (including the current 7.x series). The V1 format still imports correctly on modern software but may not support newer features like multi-page profiles and Stream Deck+ encoders.

However, **V1 is simpler** and still works. The proof-of-concept generator by `data-enabler` produces V1-compatible files that import without issues. For maximum compatibility, the examples in this document cover both formats.

---

## 4. Top-Level Manifest (Bundle Manifest)

Located at `{UUID}.sdProfile/manifest.json`, this is the entry point that the Stream Deck software reads first when importing a profile.

### V2 Bundle Manifest Schema

```jsonc
{
  // Optional: binds the profile to a specific device model
  "Device": {
    "Model": "20GAA9901",    // Hardware model number (see §10)
    "UUID": ""               // Always empty string in exported profiles
  },

  // Human-readable profile name (displayed in Stream Deck app)
  "Name": "My Custom Profile",

  // Page navigation structure
  "Pages": {
    "Current": "xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx",  // UUID of the initially active page
    "Pages": [
      "xxxxxxxx-xxxx-4xxx-xxxx-xxxxxxxxxxxx",           // Ordered array of page UUIDs
      "yyyyyyyy-yyyy-4yyy-yyyy-yyyyyyyyyyyy"
    ]
  },

  // Format version
  "Version": "2.0"
}
```

### V1 Bundle Manifest Schema

In V1, there is **no separate bundle manifest**. The single `manifest.json` at the root contains both the metadata AND the action definitions:

```jsonc
{
  "Actions": { /* ... action map ... */ },
  "DeviceModel": "20GAA9901",   // Optional hardware model
  "Name": "My Profile",
  "Version": "1.0"
}
```

### Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `Name` | `string` | Yes | Display name of the profile |
| `Version` | `"1.0"` or `"2.0"` | Yes | `"1.0"` for V1, `"2.0"` for V2 |
| `Device.Model` | `string` | No | Hardware model string. Omit to make the profile device-agnostic. |
| `Device.UUID` | `string` | No | Always `""` in exported profiles |
| `DeviceModel` | `string` | No | V1 equivalent of `Device.Model` |
| `Pages.Current` | `string` (UUID) | V2 only | UUID of the default/first visible page |
| `Pages.Pages` | `string[]` (UUID array) | V2 only | Ordered list of all page UUIDs |

---

## 5. Page / Profile Manifest

In V2, each page has its own `manifest.json` at:
```
{UUID}.sdProfile/Profiles/{PAGE_FOLDER_ID}/manifest.json
```

Where `{PAGE_FOLDER_ID}` is a **base32-encoded transformation** of the page's UUID (see §11).

### Page Manifest Schema (V2)

```jsonc
{
  "Controllers": [
    {
      "Actions": {
        "0,0": { /* Action object — see §6 */ },
        "1,0": { /* ... */ },
        "0,1": { /* ... */ },
        // Keys: "col,row" — 0-indexed
      },
      "Type": "Keypad"    // "Keypad" for buttons, "Encoder" for dials (SD+)
    }
  ]
}
```

### V1 Page Manifest Schema

In V1, the action map is directly in the root manifest (no separate page files needed for single-page profiles):

```jsonc
{
  "Actions": {
    "0,0": { /* Action object */ },
    "1,0": { /* ... */ }
  },
  "DeviceModel": "20GAA9901",
  "Name": "My Profile",
  "Version": "1.0"
}
```

### Button Coordinate System

Buttons are addressed with `"col,row"` string keys (both zero-indexed):

```
Stream Deck Standard (5 columns × 3 rows):

         Col 0    Col 1    Col 2    Col 3    Col 4
Row 0   ["0,0"]  ["1,0"]  ["2,0"]  ["3,0"]  ["4,0"]
Row 1   ["0,1"]  ["1,1"]  ["2,1"]  ["3,1"]  ["4,1"]
Row 2   ["0,2"]  ["1,2"]  ["2,2"]  ["3,2"]  ["4,2"]
```

**Important:** The coordinate format is `"X,Y"` where X = column and Y = row. This is **column-first**, which is the opposite of typical `[row][col]` array indexing.

---

## 6. Action Object Schema

Each button position maps to an action object. Two slightly different schemas exist depending on the format version.

### V2 Action Object (Recommended)

```jsonc
{
  // Unique ID for this action instance (UUID v4, or all-zeros)
  "ActionID": "00000000-0000-0000-0000-000000000000",

  // Whether the title is shared across all states
  "LinkedTitle": true,

  // Human-readable name of the action type
  "Name": "Hotkey",

  // Action-type identifier (reverse-DNS format)
  "UUID": "com.elgato.streamdeck.system.hotkey",

  // Action-specific configuration
  "Settings": {
    // Contents depend on the UUID — see §7
  },

  // Active state index (0-based)
  "State": 0,

  // Visual configuration for each state
  "States": [
    {
      // Button label text (supports \n for line breaks)
      "Title": "My Button",

      // Path to custom image file (relative to the button's directory)
      "Image": "state0.png",

      // Whether to display the title overlay
      "ShowTitle": true,

      // Title vertical alignment
      "TitleAlignment": "bottom",   // "top" | "middle" | "bottom"

      // Title text color as hex (with or without #)
      "TitleColor": "#ffffff",

      // Font configuration
      "FontFamily": "Verdana",
      "FontSize": 12,              // Can also be string: "12"
      "FontStyle": "Regular",      // "Regular" | "Bold" | "Italic" | "Bold Italic"
      "FontUnderline": false       // Can also be string: "off"/"on"
    }
  ]
}
```

### V1 Action Object (Legacy)

```jsonc
{
  "Name": "Hotkey",
  "UUID": "com.elgato.streamdeck.system.hotkey",
  "Settings": { /* ... */ },
  "State": 0,
  "States": [
    {
      "FFamily": "Verdana",         // V1 uses abbreviated keys
      "FSize": "12",                // Always a string in V1
      "FStyle": "Regular",
      "FUnderline": "off",          // "on" or "off" string
      "Image": "state0.png",
      "Title": "My Button",
      "TitleAlignment": "middle",
      "TitleColor": "",             // Empty string = default
      "TitleShow": "hide"           // "hide" or "show" string
    }
  ]
}
```

### V1 vs V2 State Property Name Mapping

| V1 Key | V2 Key | Notes |
|--------|--------|-------|
| `FFamily` | `FontFamily` | |
| `FSize` | `FontSize` | V1: string, V2: number or string |
| `FStyle` | `FontStyle` | |
| `FUnderline` | `FontUnderline` | V1: `"on"`/`"off"`, V2: `true`/`false` |
| `TitleShow` | `ShowTitle` | V1: `"show"`/`"hide"`, V2: `true`/`false` |
| `TitleAlignment` | `TitleAlignment` | Same in both |
| `TitleColor` | `TitleColor` | Same in both |
| `Title` | `Title` | Same in both |
| `Image` | `Image` | Same in both |

---

## 7. Built-In Action UUIDs & Settings

These are the UUIDs for actions built into the Stream Deck software (no plugin required).

### System Actions

#### Hotkey
Sends a keyboard shortcut when pressed.

```jsonc
{
  "UUID": "com.elgato.streamdeck.system.hotkey",
  "Name": "Hotkey",
  "Settings": {
    "Hotkeys": [
      {
        "KeyCmd": false,        // macOS Command key
        "KeyCtrl": false,       // Control key
        "KeyModifiers": 0,      // Bitmask of modifier keys (see §8)
        "KeyOption": false,     // macOS Option / Windows Alt key
        "KeyShift": false,      // Shift key
        "NativeCode": 65,       // OS-native key code
        "QTKeyCode": 65,        // Qt framework key code
        "VKeyCode": 65          // Windows Virtual Key code (-1 on macOS)
      },
      {
        // Second entry is the "release" key — typically an empty/null key
        "KeyCmd": false,
        "KeyCtrl": false,
        "KeyModifiers": 0,
        "KeyOption": false,
        "KeyShift": false,
        "NativeCode": 146,      // 146 = no key
        "QTKeyCode": 33554431,  // Qt "unknown" key
        "VKeyCode": -1          // -1 = no key
      }
    ]
  }
}
```

#### Open (Launch Application/File)
Opens a file or application.

```jsonc
{
  "UUID": "com.elgato.streamdeck.system.open",
  "Name": "Open",
  "Settings": {
    "openInBrowser": true,
    "path": "\"/Applications/Safari.app\""   // Quoted path string
  }
}
```

#### Website
Opens a URL in the default browser.

```jsonc
{
  "UUID": "com.elgato.streamdeck.system.website",
  "Name": "Website",
  "Settings": {
    "openInBrowser": true,
    "path": "https://example.com"
  }
}
```

#### Text (Type Text)
Types a string of text.

```jsonc
{
  "UUID": "com.elgato.streamdeck.system.text",
  "Name": "Text",
  "Settings": {
    "text": "Hello, world!",
    "sendEnter": false            // Whether to press Enter after typing
  }
}
```

### Navigation Actions

#### Switch Profile
Switches to a different top-level profile.

```jsonc
{
  "UUID": "com.elgato.streamdeck.profile.rotate",
  "Name": "Switch Profile",
  "Settings": {
    "ProfileUUID": "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
  }
}
```

#### Open Folder (Navigate to Child Profile)
Opens a child/sub-profile (folder).

```jsonc
{
  "UUID": "com.elgato.streamdeck.profile.openchild",
  "Name": "Create Folder",
  "Settings": {
    "ProfileUUID": "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
  }
}
```

#### Back to Parent
Returns from a child profile to the parent.

```jsonc
{
  "UUID": "com.elgato.streamdeck.profile.backtoparent",
  "Name": "Open Folder",
  "Settings": null
}
```

#### Next Page / Previous Page
Navigates between pages in a multi-page profile.

```jsonc
// Next Page
{
  "UUID": "com.elgato.streamdeck.page.next",
  "Name": "Next Page",
  "Settings": null
}

// Previous Page
{
  "UUID": "com.elgato.streamdeck.page.previous",
  "Name": "Previous Page",
  "Settings": null
}
```

### Multimedia Actions

```jsonc
// Mute/Unmute System Audio
{ "UUID": "com.elgato.streamdeck.system.mute", "Name": "Mute" }

// Volume Up
{ "UUID": "com.elgato.streamdeck.system.volumeup", "Name": "Volume Up" }

// Volume Down
{ "UUID": "com.elgato.streamdeck.system.volumedown", "Name": "Volume Down" }

// Play/Pause Media
{ "UUID": "com.elgato.streamdeck.system.mediaplay", "Name": "Play / Pause" }

// Next Track
{ "UUID": "com.elgato.streamdeck.system.medianext", "Name": "Next Track" }

// Previous Track
{ "UUID": "com.elgato.streamdeck.system.mediaprevious", "Name": "Previous Track" }
```

### Plugin Actions (Require Installed Plugin)

These UUIDs belong to plugins and require the respective plugin to be installed:

```
com.elgato.obsstudio.scene           — OBS Studio: Scene Switch
com.elgato.obsstudio.source          — OBS Studio: Source Visibility
com.elgato.obsstudio.studiomode      — OBS Studio: Studio Mode Toggle
com.elgato.obsstudio.record          — OBS Studio: Start/Stop Recording
com.elgato.obsstudio.stream          — OBS Studio: Start/Stop Streaming
com.elgato.twitch.streamtitle        — Twitch: Set Stream Title
com.elgato.twitch.chatmessage        — Twitch: Send Chat Message
gg.datagram.web-requests.http        — Web Requests: HTTP Request
gg.datagram.web-requests.websocket   — Web Requests: WebSocket Message
```

### Multi-Action (Run Multiple Actions in Sequence)

A Multi-Action bundles several sub-actions into a single button press. The sub-actions execute in order (top-to-bottom) when the key is tapped. The Stream Deck UI also supports configurable delays between sub-actions, stored as `Delay` entries in the `Routine` array.

**UUID:** `com.elgato.streamdeck.multiactions.routine`

The critical detail is that the sub-actions live inside `Settings.Routine` as a **nested array of action-like objects**. Each sub-action has the same shape as a regular action (`Name`, `UUID`, `Settings`, `State`, `States`) plus an additional `OverrideState` field.

#### Multi-Action Schema (Single-Press — No Toggle)

```jsonc
{
  "Name": "Multi Action",
  "UUID": "com.elgato.streamdeck.multiactions.routine",
  "State": 0,
  "States": [
    {
      "Title": "Launch Setup",
      "Image": "state0.png",
      // ... other state properties
    }
  ],
  "Settings": {
    // Ordered array of sub-actions to execute on press
    "Routine": [
      {
        "Name": "Open",
        "UUID": "com.elgato.streamdeck.system.open",
        "OverrideState": -1,    // -1 = don't force state, use current
        "State": 0,
        "Settings": {
          "openInBrowser": true,
          "path": "/Applications/Slack.app"
        },
        "States": [
          {
            "Title": "Slack",
            // ... V1: FFamily, FSize, etc. / V2: FontFamily, FontSize, etc.
          }
        ]
      },
      {
        "Name": "Website",
        "UUID": "com.elgato.streamdeck.system.website",
        "OverrideState": -1,
        "State": 0,
        "Settings": {
          "openInBrowser": true,
          "path": "https://mail.google.com"
        },
        "States": [
          { "Title": "Gmail" }
        ]
      },
      {
        "Name": "Switch Profile",
        "UUID": "com.elgato.streamdeck.profile.rotate",
        "OverrideState": 0,     // 0 = force to state 0
        "State": 0,
        "Settings": {
          "DeviceUUID": "",
          "ProfileUUID": "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
        },
        "States": [
          { "Title": "Work Profile" }
        ]
      }
    ],

    // Empty for single-press Multi-Action (no toggle)
    "RoutineAlt": []
  }
}
```

#### Multi-Action Toggle Schema (Two-State Toggle)

The Multi-Action Toggle variant uses two routines: `Routine` runs on the first press (state 0 → 1), and `RoutineAlt` runs on the second press (state 1 → 0). The outer action has **two** entries in `States` — one visual for each state.

```jsonc
{
  "Name": "Multi Action",
  "UUID": "com.elgato.streamdeck.multiactions.routine",
  "State": 0,
  "States": [
    {
      // State 0 visual — shown when "off" / initial
      "Title": "Start Stream",
      "Image": "state0.png"
    },
    {
      // State 1 visual — shown when "on" / toggled
      "Title": "Stop Stream",
      "Image": "state1.png"
    }
  ],
  "Settings": {
    // Runs when pressing in State 0 (the "activate" press)
    "Routine": [
      {
        "Name": "Scene",
        "UUID": "com.elgato.obsstudio.scene",
        "OverrideState": 1,
        "State": 0,
        "Settings": { "scene": "Live Scene", "target": "program" },
        "States": [ { "Title": "Go Live" }, { "Title": "" } ]
      },
      {
        "Name": "Stream Title",
        "UUID": "com.elgato.twitch.streamtitle",
        "OverrideState": -1,
        "State": 0,
        "Settings": {
          "accountId": "...",
          "ChannelStatus": "We are LIVE!",
          "ChannelGameTitle": "Just Chatting"
        },
        "States": [ { "Title": "Set Title" } ]
      }
    ],

    // Runs when pressing in State 1 (the "deactivate" press)
    "RoutineAlt": [
      {
        "Name": "Scene",
        "UUID": "com.elgato.obsstudio.scene",
        "OverrideState": 0,
        "State": 0,
        "Settings": { "scene": "Ending Scene", "target": "program" },
        "States": [ { "Title": "End" }, { "Title": "" } ]
      }
    ]
  }
}
```

#### Sub-Action `OverrideState` Field

The `OverrideState` field is unique to sub-actions inside a Multi-Action. It tells the Stream Deck what state to force the sub-action into when it fires:

| Value | Meaning |
|-------|---------|
| `-1` | Do not override — use the sub-action's current/default state |
| `0` | Force the sub-action to state 0 when executed |
| `1` | Force the sub-action to state 1 when executed |

This is how the Stream Deck UI exposes the "choose desired state" picker for two-state plugin actions (like setting OBS scene to "preview" or "program").

#### Adding Delays Between Sub-Actions

The Stream Deck app allows inserting delays between sub-actions. In the JSON, these appear as special `Delay` entries in the `Routine` array:

```jsonc
{
  "Settings": {
    "Routine": [
      { /* first sub-action */ },
      {
        "Name": "Delay",
        "UUID": "com.elgato.streamdeck.multiactions.delay",
        "Settings": { "Delay": 1000 },   // Milliseconds
        "State": 0,
        "States": [{}],
        "OverrideState": -1
      },
      { /* second sub-action, runs 1 second after the first */ }
    ]
  }
}
```

### Toggle Actions (Two-State Actions)

Any action — not just Multi-Actions — can have two or more visual states. This is how toggle-style buttons (mute/unmute, on/off, show/hide) work in the Stream Deck ecosystem.

#### How Toggle State Works

The key fields are:

- **`States` array** — Contains one entry per visual state. If the array has 2+ entries, the action is treated as a toggle.
- **`State` field** — The currently active state index (0-based). For a two-state toggle, this is `0` or `1`.
- **Automatic toggling** — By default, the Stream Deck software toggles the `State` between 0 and 1 on each press. Plugin authors can disable this with `DisableAutomaticStates: true` in the plugin manifest.

#### Two-State Toggle Examples from Real Profiles

**Key Light On/Off (Elgato Control Center plugin):**
```jsonc
{
  "Name": "On / Off",
  "UUID": "com.elgato.controlcenter.lights-on-off",
  "State": 0,              // Currently off (state 0)
  "Settings": {
    "deviceID": "BW42J1A06267",
    "name": "Elgato Key Light"
  },
  "States": [
    {
      // State 0: "Off" appearance
      "Title": "",
      "Image": ""           // Plugin provides its own icon
    },
    {
      // State 1: "On" appearance
      "Title": "",
      "Image": ""
    }
  ]
}
```

**OBS Studio Scene (two-state: preview/program):**
```jsonc
{
  "Name": "Scene",
  "UUID": "com.elgato.obsstudio.scene",
  "State": 1,              // Starts in state 1 (program)
  "Settings": {
    "scene": "Main Camera",
    "target": "program"
  },
  "States": [
    { "Title": "Preview" },   // State 0 visual
    { "Title": "Live" }       // State 1 visual
  ]
}
```

**Zoom Mute Toggle (3 states observed — plugin-specific):**
```jsonc
{
  "Name": "Mute Toggle",
  "UUID": "com.lostdomain.zoom.mutetoggle",
  "State": 2,              // Some plugins use >2 states
  "Settings": null,
  "States": [
    { "Title": "" },       // State 0: unknown/connecting
    { "Title": "" },       // State 1: unmuted
    { "Title": "" }        // State 2: muted
  ]
}
```

#### Building Toggle Actions Programmatically

For web-based generators, the toggle pattern is straightforward:

```typescript
function createToggleAction(
  uuid: string,
  name: string,
  settings: Record<string, unknown> | null,
  stateLabels: [string, string],         // [offLabel, onLabel]
  stateImages?: [string?, string?],      // Optional per-state images
  initialState: number = 0
): Action {
  return {
    ActionID: '00000000-0000-0000-0000-000000000000',
    LinkedTitle: false,     // false = each state has its own title
    Name: name,
    UUID: uuid,
    Settings: settings,
    State: initialState,
    States: [
      {
        Title: stateLabels[0],
        ...(stateImages?.[0] && { Image: stateImages[0] }),
      },
      {
        Title: stateLabels[1],
        ...(stateImages?.[1] && { Image: stateImages[1] }),
      },
    ],
  };
}
```

#### `LinkedTitle` and Multi-State Titles

The `LinkedTitle` boolean controls how the `Title` field works across states:

| `LinkedTitle` | Behavior |
|--------------|----------|
| `true` | All states share the same title. Changing the title in one state changes it everywhere. This is the default for single-state actions. |
| `false` | Each state has its own independent `Title` in its `States` entry. This is what you want for toggles where the button label changes (e.g., "Mute" ↔ "Unmute"). |

### Multi-Action TypeScript Builder

```typescript
interface SubAction {
  Name: string;
  UUID: string;
  Settings: Record<string, unknown> | null;
  OverrideState: number;    // -1 = don't override, 0+ = force state
  State: number;
  States: ActionState[];
}

function createMultiAction(
  title: string,
  subActions: SubAction[],
  altSubActions?: SubAction[]    // If provided, creates a toggle
): Action {
  const isToggle = altSubActions && altSubActions.length > 0;
  return {
    ActionID: '00000000-0000-0000-0000-000000000000',
    LinkedTitle: !isToggle,
    Name: 'Multi Action',
    UUID: 'com.elgato.streamdeck.multiactions.routine',
    Settings: {
      Routine: subActions,
      RoutineAlt: altSubActions || [],
    },
    State: 0,
    States: isToggle
      ? [{ Title: title }, { Title: title }]
      : [{ Title: title }],
  };
}

function createSubAction(
  name: string,
  uuid: string,
  settings: Record<string, unknown> | null,
  overrideState: number = -1,
  title: string = ''
): SubAction {
  return {
    Name: name,
    UUID: uuid,
    Settings: settings,
    OverrideState: overrideState,
    State: 0,
    States: [{ Title: title }],
  };
}

function createDelaySubAction(delayMs: number): SubAction {
  return {
    Name: 'Delay',
    UUID: 'com.elgato.streamdeck.multiactions.delay',
    Settings: { Delay: delayMs },
    OverrideState: -1,
    State: 0,
    States: [{}],
  };
}
```

#### Complete Multi-Action Example

```typescript
// "Morning Routine" button: opens apps, waits, switches profile
const morningRoutine = createMultiAction('Morning\nRoutine', [
  createSubAction(
    'Open', 'com.elgato.streamdeck.system.open',
    { openInBrowser: true, path: '/Applications/Slack.app' },
    -1, 'Slack'
  ),
  createSubAction(
    'Open', 'com.elgato.streamdeck.system.open',
    { openInBrowser: true, path: '/Applications/Safari.app' },
    -1, 'Safari'
  ),
  createDelaySubAction(2000),   // Wait 2 seconds
  createSubAction(
    'Website', 'com.elgato.streamdeck.system.website',
    { openInBrowser: true, path: 'https://mail.google.com' },
    -1, 'Gmail'
  ),
]);
```

---

## 8. Hotkey Encoding Reference

The hotkey action uses a combination of native key codes and modifier bitmasks. The exact codes are OS-dependent.

### Modifier Bitmask (`KeyModifiers`)

| Modifier | Bitmask Value | Boolean Field |
|----------|--------------|---------------|
| None | `0` | all false |
| Shift | `2` | `KeyShift: true` |
| Control | `4096` (0x1000) | `KeyCtrl: true` |
| Option/Alt | `4` | `KeyOption: true` |
| Command (macOS) | `8` | `KeyCmd: true` |
| Numpad (macOS) | `16384` (0x4000) | — |

Multiple modifiers are combined by addition. For example, Ctrl+Shift = `4098` (4096 + 2).

### Common Key Codes (macOS NativeCode)

These are macOS native keycodes (Carbon/IOKit HID). Windows uses `VKeyCode` (Windows Virtual Keycodes) instead.

| Key | NativeCode (macOS) | VKeyCode (Windows) | QTKeyCode |
|-----|-------------------|-------------------|-----------|
| A | 0 | 65 | 65 |
| S | 1 | 83 | 83 |
| D | 2 | 68 | 68 |
| F | 3 | 70 | 70 |
| Space | 49 | 32 | 32 |
| Return | 36 | 13 | 16777220 |
| Enter (numpad) | 76 | — | 16777221 |
| Escape | 53 | 27 | 16777216 |
| Tab | 48 | 9 | 16777217 |
| Delete/Backspace | 51 | 8 | 16777219 |
| Arrow Up | 126 | 38 | 16777235 |
| Arrow Down | 125 | 40 | 16777237 |
| Arrow Left | 123 | 37 | 16777234 |
| Arrow Right | 124 | 39 | 16777236 |
| F1 | 122 | 112 | 16777264 |
| F2 | 120 | 113 | 16777265 |
| Numpad 0 | 82 | 96 | 48 |
| Numpad 1 | 83 | 97 | 49 |
| No key (sentinel) | -1 or 146 | -1 | 33554431 |

### Null/Empty Hotkey Sentinel

The second element in the `Hotkeys` array is always a "null key" sentinel that indicates the release state:

```json
{
  "KeyCmd": false,
  "KeyCtrl": false,
  "KeyModifiers": 0,
  "KeyOption": false,
  "KeyShift": false,
  "NativeCode": 146,
  "QTKeyCode": 33554431,
  "VKeyCode": -1
}
```

### Practical Tip: Discovering Key Codes

The easiest way to discover the correct key codes for a specific shortcut is to:
1. Create a profile manually in the Stream Deck app with the desired hotkey
2. Export it as `.streamDeckProfile`
3. Unzip and read the `manifest.json`
4. Copy the `Hotkeys` array values

---

## 9. Button Images

### Image Specifications

| Property | Value |
|----------|-------|
| Format | PNG (RGBA, 8-bit) |
| Dimensions | **288 × 288 px** (all devices use this) |
| Color space | sRGB |
| Transparency | Supported |
| @2x variants | 144 × 144 px (for non-retina; not required in profiles) |

### Image File Location

Images are placed in per-button directories at the appropriate level:

**V2 (pages):**
```
{UUID}.sdProfile/Profiles/{PAGE_FOLDER_ID}/{col},{row}/CustomImages/state0.png
```

**V1 (flat):**
```
{UUID}.sdProfile/{col},{row}/CustomImages/state0.png
```

The `Image` field in the state object references the filename:
```json
{ "Image": "state0.png" }
```

For actions with multiple states (e.g., toggles), use `state0.png`, `state1.png`, etc.

### Image Generation for Web

For web-based tools, generate button icons using:
- **Canvas API** — Draw text, shapes, and icons on a 288×288 HTML5 canvas, then export as PNG via `canvas.toBlob()` or `canvas.toDataURL()`
- **Sharp (Node.js)** — Server-side image composition
- **SVG → PNG** — Render SVG to canvas, then extract PNG
- **SDKIG approach** — The `rse/sdkig` tool uses HTML/CSS rendered to PDF then to PNG for icon generation

### Recommended Design Guidelines

- Use a background fill (avoid fully transparent icons — they look odd on Stream Deck screens)
- For key icons with rounded corners, use a border-radius of about 40px at 288×288 scale
- Keep text large and readable (minimum ~45px font size at 288×288)
- Light text on dark backgrounds works best on the OLED/LCD screens

---

## 10. Device Types & Grid Layouts

### Device Enumeration (DeviceType)

| DeviceType | Name | Columns | Rows | Total Keys | Model Numbers |
|-----------|------|---------|------|------------|---------------|
| 0 | Stream Deck (Original/MK.2) | 5 | 3 | 15 | 20GAA9901, 20GAI9901 |
| 1 | Stream Deck Mini | 3 | 2 | 6 | 20GAM9901 |
| 2 | Stream Deck XL | 8 | 4 | 32 | 20GAT9901 |
| 3 | Stream Deck Mobile | Varies | Varies | — | — |
| 4 | Corsair GKeys | — | — | — | — |
| 5 | Stream Deck Pedal | 3 | 1 | 3 | 20GAQ9901 |
| 6 | Corsair Voyager | — | — | — | — |
| 7 | Stream Deck + | 4 | 2 | 8 keys + 4 dials | 20GBD9901 |
| 8 | Stream Deck Neo | 4 | 2 | 8 | — |
| 9 | Stream Deck + XL | 8 | 2 | 12 keys + 8 dials | — |
| 10+ | Newer/Module devices | — | — | — | — |

### Grid Layout Examples

**Stream Deck Standard (5×3):**
```
[0,0] [1,0] [2,0] [3,0] [4,0]
[0,1] [1,1] [2,1] [3,1] [4,1]
[0,2] [1,2] [2,2] [3,2] [4,2]
```

**Stream Deck Mini (3×2):**
```
[0,0] [1,0] [2,0]
[0,1] [1,1] [2,1]
```

**Stream Deck XL (8×4):**
```
[0,0] [1,0] [2,0] [3,0] [4,0] [5,0] [6,0] [7,0]
[0,1] [1,1] [2,1] [3,1] [4,1] [5,1] [6,1] [7,1]
[0,2] [1,2] [2,2] [3,2] [4,2] [5,2] [6,2] [7,2]
[0,3] [1,3] [2,3] [3,3] [4,3] [5,3] [6,3] [7,3]
```

### Device Model in Manifest

Setting `Device.Model` (V2) or `DeviceModel` (V1) constrains the profile to a specific device. **Omitting this field** creates a device-agnostic profile that the Stream Deck app will adapt to whatever device is available. This is recommended for distribution.

---

## 11. UUID & Folder ID Generation

### Profile UUIDs

Each profile/page uses a standard UUID v4 identifier:

```typescript
import { randomUUID } from 'crypto';

function generateProfileId(): string {
  return randomUUID();  // e.g., "a1b2c3d4-e5f6-4789-abcd-ef0123456789"
}
```

### Action IDs

The `ActionID` field in action objects appears to be non-critical. In exported profiles from the Stream Deck app, these are always unique UUIDs, but the proof-of-concept generator uses all-zeros and profiles still import correctly:

```typescript
function generateActionId(): string {
  // All-zeros works fine for imports
  return '00000000-0000-0000-0000-000000000000';
  // Or generate unique UUIDs if you prefer:
  // return randomUUID();
}
```

### Page Folder ID Encoding (V2 Only)

In V2, the page directory name inside `Profiles/` is **not** the raw UUID. It is a custom base32-like encoding of the UUID. This encoding was reverse-engineered from the `data-enabler/streamdeck-profile-generator` project:

```typescript
function profileFolderIdFromUuid(uuid: string): string {
  return (
    (uuid.replace(/-/g, '') + '000')    // Remove hyphens, pad to divisible-by-5
      .match(/.{5}/g) || []             // Split into 5-digit hex groups
  )
    .map(s =>
      parseInt(s, 16)                    // Parse as hex integer
        .toString(32)                    // Convert to base32
        .padStart(4, '0')               // Pad each group to 4 chars
    )
    .join('')
    .substring(0, 26)                    // Trim padding
    .toUpperCase()
    .replace(/V/g, 'W')                 // Custom alphabet substitution
    .replace(/U/g, 'V')                 // Custom alphabet substitution
    + 'Z';                              // All folder IDs end with 'Z'
}
```

**Example:**
```
UUID:        "a1b2c3d4-e5f6-4789-abcd-ef0123456789"
Folder ID:   "A1B2C3D4E5F64789ABCDEF01Z" (approximately — actual output depends on encoding)
```

**Important:** In V1 format or when generating profiles without the `Profiles/` subdirectory, you do NOT need this encoding. It is only required for V2 page directories.

---

## 12. Putting It All Together — TypeScript Implementation Guide

### Dependency

The only runtime dependency needed is a ZIP library:

```bash
npm install jszip
# TypeScript types:
npm install -D @types/node
```

### Core Types

```typescript
// ---- Types ----

interface ActionState {
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

interface Action {
  ActionID: string;
  LinkedTitle: boolean;
  Name: string;
  UUID: string;
  Settings: Record<string, unknown> | null;
  State: number;
  States: ActionState[];
}

interface PageManifest {
  Controllers: Array<{
    Actions: Record<string, Action>;   // "col,row" → Action
    Type: 'Keypad' | 'Encoder';
  }>;
}

interface BundleManifest {
  Name: string;
  Pages: {
    Current: string;      // UUID of the first/default page
    Pages: string[];      // All page UUIDs in order
  };
  Version: '2.0';
  Device?: {
    Model: string;
    UUID: string;
  };
}

interface HotkeyDefinition {
  KeyCmd: boolean;
  KeyCtrl: boolean;
  KeyModifiers: number;
  KeyOption: boolean;
  KeyShift: boolean;
  NativeCode: number;
  QTKeyCode: number;
  VKeyCode: number;
}

interface ProfilePage {
  uuid: string;
  name: string;
  actions: Record<string, Action>;    // "col,row" → Action
  images?: Map<string, Buffer>;       // "col,row/stateN" → PNG buffer
}

interface ProfileDefinition {
  name: string;
  pages: ProfilePage[];
  deviceModel?: string;
}
```

### Builder Functions

```typescript
import JSZip from 'jszip';
import { randomUUID } from 'crypto';

// ---- Sentinel for the "no key" release entry ----
const NULL_HOTKEY: HotkeyDefinition = {
  KeyCmd: false,
  KeyCtrl: false,
  KeyModifiers: 0,
  KeyOption: false,
  KeyShift: false,
  NativeCode: 146,
  QTKeyCode: 33554431,
  VKeyCode: -1,
};

// ---- Action Builders ----

function createHotkeyAction(
  title: string,
  hotkey: HotkeyDefinition
): Action {
  return {
    ActionID: '00000000-0000-0000-0000-000000000000',
    LinkedTitle: true,
    Name: 'Hotkey',
    UUID: 'com.elgato.streamdeck.system.hotkey',
    Settings: {
      Hotkeys: [hotkey, NULL_HOTKEY],
    },
    State: 0,
    States: [{ Title: title }],
  };
}

function createWebsiteAction(title: string, url: string): Action {
  return {
    ActionID: '00000000-0000-0000-0000-000000000000',
    LinkedTitle: true,
    Name: 'Website',
    UUID: 'com.elgato.streamdeck.system.website',
    Settings: {
      openInBrowser: true,
      path: url,
    },
    State: 0,
    States: [{ Title: title }],
  };
}

function createOpenAction(title: string, path: string): Action {
  return {
    ActionID: '00000000-0000-0000-0000-000000000000',
    LinkedTitle: true,
    Name: 'Open',
    UUID: 'com.elgato.streamdeck.system.open',
    Settings: {
      openInBrowser: true,
      path: `"${path}"`,
    },
    State: 0,
    States: [{ Title: title }],
  };
}

function createTextAction(
  title: string,
  text: string,
  sendEnter = false
): Action {
  return {
    ActionID: '00000000-0000-0000-0000-000000000000',
    LinkedTitle: true,
    Name: 'Text',
    UUID: 'com.elgato.streamdeck.system.text',
    Settings: { text, sendEnter },
    State: 0,
    States: [{ Title: title }],
  };
}

function createFolderAction(childProfileUuid: string, title: string): Action {
  return {
    ActionID: '00000000-0000-0000-0000-000000000000',
    LinkedTitle: true,
    Name: 'Create Folder',
    UUID: 'com.elgato.streamdeck.profile.openchild',
    Settings: { ProfileUUID: childProfileUuid },
    State: 0,
    States: [{ Title: title }],
  };
}

function createBackAction(): Action {
  return {
    ActionID: '00000000-0000-0000-0000-000000000000',
    LinkedTitle: true,
    Name: 'Open Folder',
    UUID: 'com.elgato.streamdeck.profile.backtoparent',
    Settings: null,
    State: 0,
    States: [{ Title: '' }],
  };
}

// ---- Profile Folder ID Encoding ----

function profileFolderId(uuid: string): string {
  return (
    (uuid.replace(/-/g, '') + '000')
      .match(/.{5}/g) || []
  )
    .map((s) => parseInt(s, 16).toString(32).padStart(4, '0'))
    .join('')
    .substring(0, 26)
    .toUpperCase()
    .replace(/V/g, 'W')
    .replace(/U/g, 'V')
    + 'Z';
}

// ---- ZIP Assembly ----

async function buildStreamDeckProfile(
  profile: ProfileDefinition
): Promise<Buffer> {
  const zip = new JSZip();
  const rootUuid = randomUUID().toUpperCase();
  const rootDir = zip.folder(`${rootUuid}.sdProfile`)!;

  // Build bundle manifest
  const bundleManifest: BundleManifest = {
    Name: profile.name,
    Pages: {
      Current: profile.pages[0].uuid,
      Pages: profile.pages.map((p) => p.uuid),
    },
    Version: '2.0',
  };

  if (profile.deviceModel) {
    bundleManifest.Device = {
      Model: profile.deviceModel,
      UUID: '',
    };
  }

  rootDir.file('manifest.json', JSON.stringify(bundleManifest));

  // Build page manifests
  const profilesDir = rootDir.folder('Profiles')!;

  for (const page of profile.pages) {
    const folderId = profileFolderId(page.uuid);
    const pageDir = profilesDir.folder(folderId)!;

    const pageManifest: PageManifest = {
      Controllers: [
        {
          Actions: page.actions,
          Type: 'Keypad',
        },
      ],
    };

    pageDir.file('manifest.json', JSON.stringify(pageManifest));

    // Add images if provided
    if (page.images) {
      for (const [key, pngBuffer] of page.images.entries()) {
        // key format: "col,row/state0"
        const [coord, stateFile] = key.split('/');
        pageDir
          .folder(coord)!
          .folder('CustomImages')!
          .file(`${stateFile}.png`, pngBuffer);
      }
    }
  }

  // Generate the ZIP buffer
  return zip.generateAsync({ type: 'nodebuffer' }) as Promise<Buffer>;
}
```

### Writing to Disk (Node.js)

```typescript
import { writeFileSync } from 'fs';

async function saveProfile(profile: ProfileDefinition): Promise<string> {
  const buffer = await buildStreamDeckProfile(profile);
  const filename = `${profile.name}.streamDeckProfile`;
  writeFileSync(filename, buffer);
  return filename;
}
```

### Browser Download (Web)

```typescript
async function downloadProfile(profile: ProfileDefinition): Promise<void> {
  const buffer = await buildStreamDeckProfile(profile);
  const blob = new Blob([buffer], { type: 'application/zip' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${profile.name}.streamDeckProfile`;
  a.click();

  URL.revokeObjectURL(url);
}
```

---

## 13. Complete Working Example

### Node.js Example: Productivity Profile

```typescript
import { randomUUID } from 'crypto';
import { writeFileSync } from 'fs';
import JSZip from 'jszip';

// (Include all the types and builder functions from §12 above)

async function main() {
  const pageUuid = randomUUID();

  const page: ProfilePage = {
    uuid: pageUuid,
    name: 'Main',
    actions: {
      // Row 0: Quick-launch apps
      '0,0': createWebsiteAction('GitHub', 'https://github.com'),
      '1,0': createWebsiteAction('Gmail', 'https://mail.google.com'),
      '2,0': createWebsiteAction('Calendar', 'https://calendar.google.com'),
      '3,0': createWebsiteAction('Slack', 'https://app.slack.com'),
      '4,0': createWebsiteAction('Jira', 'https://jira.atlassian.com'),

      // Row 1: Common shortcuts
      '0,1': createHotkeyAction('Copy', {
        KeyCmd: true, KeyCtrl: false, KeyModifiers: 8,
        KeyOption: false, KeyShift: false,
        NativeCode: 8, QTKeyCode: 67, VKeyCode: 67,
      }),
      '1,1': createHotkeyAction('Paste', {
        KeyCmd: true, KeyCtrl: false, KeyModifiers: 8,
        KeyOption: false, KeyShift: false,
        NativeCode: 9, QTKeyCode: 86, VKeyCode: 86,
      }),
      '2,1': createHotkeyAction('Undo', {
        KeyCmd: true, KeyCtrl: false, KeyModifiers: 8,
        KeyOption: false, KeyShift: false,
        NativeCode: 6, QTKeyCode: 90, VKeyCode: 90,
      }),
      '3,1': createHotkeyAction('Save', {
        KeyCmd: true, KeyCtrl: false, KeyModifiers: 8,
        KeyOption: false, KeyShift: false,
        NativeCode: 1, QTKeyCode: 83, VKeyCode: 83,
      }),
      '4,1': createHotkeyAction('Lock\nScreen', {
        KeyCmd: true, KeyCtrl: true, KeyModifiers: 4104,
        KeyOption: false, KeyShift: false,
        NativeCode: 12, QTKeyCode: 81, VKeyCode: 81,
      }),

      // Row 2: Text snippets
      '0,2': createTextAction('Email\nSig', 'Best regards,\nYour Name', false),
      '1,2': createTextAction('Phone', '+1-555-0100', false),
      '2,2': createTextAction('Address', '123 Main St, City', false),
    },
  };

  const profile: ProfileDefinition = {
    name: 'Productivity',
    pages: [page],
  };

  const filename = await saveProfile(profile);
  console.log(`Created: ${filename}`);
  console.log('Double-click the file to import it into Stream Deck!');
}

main();
```

---

## 14. Known Quirks & Gotchas

### Import Behavior
- Double-clicking a `.streamDeckProfile` file triggers the Stream Deck app to import it as a **new profile**. It does not overwrite existing profiles.
- The imported profile appears in the Profiles list and must be manually activated.

### ActionID Field
- In practice, setting all `ActionID` fields to the all-zeros UUID (`00000000-...`) works perfectly for import. The Stream Deck app appears to reassign IDs internally upon import.

### Key Codes Are OS-Specific
- Hotkey definitions exported on macOS use `NativeCode` (macOS keycode) with `VKeyCode: -1`.
- Hotkey definitions exported on Windows use `VKeyCode` (Windows Virtual Key) with `NativeCode` set to a Windows scan code.
- Profiles that include hotkeys may not be fully cross-platform. The Stream Deck app uses both fields to resolve keys.

### Title Line Breaks
- Use `\n` in the `Title` field for multi-line button labels: `"Title": "Line 1\nLine 2"`.

### Empty Buttons
- To leave a button blank, simply omit its coordinate key from the `Actions` map. You do not need a null or empty entry.

### Font Defaults
- If you omit font properties in the `States` array, the Stream Deck app falls back to its defaults (typically `Verdana`, size 12, white text).

### Image Path References
- The `Image` field in states is a relative path. For V1: relative to the button's `{col},{row}/CustomImages/` directory. For V2: relative to the page's `{col},{row}/CustomImages/` directory inside the page folder.

### Version Field
- Always use `"2.0"` for V2 format and `"1.0"` for V1. Omitting this field may cause import issues.

### Profile Size Limits
- There is no documented size limit, but extremely large profiles (hundreds of high-resolution images) may be slow to import. Consider optimizing PNG images.

### Stream Deck+ Encoders
- The Stream Deck+ has both keys (Keypad) and dials (Encoder). If targeting SD+, you may add a second controller entry:
```json
{
  "Controllers": [
    { "Actions": { /* keys */ }, "Type": "Keypad" },
    { "Actions": { /* dials */ }, "Type": "Encoder" }
  ]
}
```

---

## 15. References & Prior Art

### Official Resources
- **Elgato Stream Deck SDK** — [docs.elgato.com/streamdeck/sdk](https://docs.elgato.com/streamdeck/sdk/) — Plugin manifest format, action UUIDs, device types
- **Elgato Profile Deployment Guide** — [elgato.com/.../stream-deck-profiles-at-scale](https://www.elgato.com/us/en/explorer/products/stream-deck/stream-deck-profiles-at-scale/) — Enterprise deployment of profiles

### Community Projects
- **data-enabler/streamdeck-profile-generator** — [github.com/data-enabler/streamdeck-profile-generator](https://github.com/data-enabler/streamdeck-profile-generator) — Node.js proof-of-concept for V2 profile generation (the primary source for the page folder encoding and structure)
- **rse/sdkig** — [github.com/rse/sdkig](https://github.com/rse/sdkig) — Stream Deck Key Image Generator (HTML→PDF→PNG pipeline for creating 288×288 button icons)
- **grebett/streamdeck** — [github.com/grebett/streamdeck](https://github.com/grebett/streamdeck) — Sample `.streamDeckProfile` files for Logic Pro X (V1 format with hotkey actions)

### Community Discussion
- **Reddit: r/StreamDeckSDK** — "Inside a .streamDeckProfile file" — [reddit.com/r/StreamDeckSDK/comments/10w512n/](https://www.reddit.com/r/StreamDeckSDK/comments/10w512n/inside_a_streamdeckprofile_file/) — Community analysis of the file structure
- **LobeHub streamdeck-editor skill** — [lobehub.com/skills/graham42-windows-dot-files-streamdeck-editor](https://lobehub.com/skills/graham42-windows-dot-files-streamdeck-editor) — Detailed V2 ProfilesV2 structure documentation

### Installed Profile Location

For inspecting locally installed profiles:

| OS | Path |
|----|------|
| **Windows** | `%AppData%\Roaming\Elgato\StreamDeck\ProfilesV2\` |
| **macOS** | `~/Library/Application Support/com.elgato.StreamDeck/ProfilesV2/` |

You can examine these directories to reverse-engineer additional action types and settings from your own manually-created profiles.

---

## Appendix A: Quick-Start Checklist

For developers building a profile generator:

- [ ] **Choose format:** V2 recommended (V1 is simpler but older)
- [ ] **Install JSZip:** `npm install jszip` (or any ZIP library)
- [ ] **Generate UUIDs:** Use `crypto.randomUUID()` for profile/page IDs
- [ ] **Encode folder IDs:** Apply the base32 encoding for V2 page directories
- [ ] **Build action objects:** Use the correct UUID for each action type
- [ ] **Assemble manifests:** Bundle manifest + page manifests
- [ ] **Add images (optional):** Place 288×288 PNG files in the correct paths
- [ ] **Create ZIP:** Package everything with `.streamDeckProfile` extension
- [ ] **Test:** Double-click the file to verify it imports into the Stream Deck app

## Appendix B: V1 Minimal Profile (Simplest Possible)

If you just want the absolute simplest thing that works:

```typescript
async function buildMinimalV1Profile(
  name: string,
  actions: Record<string, Action>
): Promise<Buffer> {
  const zip = new JSZip();
  const uuid = randomUUID().toUpperCase();
  const root = zip.folder(`${uuid}.sdProfile`)!;

  root.file('manifest.json', JSON.stringify({
    Actions: actions,
    Name: name,
    Version: '1.0',
  }));

  return zip.generateAsync({ type: 'nodebuffer' }) as Promise<Buffer>;
}

// Usage:
const buffer = await buildMinimalV1Profile('My Profile', {
  '0,0': createWebsiteAction('Google', 'https://google.com'),
  '1,0': createHotkeyAction('Copy', { /* ... */ }),
});
writeFileSync('My Profile.streamDeckProfile', buffer);
```

This creates a valid, importable profile with no images, no pages, just buttons.