'use client';

import { Download } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ReleaseData {
  version: string;
  platforms: {
    'windows-x86_64'?: {
      url: string;
      signature: string;
    };
    'darwin-aarch64'?: {
      url: string;
      signature: string;
    };
  };
}

export default function DownloadSection() {
  const [releaseData, setReleaseData] = useState<ReleaseData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReleaseData = async () => {
      try {
        const response = await fetch('/latest.json');
        const data = await response.json();
        setReleaseData(data);
      } catch (error) {
        console.error('Failed to fetch release data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReleaseData();
  }, []);

  const handleDownload = (platform: 'windows' | 'macos') => {
    if (!releaseData) return;
    
    let url = '';
    if (platform === 'windows' && releaseData.platforms['windows-x86_64']) {
      url = releaseData.platforms['windows-x86_64'].url;
    } else if (platform === 'macos' && releaseData.version) {
      // 使用字符串拼接生成macOS下载链接
      url = `https://github.com/ThatYolandaWang/task-reminder/releases/download/${releaseData.version}/task-reminder_${releaseData.version}_aarch64.dmg`;
    }
    
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <section id="download" className="py-20">
      <div className="container mx-auto px-6">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-gray-900 dark:text-gray-100 mb-4">
            立即下载 TaskReminder
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            支持 Windows 和 macOS 平台，开始您的高效工作之旅
          </p>
        </div>
        
        <div className="grid gap-8 sm:grid-cols-2 max-w-2xl mx-auto">
          {/* Windows下载 */}
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow group">
            <div className="text-center">
              <div className="h-16 w-16 mx-auto mb-6 bg-gray-100 dark:bg-gray-700/50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="h-8 w-8 text-gray-800 dark:text-gray-200" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-13.051-1.351"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
                Windows 版本
              </h3>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-6 space-y-1">
                <p>适用于 Windows 10/11</p>
                <p>文件大小: ~7MB</p>
                <p>版本: {loading ? '加载中...' : releaseData?.version || 'v1.0.0'}</p>
              </div>
              <button 
                onClick={() => handleDownload('windows')}
                disabled={loading || !releaseData?.platforms['windows-x86_64']}
                className="w-full bg-gray-900 hover:bg-gray-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:cursor-not-allowed group-hover:shadow-lg dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300"
              >
                <Download className="mr-2 h-4 w-4 inline" />
                下载 Windows 版本
              </button>
            </div>
          </div>

          {/* macOS下载 */}
          <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow group">
            <div className="text-center">
              <div className="h-16 w-16 mx-auto mb-6 bg-gray-100 dark:bg-gray-700/50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="h-8 w-8 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-gray-100">
                macOS 版本
              </h3>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-6 space-y-1">
                <p>适用于 Apple Silicon</p>
                <p>文件大小: ~7MB</p>
                <p>版本: {loading ? '加载中...' : releaseData?.version || 'v1.0.0'}</p>
              </div>
              <button 
                onClick={() => handleDownload('macos')}
                disabled={loading || !releaseData?.version}
                className="w-full bg-gray-800 hover:bg-gray-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:cursor-not-allowed group-hover:shadow-lg dark:bg-gray-200 dark:text-gray-900 dark:hover:bg-gray-400"
              >
                <Download className="mr-2 h-4 w-4 inline" />
                下载 macOS 版本
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 