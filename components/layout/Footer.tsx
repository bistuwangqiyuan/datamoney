export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © 2025 DataMoney. 比特币交易平台 MVP - 模拟交易，仅供学习使用
          </p>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="https://supabase.com"
            target="_blank"
            rel="noreferrer"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Powered by Supabase
          </a>
          <span className="text-muted-foreground">•</span>
          <a
            href="https://www.binance.com"
            target="_blank"
            rel="noreferrer"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Data from Binance
          </a>
        </div>
      </div>
    </footer>
  );
}

