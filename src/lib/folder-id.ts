export function profileFolderIdFromUuid(uuid: string): string {
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
