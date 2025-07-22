export default function ProblemsSection() {
  const problems = [
    { title: "任务积压", text: "待办事项越来越长，却不知道从何开始" },
    { title: "优先级混乱", text: "总是被紧急但不重要的事情打断" },
    { title: "效率低下", text: "每天忙忙碌碌，却感觉没有实质性进展" },
    { title: "缺乏规划", text: "工作任务杂乱无章，缺乏清晰的优先级" },
    { title: "方法缺失", text: "想要提高效率，但缺乏科学的方法指导" },
    { title: "注意力分散", text: "信息过载，难以专注于真正重要的工作" },
  ];

  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-900/30">
      <div className="container mx-auto px-6">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-gray-900 dark:text-gray-100 mb-4">
            您是否经常遇到这些困扰？
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            现代办公人士面临的普遍挑战
          </p>
        </div>
        
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {problems.map((problem, index) => (
            <div 
              key={index}
              className="p-6 bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow group"
            >
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {problem.title}
                </h3>
                <div className="w-8 h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"></div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {problem.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 