'use client'

import { useSearchParams } from "next/navigation";
import Image from "next/image"
import Link from "next/link";
import { ArrowRight, AlertTriangle, DownloadCloud, Copy, Database } from 'lucide-react';
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

export default function HelpPage() {
  const params = useSearchParams();
  const status = params.get("status");

  const HelpContent = () => {
    const template_url = process.env.NEXT_PUBLIC_NOTION_TEMPLATE_URL || "https://www.notion.so/templates";
    return (
      <div className="bg-white dark:bg-gray-900 py-20">
        <div className="container mx-auto px-6 max-w-5xl">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100">设置指南</h1>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
              欢迎使用 TaskReminder，请跟随以下步骤完成设置。
            </p>
          </div>

          <div className="space-y-20">
            {/* Step 1: Download */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-bold">1</div>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">下载并安装应用</h2>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  如果您还没有安装 TaskReminder，请根据您的操作系统选择相应的版本进行下载。
                </p>
                <div className="flex space-x-4">
                  <Link href="/#download" className="inline-flex items-center rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-gray-700 transition-colors dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300">
                    <DownloadCloud className="mr-2 h-5 w-5" /> Windows 版
                  </Link>
                  <Link href="/#download" className="inline-flex items-center rounded-lg bg-gray-800 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-gray-700 transition-colors dark:bg-gray-200 dark:text-gray-900 dark:hover:bg-gray-400">
                    <DownloadCloud className="mr-2 h-5 w-5" /> macOS 版
                  </Link>
                </div>
              </div>
              <div className="flex justify-center">
                <Image src="/tasklist.png" alt="TaskReminder App UI" width={500} height={400} className="rounded-lg shadow-xl border border-gray-200 dark:border-gray-700" />
              </div>
            </div>

            {/* Step 2: First Time User */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="md:order-2">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-bold">2</div>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">首次使用：复制模板</h2>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  如果您是第一次使用，请在 Notion 授权页面选择“使用开发者提供的模板”来自动创建数据库。
                </p>
                 <Link href={template_url} target="_blank" className="inline-flex items-center rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-gray-700 transition-colors dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300">
                  <Copy className="mr-2 h-4 w-4" /> 查看模板详情
                </Link>
              </div>
              <div className="md:order-1 flex justify-center">
                 <Image src="/first_time.png" alt="First time setup" width={300} height={400} className="rounded-lg shadow-xl border border-gray-200 dark:border-gray-700" />
              </div>
            </div>

            {/* Step 3: Existing User */}
            <div className="grid md:grid-cols-3 gap-12 items-center">
              <div>
                <div className="flex items-center space-x-3 mb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-bold">3</div>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">关联现有数据库</h2>
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                  如果您已经有自己的任务数据库，可以选择“手动选择关联数据库”，然后在列表中找到并授权您想使用的页面。
                </p>
              </div>
              
                <Image src="/second_time.png" alt="Manual setup" width={300} height={400} className="object-cover rounded-lg shadow-xl border border-gray-200 dark:border-gray-700" />
                <Image src="/choose_db.png" alt="Choose database" width={300} height={400} className="object-cover rounded-lg shadow-xl border border-gray-200 dark:border-gray-700" />
              
            </div>
          </div>
        </div>
      </div>
    );
  };

  const Error = () => {
    const error = params.get("error");
    const error_description = params.get("error_description");
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <div className="bg-red-50 dark:bg-red-900/10 p-8 rounded-2xl border border-red-200 dark:border-red-800 max-w-lg w-full">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-red-800 dark:text-red-300">授权失败</h1>
          <p className="text-red-600 dark:text-red-400 mt-2 capitalize">{error?.replace(/_/g, ' ')}</p>
          <p className="text-sm text-red-500 dark:text-red-500 mt-1">{error_description}</p>
          <Link href="/" className="mt-6 inline-flex items-center rounded-lg bg-gray-900 px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-700 transition-colors dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300">
            返回首页
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />
      <main className="flex-grow">
        {status === "error" ? <Error /> : <HelpContent />}
      </main>
      <Footer />
    </div>
  );
}