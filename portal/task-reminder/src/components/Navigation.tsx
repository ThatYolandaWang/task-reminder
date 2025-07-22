'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  const getLink = (hash: string) => {
    return isHomePage ? hash : `/${hash}`;
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center px-6">
        <Link href="/" className="flex items-center space-x-3">
          <Image
            src="/icon.png"
            alt="TaskReminder"
            width={32}
            height={32}
            className="rounded-lg"
          />
          <span className="font-semibold text-xl text-gray-900 dark:text-gray-100">
            TaskReminder
          </span>
        </Link>
        <div className="ml-auto flex items-center space-x-8">
          <Link 
            href={getLink('#features')}
            className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            产品特性
          </Link>
          <Link 
            href={getLink('#download')}
            className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            下载
          </Link>
          <Link 
            href="/help" 
            className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            帮助
          </Link>
        </div>
      </div>
    </nav>
  );
} 