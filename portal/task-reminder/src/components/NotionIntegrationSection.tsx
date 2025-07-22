'use client';

import Image from 'next/image';
import { Download, CheckCircle2, Lock, Shuffle } from 'lucide-react';

export default function NotionIntegrationSection() {
  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900/30">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* 左侧：示意图 */}
          <div className="relative flex justify-center items-center p-8 rounded-2xl ">
            <div className="flex items-center space-x-8">
              {/* TaskReminder Logo */}
              <div className="text-center flex flex-col items-center">
                <Image
                  src="/icon.png"
                  alt="TaskReminder"
                  width={80}
                  height={80}
                />
                <p className="mt-3 font-semibold text-gray-900 dark:text-gray-100">TaskReminder</p>
              </div>

              {/* 连接动画 */}
              <div className="flex flex-col items-center">
                <Shuffle className="w-8 h-8 text-gray-400 dark:text-gray-500 animate-pulse" />
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">安全同步</div>
              </div>
              
              {/* Notion Logo */}
              <div className="text-center flex flex-col items-center">
                <Image
                  src="/notionlogo.png"
                  alt="Notion"
                  width={80}
                  height={80}
                  className="rounded-2xl shadow-lg"
                />
                <p className="mt-3 font-semibold text-gray-900 dark:text-gray-100">Notion</p>
              </div>
            </div>
          </div>

          {/* 右侧：文字说明 */}
          <div>
            <div className="inline-flex items-center space-x-2 mb-4">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl text-gray-900 dark:text-gray-100">
                与您的Notion无缝集成
              </h2>
            </div>
            
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              TaskReminder将所有任务数据直接存储在您自己的Notion个人账号中，确保您的信息安全与隐私。
            </p>

            <ul className="space-y-6">
              <li className="flex items-start">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center justify-center">
                  <Lock className="h-5 w-5" />
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">数据归您所有</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">所有任务信息都保存在您的私人Notion页面，我们绝不接触您的数据。</p>
                </div>
              </li>
              <li className="flex items-start">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">随时随地查看</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">利用Notion的全平台同步能力，在任何设备上访问和管理您的任务。</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
} 