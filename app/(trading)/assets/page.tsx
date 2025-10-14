import { AssetDisplay } from '@/components/trading/AssetDisplay';

export default function AssetsPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">资产管理</h1>
      <AssetDisplay />
    </div>
  );
}

