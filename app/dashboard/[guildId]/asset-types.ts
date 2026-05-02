// This file contains the new AssetAccessTab component structure
// It will replace the old one in the dashboard page

const ASSET_TYPES = {
  full: {
    name: 'Full',
    description: 'Complete asset storage and access control',
    availableTo: ['premium', 'enterprise'],
    fields: ['asset_channel_id', 'info_channel_id', 'required_role_id', 'required_hours', 'cooldown_hours', 'storage_enabled'],
  },
  semi: {
    name: 'Semi',
    description: 'Channel lock-only access',
    availableTo: ['premium', 'enterprise'],
    fields: ['info_channel_id', 'required_role_id', 'required_hours', 'cooldown_hours'],
  },
  web: {
    name: 'Web',
    description: 'Web-based access with hosting',
    availableTo: ['free', 'premium', 'enterprise'],
    fields: ['required_hours', 'cooldown_hours', 'storage_enabled'],
  },
};

interface Asset {
  id: string;
  asset_type: 'full' | 'semi' | 'web';
  name: string;
  description?: string;
  enabled: boolean;
  required_hours: number;
  cooldown_hours: number;
  asset_channel_id?: string;
  info_channel_id?: string;
  required_role_id?: string;
  storage_enabled?: boolean;
  storage_mode?: 'external' | 'hosted';
  storage_url?: string;
  storage_size?: number;
  discoverable?: boolean;
  download_count?: number;
  guild_id?: string;
  created_at: string;
}

export { ASSET_TYPES, type Asset };
