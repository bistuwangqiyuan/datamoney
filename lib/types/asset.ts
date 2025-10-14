export type AssetType = 'BTC' | 'USDT';

export interface Asset {
  id: string;
  user_id: string;
  asset_type: AssetType;
  available: string; // decimal as string
  frozen: string; // decimal as string
  created_at: string;
  updated_at: string;
}

export interface AssetDisplay extends Asset {
  total: string;
  value_usdt?: string;
}

