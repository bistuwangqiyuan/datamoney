import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function HomePage() {
  return (
    <div className="container">
      {/* Hero Section */}
      <section className="py-20 text-center">
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-success to-warning bg-clip-text text-transparent">
          DataMoney
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          专业的比特币模拟交易平台 · 实时行情 · 零风险学习
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/register">
            <Button size="lg" className="text-lg px-8">
              立即注册
            </Button>
          </Link>
          <Link href="/trade">
            <Button size="lg" variant="outline" className="text-lg px-8">
              开始交易
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <h2 className="text-3xl font-bold text-center mb-12">核心功能</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📊</span>
                实时行情
              </CardTitle>
              <CardDescription>
                通过 Binance WebSocket 获取 BTC/USDT 实时价格和深度数据
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ 实时价格更新</li>
                <li>✓ 24小时涨跌幅</li>
                <li>✓ 成交量统计</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">💼</span>
                模拟交易
              </CardTitle>
              <CardDescription>
                支持限价单和市价单，简化撮合系统，零风险学习交易
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ 限价单 / 市价单</li>
                <li>✓ 买入 / 卖出</li>
                <li>✓ 实时撮合成交</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">💰</span>
                资产管理
              </CardTitle>
              <CardDescription>
                虚拟钱包管理，初始赠送 1 BTC + 20,000 USDT
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ 实时资产估值</li>
                <li>✓ 可用 / 冻结资产</li>
                <li>✓ 资产变动记录</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📝</span>
                订单管理
              </CardTitle>
              <CardDescription>
                完整的订单生命周期管理，支持订单查询和取消
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ 订单历史查询</li>
                <li>✓ 实时状态更新</li>
                <li>✓ 支持取消订单</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📈</span>
                成交记录
              </CardTitle>
              <CardDescription>
                详细的成交历史记录，帮助您回顾交易决策
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ 成交价格 / 数量</li>
                <li>✓ 买卖方向</li>
                <li>✓ 成交时间</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🔒</span>
                安全可靠
              </CardTitle>
              <CardDescription>
                基于 Supabase 的认证和数据库，确保数据安全
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>✓ 邮箱密码认证</li>
                <li>✓ RLS 数据隔离</li>
                <li>✓ 实时数据同步</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 text-center">
        <Card className="max-w-2xl mx-auto bg-gradient-to-br from-primary/10 to-success/10 border-primary/20">
          <CardHeader>
            <CardTitle className="text-3xl">立即开始您的交易之旅</CardTitle>
            <CardDescription className="text-lg">
              注册即送 1 BTC + 20,000 USDT 虚拟资产
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/register">
              <Button size="lg" className="text-lg px-12">
                免费注册
              </Button>
            </Link>
            <p className="text-sm text-muted-foreground mt-4">
              ⚠️ 本平台仅供学习和演示，所有交易均为虚拟模拟
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Tech Stack */}
      <section className="py-16 border-t border-border">
        <h2 className="text-2xl font-bold text-center mb-8">技术栈</h2>
        <div className="flex flex-wrap items-center justify-center gap-8 text-muted-foreground">
          <div className="text-center">
            <div className="font-semibold">Next.js 15</div>
            <div className="text-xs">前端框架</div>
          </div>
          <div className="text-center">
            <div className="font-semibold">React 19</div>
            <div className="text-xs">UI 库</div>
          </div>
          <div className="text-center">
            <div className="font-semibold">TypeScript</div>
            <div className="text-xs">类型安全</div>
          </div>
          <div className="text-center">
            <div className="font-semibold">Supabase</div>
            <div className="text-xs">后端服务</div>
          </div>
          <div className="text-center">
            <div className="font-semibold">Binance API</div>
            <div className="text-xs">行情数据</div>
          </div>
          <div className="text-center">
            <div className="font-semibold">Tailwind CSS</div>
            <div className="text-xs">样式框架</div>
          </div>
          <div className="text-center">
            <div className="font-semibold">Netlify</div>
            <div className="text-xs">部署平台</div>
          </div>
        </div>
      </section>
    </div>
  );
}
