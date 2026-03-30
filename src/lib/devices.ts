import type { DeviceDefinition, DeviceId } from './types';

export const DEVICES: Record<DeviceId, DeviceDefinition> = {
  mini: { id: 'mini', name: 'Stream Deck Mini', cols: 3, rows: 2, totalKeys: 6, model: '20GAM9901', deviceType: 1 },
  neo: { id: 'neo', name: 'Stream Deck Neo', cols: 4, rows: 2, totalKeys: 8, deviceType: 8 },
  mk2: { id: 'mk2', name: 'Stream Deck MK.2', cols: 5, rows: 3, totalKeys: 15, model: '20GAA9901', deviceType: 0 },
  xl: { id: 'xl', name: 'Stream Deck XL', cols: 8, rows: 4, totalKeys: 32, model: '20GAT9901', deviceType: 2 },
  plus: { id: 'plus', name: 'Stream Deck +', cols: 4, rows: 2, totalKeys: 8, model: '20GBD9901', deviceType: 7 },
  'plus-xl': { id: 'plus-xl', name: 'Stream Deck + XL', cols: 6, rows: 6, totalKeys: 36, deviceType: 9 },
  pedal: { id: 'pedal', name: 'Stream Deck Pedal', cols: 3, rows: 1, totalKeys: 3, model: '20GAQ9901', deviceType: 5 },
  studio: { id: 'studio', name: 'Stream Deck Studio', cols: 8, rows: 4, totalKeys: 32, deviceType: 10 },
};

export const DEVICE_LIST = Object.values(DEVICES);
