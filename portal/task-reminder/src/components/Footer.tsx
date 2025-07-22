'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  const isHelpPage = pathname === '/help';

  return (
    <footer className="bg-gray-900 dark:bg-gray-950 text-white py-16">
      <div className="container mx-auto px-6">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <Link href="/" className="flex items-center space-x-3">
              <Image
                src="/icon.png"
                alt="TaskReminder"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <span className="font-semibold text-xl">TaskReminder</span>
            </Link>
          </div>
          <p className="text-gray-400 text-sm mb-8 max-w-md mx-auto">
            专注要事，成就卓越 - 基于《高效人士的7个习惯》的智能任务管理工具
          </p>
          <div className="flex justify-center space-x-8 text-sm text-gray-400 mb-8">
            <Link href="/privacy" className="hover:text-white transition-colors">隐私政策</Link>
            <Link href="/terms" className="hover:text-white transition-colors">服务条款</Link>
            <Link href="/contact" className="hover:text-white transition-colors">联系我们</Link>
            <Link href="/help" className="hover:text-white transition-colors">帮助中心</Link>
          </div>

          <div className="pt-8 border-t border-gray-800 text-xs text-gray-500">
            © 2024 TaskReminder. 保留所有权利。
          </div>

        </div>
      </div>
    </footer>
  );
} 