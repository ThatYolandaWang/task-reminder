import { Download, Check } from 'lucide-react';
import CardSwap from './CardSwap';

export default function HeroSection() {
  const productImages = [
    {
      src: 'https://images.unsplash.com/photo-1547586696-ea22b4d4235d?q=80&w=2070&auto=format&fit=crop',
      alt: '高效工作台',
      title: '清晰的工作台面'
    },
    {
      src: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?q=80&w=2070&auto=format&fit=crop', 
      alt: '团队协作',
      title: '高效的团队协作'
    },
    {
      src: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?q=80&w=2070&auto=format&fit=crop',
      alt: '数据分析',
      title: '清晰的数据洞察'
    },
    {
      src: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=2070&auto=format&fit=crop',
      alt: '灵活规划',
      title: '灵活的个人规划'
    }
  ];

  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div className="container mx-auto px-6">
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-24 items-center">
          {/* 左侧文字内容 */}
          <div className="lg:order-1 flex flex-col items-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl text-gray-900 dark:text-gray-100 mb-6">
              专注要事，成就卓越
            </h1>
            <p className="text-xl leading-relaxed text-gray-600 dark:text-gray-400 mb-8">
              基于《高效人士的7个习惯》设计的智能任务管理工具<br />
              帮助您每天聚焦最重要的事情，告别工作混乱
            </p>
            
            {/* 价值主张 */}
            <div className="mb-12 grid gap-4 sm:grid-cols-2">
              <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
                <Check className="h-5 w-5 text-blue-500 flex-shrink-0" />
                <span>智能优先级排序</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
                <Check className="h-5 w-5 text-blue-500 flex-shrink-0" />
                <span>基于经典效率理念</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
                <Check className="h-5 w-5 text-blue-500 flex-shrink-0" />
                <span>简洁直观界面</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
                <Check className="h-5 w-5 text-blue-500 flex-shrink-0" />
                <span>个性化提醒系统</span>
              </div>
            </div>

            {/* CTA按钮 */}
            <div className="flex items-center gap-x-6">
              <a
                href="#download"
                className="inline-flex items-center rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white shadow-sm hover:bg-gray-700 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300"
              >
                <Download className="mr-2 h-4 w-4" />
                立即下载
              </a>
              <a
                href="#features"
                className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-black dark:hover:text-white transition-colors"
              >
                了解更多 <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>

          {/* 右侧产品截图轮播 */}
          <div className="lg:order-2 flex justify-center">
            <CardSwap images={productImages} />
          </div>
        </div>
      </div>
    </section>
  );
} 