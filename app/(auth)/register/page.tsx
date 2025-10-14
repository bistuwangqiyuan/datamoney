import Link from 'next/link';
import { RegisterForm } from '@/components/auth/RegisterForm';

export const dynamic = 'force-dynamic';

export default function RegisterPage() {
  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)] py-12">
      <div className="w-full max-w-md space-y-6">
        <RegisterForm />
        <p className="text-center text-sm text-muted-foreground">
          已有账户？{' '}
          <Link href="/login" className="text-primary hover:underline">
            立即登录
          </Link>
        </p>
      </div>
    </div>
  );
}

