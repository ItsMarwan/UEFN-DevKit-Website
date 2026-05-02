export type TabId =
  | 'overview'
  | 'customers'
  | 'logs'
  | 'members'
  | 'verse_scripts'
  | 'trackers'
  | 'assets'
  | 'config'
  | 'api'
  | 'reports'
  | 'editor'
  | 'profile';

export const VALID_TABS: TabId[] = [
  'overview',
  'customers',
  'logs',
  'members',
  'verse_scripts',
  'trackers',
  'assets',
  'config',
  'api',
  'reports',
  'editor',
  'profile',
];

export const DASHBOARD_TABS: {
  id: TabId;
  label: string;
  icon: string;
  soon?: boolean;
  isNew?: boolean;
}[] = [
  { id: 'overview',      label: 'Overview',      icon: '📊' },
  { id: 'customers',     label: 'Customers',     icon: '💸' },
  { id: 'logs',          label: 'Command Logs',  icon: '📋' },
  { id: 'members',       label: 'Members',       icon: '👥' },
  { id: 'verse_scripts', label: 'Verse Scripts', icon: '📦' },
  { id: 'trackers',      label: 'Trackers',      icon: '⏱️' },
  { id: 'assets',        label: 'Asset Access',  icon: '📁', isNew: true },
  { id: 'api',           label: 'API',           icon: '🔐' },
  { id: 'reports',       label: 'Reports',       icon: '🚩' },
  { id: 'config',        label: 'Server Config', icon: '⚙️' },
  // { id: 'editor',        label: 'Editor',        icon: '⚡', soon: true },
];
