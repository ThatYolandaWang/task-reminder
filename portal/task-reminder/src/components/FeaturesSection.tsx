import { Target, Brain, Focus, BarChart3 } from 'lucide-react';

export default function FeaturesSection() {
  const features = [
    {
      icon: Target,
      title: "智能任务分类",
      subtitle: "要事第一，优先级智能排序",
      description: "基于重要性和紧急性的四象限法则，自动为您的任务分类，确保始终专注于最有价值的工作。",
      color: "blue",
    },
    {
      icon: Brain,
      title: "习惯养成助手",
      subtitle: "培养高效习惯，持续自我提升",
      description: "内置基于7个习惯的工作流程，帮助您逐步建立高效的工作模式和思维习惯。",
      color: "purple",
    },
    {
      icon: Focus,
      title: "专注模式",
      subtitle: "屏蔽干扰，专注当下",
      description: "智能提醒和专注时间管理，帮助您在重要任务上保持深度专注，提高工作质量。",
      color: "green",
    },
    {
      icon: BarChart3,
      title: "数据洞察",
      subtitle: "工作效率可视化分析",
      description: "详细的时间分配和任务完成情况分析，让您清晰了解自己的工作模式，持续优化效率。",
      color: "orange",
    },
  ];

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: "bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
      purple: "bg-purple-50 dark:bg-purple-900/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800",
      green: "bg-green-50 dark:bg-green-900/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800",
      orange: "bg-orange-50 dark:bg-orange-900/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800",
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <section id="features" className="py-20">
      <div className="container mx-auto px-6">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-gray-900 dark:text-gray-100 mb-4">
            TaskReminder 为您提供系统性解决方案
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            基于《高效人士的7个习惯》核心思想设计的四大核心特性
          </p>
        </div>
        
        <div className="grid gap-8 lg:grid-cols-2">
          {features.map((feature, index) => (
            <div key={index} className="group">
              <div className="flex gap-6 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-800/50">
                <div className="flex-shrink-0">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-xl border-2 ${getColorClasses(feature.color)} transition-transform group-hover:scale-110`}>
                    <feature.icon className="h-7 w-7" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-3 font-medium">
                    {feature.subtitle}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 