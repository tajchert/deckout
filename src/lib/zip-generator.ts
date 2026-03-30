import JSZip from 'jszip';
import type { ProfileDefinition, WireBundleManifest, WirePageManifest } from './types';
import { profileFolderIdFromUuid } from './folder-id';
import { generateUuid } from './uuid';

export async function generateProfileZip(profile: ProfileDefinition): Promise<Blob> {
  const zip = new JSZip();
  const rootUuid = generateUuid().toUpperCase();
  const rootDir = zip.folder(`${rootUuid}.sdProfile`)!;

  const bundleManifest: WireBundleManifest = {
    Name: profile.name,
    Pages: {
      Current: profile.pages[0]?.uuid ?? '',
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

  const profilesDir = rootDir.folder('Profiles')!;

  for (const page of profile.pages) {
    const folderId = profileFolderIdFromUuid(page.uuid);
    const pageDir = profilesDir.folder(folderId)!;

    const pageManifest: WirePageManifest = {
      Controllers: [
        {
          Actions: page.actions,
          Type: 'Keypad',
        },
      ],
    };

    pageDir.file('manifest.json', JSON.stringify(pageManifest));
  }

  return zip.generateAsync({ type: 'blob' });
}

export async function downloadProfile(profile: ProfileDefinition): Promise<void> {
  const blob = await generateProfileZip(profile);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${profile.name}.streamDeckProfile`;
  a.click();
  URL.revokeObjectURL(url);
}
