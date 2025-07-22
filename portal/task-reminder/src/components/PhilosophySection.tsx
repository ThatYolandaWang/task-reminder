export default function PhilosophySection() {
  const principles = [
    { 
      title: "专注重要", 
      description: "识别并专注于真正重要的任务",
      gradient: "from-blue-500 to-blue-600"
    },
    { 
      title: "持续改进", 
      description: "通过数据反馈不断优化工作方式",
      gradient: "from-purple-500 to-purple-600"
    },
    { 
      title: "习惯养成", 
      description: "培养长期的高效工作习惯",
      gradient: "from-green-500 to-green-600"
    },
    { 
      title: "内心平静", 
      description: "通过有序管理获得内心的平静与专注",
      gradient: "from-orange-500 to-orange-600"
    },
  ];

  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900/30">
      <div className="container mx-auto px-6">
        <div className="mx-auto max-w-4xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-gray-900 dark:text-gray-100 mb-4">
            要事第一，持续精进
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
            TaskReminder 秉承《高效人士的7个习惯》的核心思想，相信真正的效率不是做更多的事情，而是做对的事情。
          </p>
        </div>
        
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {principles.map((principle, index) => (
            <div key={index} className="group">
              <div className="text-center p-6 rounded-2xl bg-white dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
                <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${principle.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                    <div className={`w-4 h-4 bg-gradient-to-br ${principle.gradient} rounded-full`}></div>
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {principle.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {principle.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 