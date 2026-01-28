
import React, { useState, useEffect, useCallback } from 'react';
import { 
  CheckCircle, 
  Clock, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  BookOpen, 
  Briefcase, 
  Car, 
  Activity,
  AlertCircle,
  BrainCircuit,
  Plus,
  ChevronRight,
  X,
  Target,
  Zap,
  Sparkles
} from 'lucide-react';
import { Task, TaskCategory, TaskStatus, AISupervisionFeedback, SubTask } from './types';
import { getSupervisionAdvice, generateSubTasks } from './services/geminiService';

const INITIAL_TASKS: Task[] = [
  { id: '1', title: '日常实习', category: TaskCategory.INTERNSHIP, description: '周一到周五，平均工作不超过4h', status: TaskStatus.IN_PROGRESS, progress: 0, isRecurring: true, priority: 'Medium', subTasks: [], taskType: 'habit', checkInDates: [] },
  { id: '2', title: '寻找下份实习', category: TaskCategory.INTERNSHIP, description: 'PE/CICC IB/星海图/CICC Research', deadline: '2025-03-01', status: TaskStatus.TODO, progress: 10, isRecurring: false, priority: 'High', subTasks: [], taskType: 'progress' },
  { id: '3', title: '大创结项论文', category: TaskCategory.ACADEMIC, description: '配合NotebookLM完成 (2.14 deadline)', deadline: '2025-02-14', status: TaskStatus.TODO, progress: 0, isRecurring: false, priority: 'High', subTasks: [], taskType: 'progress' },
  { id: '4', title: '毕业论文初稿', category: TaskCategory.ACADEMIC, description: '长线任务，目标3.1前完成60-80%', deadline: '2025-03-01', status: TaskStatus.IN_PROGRESS, progress: 0, isRecurring: true, priority: 'High', subTasks: [], taskType: 'progress' },
  { id: '5', title: '驾照学习', category: TaskCategory.SKILL, description: '线下积累学时，年前考完科一', status: TaskStatus.IN_PROGRESS, progress: 0, isRecurring: true, priority: 'Medium', subTasks: [], taskType: 'habit', checkInDates: [] },
  { id: '6', title: '普拉提课程', category: TaskCategory.PERSONAL, description: '未来一周每天1-2h', status: TaskStatus.IN_PROGRESS, progress: 0, isRecurring: true, priority: 'Medium', subTasks: [], taskType: 'habit', checkInDates: [] },
  { id: '7', title: '炒股学习与复盘', category: TaskCategory.FINANCE, description: '盯盘复盘，阅读研报', status: TaskStatus.IN_PROGRESS, progress: 0, isRecurring: true, priority: 'Medium', subTasks: [], taskType: 'habit', checkInDates: [] }
];

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calendar' | 'analysis'>('dashboard');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<AISupervisionFeedback | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [userContext, setUserContext] = useState('');
  
  // New Task Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<'progress' | 'habit'>('progress');
  const [newCat, setNewCat] = useState<TaskCategory>(TaskCategory.INTERNSHIP);

  const refreshSupervision = useCallback(async () => {
    setLoadingAI(true);
    try {
      const feedback = await getSupervisionAdvice(tasks, userContext);
      setAiFeedback(feedback);
    } catch (error) {
      console.error("Failed to fetch AI supervision:", error);
    } finally {
      setLoadingAI(false);
    }
  }, [tasks, userContext]);

  useEffect(() => {
    refreshSupervision();
  }, []);

  const handleAddTask = () => {
    if (!newTitle) return;
    const newTask: Task = {
      id: Date.now().toString(),
      title: newTitle,
      category: newCat,
      description: newDesc,
      status: TaskStatus.TODO,
      progress: 0,
      isRecurring: false,
      priority: 'Medium',
      subTasks: [],
      taskType: newType,
      checkInDates: newType === 'habit' ? [] : undefined
    };
    setTasks([...tasks, newTask]);
    setShowAddModal(false);
    setNewTitle('');
    setNewDesc('');
  };

  const handleSelectTask = async (task: Task) => {
    setSelectedTask(task);
    if (task.taskType === 'progress' && task.subTasks.length === 0) {
      const suggested = await generateSubTasks(task);
      if (suggested.length > 0) {
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, subTasks: suggested } : t));
        setSelectedTask({ ...task, subTasks: suggested });
      }
    }
  };

  const toggleSubTask = (taskId: string, subId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const newSubs = t.subTasks.map(s => s.id === subId ? { ...s, completed: !s.completed } : s);
        const completedCount = newSubs.filter(s => s.completed).length;
        const newProgress = Math.round((completedCount / newSubs.length) * 100);
        return { ...t, subTasks: newSubs, progress: newProgress };
      }
      return t;
    }));
    if (selectedTask?.id === taskId) {
      setSelectedTask(prev => {
        if (!prev) return null;
        const newSubs = prev.subTasks.map(s => s.id === subId ? { ...s, completed: !s.completed } : s);
        const completedCount = newSubs.filter(s => s.completed).length;
        const newProgress = newSubs.length > 0 ? Math.round((completedCount / newSubs.length) * 100) : 0;
        return { ...prev, subTasks: newSubs, progress: newProgress };
      });
    }
  };

  const toggleCheckIn = (taskId: string, dateStr: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId && t.checkInDates) {
        const isChecked = t.checkInDates.includes(dateStr);
        return { 
          ...t, 
          checkInDates: isChecked ? t.checkInDates.filter(d => d !== dateStr) : [...t.checkInDates, dateStr] 
        };
      }
      return t;
    }));
    if (selectedTask?.id === taskId) {
      setSelectedTask(prev => {
        if (!prev || !prev.checkInDates) return prev;
        const isChecked = prev.checkInDates.includes(dateStr);
        return { ...prev, checkInDates: isChecked ? prev.checkInDates.filter(d => d !== dateStr) : [...prev.checkInDates, dateStr] };
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-white p-6 flex flex-col shrink-0">
        <div className="flex items-center gap-3 mb-10">
          <div className="bg-emerald-500 p-2 rounded-lg">
            <BrainCircuit size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Winter Mastery</h1>
        </div>
        
        <nav className="flex-1 space-y-2">
          <NavItem icon={<Activity size={20}/>} label="仪表盘" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<CalendarIcon size={20}/>} label="规划日历" active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')} />
          <NavItem icon={<TrendingUp size={20}/>} label="数据分析" active={activeTab === 'analysis'} onClick={() => setActiveTab('analysis')} />
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden border border-slate-600">
              <img src="https://picsum.photos/seed/candidate/100" alt="Avatar" />
            </div>
            <div>
              <p className="text-sm font-medium">Candidate X</p>
              <p className="text-xs text-slate-400">寒假挑战中...</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto relative">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">
              {activeTab === 'dashboard' && '寒假计划大本营'}
              {activeTab === 'calendar' && '学期时间轴'}
              {activeTab === 'analysis' && '效率洞察分析'}
            </h2>
            <div className="flex items-center gap-2 mt-1">
               <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-bold">1/28 - 3/1</span>
               <p className="text-slate-500 text-sm">阶段：{getPhaseLabel()}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={refreshSupervision}
              disabled={loadingAI}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50"
            >
              {loadingAI ? <Clock className="animate-spin" size={18} /> : <Zap size={18} className="text-yellow-400" />}
              AI 专家巡视
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-all font-medium">
              <Plus size={18} /> 新增目标
            </button>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
            <div className="lg:col-span-2 space-y-6">
              {/* Progress Tasks */}
              <section>
                <div className="flex items-center justify-between mb-4 px-2">
                   <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                     <Target className="text-emerald-500" size={20}/> 核心进度任务
                   </h3>
                </div>
                <div className="space-y-4">
                  {tasks.filter(t => t.taskType === 'progress').map(task => (
                    /* Wrap async handleSelectTask to match () => void expected by TaskItem */
                    <TaskItem key={task.id} task={task} onClick={() => { handleSelectTask(task); }} />
                  ))}
                </div>
              </section>

              {/* Habit Tasks */}
              <section>
                <div className="flex items-center justify-between mb-4 px-2">
                   <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                     <Clock className="text-blue-500" size={20}/> 每日习惯打卡
                   </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {tasks.filter(t => t.taskType === 'habit').map(task => (
                    /* Wrap async handleSelectTask to match () => void expected by HabitCard */
                    <HabitCard key={task.id} task={task} onClick={() => { handleSelectTask(task); }} />
                  ))}
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <AIFeedbackPanel aiFeedback={aiFeedback} loadingAI={loadingAI} />
              
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center justify-between">
                  <span>状态追踪反馈</span>
                  <span className="text-[10px] text-slate-400 font-normal">AI 会根据此内容调整建议</span>
                </h3>
                <textarea 
                  className="w-full text-sm p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none h-36 resize-none transition-all"
                  placeholder="今天遇到了什么卡点？或是驾考刷了多少题？在此记录..."
                  value={userContext}
                  onChange={(e) => setUserContext(e.target.value)}
                />
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 mb-4">关键 Checkpoints</h3>
                <div className="space-y-3">
                   <Checkpoint date="2/4" label="驾考/文献综述核验" isPast={new Date() > new Date('2025-02-04')} />
                   <Checkpoint date="2/11" label="大创启动与方向确定" isPast={new Date() > new Date('2025-02-11')} />
                   <Checkpoint date="2/14" label="大创论文截止 🚩" isPast={new Date() > new Date('2025-02-14')} isMain />
                   <Checkpoint date="2/25" label="论文50%进度核验" isPast={new Date() > new Date('2025-02-25')} />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'calendar' && <CalendarView tasks={tasks} />}
        {activeTab === 'analysis' && <AnalysisView tasks={tasks} />}

        {/* Task Detail Panel */}
        {selectedTask && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedTask(null)} />
            <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{selectedTask.title}</h3>
                  <p className="text-xs text-slate-400">{selectedTask.category}</p>
                </div>
                <button onClick={() => setSelectedTask(null)} className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-200 shadow-sm">
                  <X size={20} className="text-slate-500" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                <div>
                   <p className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-4 rounded-2xl italic border border-slate-100">
                     "{selectedTask.description}"
                   </p>
                </div>

                {selectedTask.taskType === 'progress' ? (
                  <div className="space-y-4">
                    <h5 className="font-bold text-slate-800 flex items-center gap-2">
                      <Sparkles size={16} className="text-emerald-500" /> AI 任务拆解
                    </h5>
                    <div className="space-y-2">
                      {selectedTask.subTasks.length > 0 ? selectedTask.subTasks.map(sub => (
                        <div 
                          key={sub.id} 
                          onClick={() => toggleSubTask(selectedTask.id, sub.id)}
                          className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer border transition-all ${sub.completed ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-white border-slate-100 text-slate-600 hover:border-slate-300'}`}>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${sub.completed ? 'bg-emerald-500 text-white scale-110' : 'border-2 border-slate-200'}`}>
                            {sub.completed && <CheckCircle size={14} />}
                          </div>
                          <span className={`text-sm font-medium ${sub.completed ? 'line-through opacity-70' : ''}`}>{sub.title}</span>
                        </div>
                      )) : <div className="text-center py-10 text-slate-400 animate-pulse text-xs">正在通过 AI 生成个性化任务分解...</div>}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h5 className="font-bold text-slate-800 flex items-center gap-2">
                      <Activity size={16} className="text-blue-500" /> 每日打卡统计
                    </h5>
                    <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                       <CheckInGrid 
                          taskId={selectedTask.id} 
                          checkInDates={selectedTask.checkInDates || []} 
                          onToggle={toggleCheckIn} 
                       />
                       <div className="mt-4 flex justify-between text-[10px] font-bold text-slate-400 px-2 uppercase">
                          <span>总计坚持: {selectedTask.checkInDates?.length} 天</span>
                          <span>目标: 持续至 3.1</span>
                       </div>
                    </div>
                  </div>
                )}
              </div>

              {selectedTask.taskType === 'progress' && (
                <div className="p-6 bg-slate-50 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-slate-500">总体完成进度</span>
                    <span className="text-sm font-black text-emerald-600">{selectedTask.progress}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                    <div className="h-full bg-emerald-500 transition-all duration-700 ease-out" style={{ width: `${selectedTask.progress}%` }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add Task Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setShowAddModal(false)} />
            <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 duration-200 border border-slate-100">
              <h3 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
                <Plus className="bg-slate-900 text-white p-1 rounded-lg" size={24}/>
                新增寒假挑战
              </h3>
              <div className="space-y-5">
                <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
                   <button 
                    onClick={() => setNewType('progress')}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${newType === 'progress' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>
                    进度型任务
                   </button>
                   <button 
                    onClick={() => setNewType('habit')}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${newType === 'habit' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}>
                    日常打卡型
                   </button>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">任务名称</label>
                  <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-900 outline-none transition-all font-medium" placeholder="例如：准备CFA面试"/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">所属分类</label>
                    <select value={newCat} onChange={(e) => setNewCat(e.target.value as TaskCategory)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-900 outline-none font-medium appearance-none">
                      {Object.values(TaskCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">优先级</label>
                    <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-900 outline-none font-medium appearance-none">
                      <option>High</option>
                      <option>Medium</option>
                      <option>Low</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">具体描述</label>
                  <textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-slate-900 outline-none font-medium h-24 resize-none" placeholder="描述越清晰，AI 拆解越精准..."/>
                </div>
              </div>
              <div className="flex gap-4 mt-8">
                <button onClick={() => setShowAddModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all">取消</button>
                <button onClick={handleAddTask} className="flex-1 py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-lg hover:bg-slate-800 transition-all">确认发布</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// --- Helper Components ---

const getPhaseLabel = () => {
  const d = new Date();
  if (d < new Date('2025-02-08')) return "第一阶段：驾考冲刺周";
  if (d < new Date('2025-02-15')) return "第二阶段：大创突击周";
  if (d < new Date('2025-02-23')) return "第三阶段：春节缓冲期";
  return "第四阶段：论文与投递冲刺";
};

// Properly type functional components to include common React props
const NavItem: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all ${active ? 'bg-slate-800 text-emerald-400 shadow-lg' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'}`}>
    {icon}
    <span className="text-sm font-bold">{label}</span>
  </button>
);

const TaskItem: React.FC<{ task: Task; onClick: () => void | Promise<void> }> = ({ task, onClick }) => (
  <div onClick={() => onClick()} className="group bg-white flex items-center gap-4 p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer">
    <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-emerald-50 transition-colors">
      {task.category === TaskCategory.ACADEMIC ? <BookOpen size={20} className="text-purple-500" /> : <Briefcase size={20} className="text-blue-500" />}
    </div>
    <div className="flex-1">
      <div className="flex items-center gap-2 mb-1">
        <h4 className="text-sm font-bold text-slate-800">{task.title}</h4>
        {task.priority === 'High' && <span className="text-[10px] bg-rose-50 text-rose-500 px-1.5 py-0.5 rounded font-black uppercase">Core</span>}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${task.progress}%` }} />
        </div>
        <span className="text-[10px] font-bold text-slate-400">{task.progress}%</span>
      </div>
    </div>
    <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
  </div>
);

const HabitCard: React.FC<{ task: Task; onClick: () => void | Promise<void> }> = ({ task, onClick }) => (
  <div onClick={() => onClick()} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer group">
    <div className="flex justify-between items-start mb-3">
      <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-blue-50 transition-colors">
         {task.category === TaskCategory.SKILL ? <Car size={18} className="text-orange-500" /> : <Activity size={18} className="text-blue-500" />}
      </div>
      <span className="text-[10px] font-bold text-slate-400 uppercase">打卡制</span>
    </div>
    <h4 className="text-sm font-bold text-slate-800 mb-1">{task.title}</h4>
    <p className="text-[10px] text-slate-400 line-clamp-1">{task.description}</p>
    <div className="mt-3 flex gap-1">
      {[...Array(7)].map((_, i) => (
        <div key={i} className={`h-1.5 flex-1 rounded-full ${i < (task.checkInDates?.length || 0) ? 'bg-blue-400' : 'bg-slate-100'}`} />
      ))}
    </div>
  </div>
);

const Checkpoint: React.FC<{ date: string, label: string, isPast: boolean, isMain?: boolean }> = ({ date, label, isPast, isMain }) => (
  <div className={`flex items-center gap-3 p-3 rounded-2xl border ${isMain ? 'border-rose-200 bg-rose-50/30' : 'border-slate-50 bg-slate-50/50'}`}>
     <div className={`text-[10px] font-black px-2 py-1 rounded-lg ${isPast ? 'bg-slate-200 text-slate-500' : 'bg-slate-900 text-white shadow-sm'}`}>
       {date}
     </div>
     <span className={`text-xs font-bold ${isPast ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{label}</span>
     {isMain && !isPast && <span className="ml-auto animate-pulse text-rose-500 font-black text-[10px]">!!!</span>}
  </div>
);

const CheckInGrid: React.FC<{ taskId: string, checkInDates: string[], onToggle: (taskId: string, date: string) => void }> = ({ taskId, checkInDates, onToggle }) => {
  const days = Array.from({ length: 32 }, (_, i) => {
    const d = new Date(2025, 0, 28 + i);
    return d.toISOString().split('T')[0];
  });

  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map(d => {
        const isSelected = checkInDates.includes(d);
        const dayNum = new Date(d).getDate();
        return (
          <div 
            key={d}
            onClick={() => onToggle(taskId, d)}
            className={`aspect-square rounded-xl flex items-center justify-center text-[10px] font-bold cursor-pointer transition-all ${isSelected ? 'bg-blue-500 text-white shadow-lg scale-105' : 'bg-white border border-slate-200 text-slate-400 hover:border-blue-300'}`}>
            {dayNum}
          </div>
        );
      })}
    </div>
  );
};

const AIFeedbackPanel: React.FC<{ aiFeedback: AISupervisionFeedback | null, loadingAI: boolean }> = ({ aiFeedback, loadingAI }) => (
  <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-700">
      <BrainCircuit size={120} />
    </div>
    <div className="relative z-10 space-y-5">
      <div className="flex items-center gap-3 text-indigo-300">
        <div className="bg-indigo-500/20 p-2 rounded-xl">
          <AlertCircle size={20} />
        </div>
        <span className="text-xs font-black uppercase tracking-[0.2em]">AI 阶段性诊断</span>
      </div>
      
      {loadingAI ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-4 bg-white/10 rounded w-3/4"></div>
          <div className="h-20 bg-white/10 rounded-2xl"></div>
        </div>
      ) : aiFeedback ? (
        <div className="space-y-6">
          <p className="text-xl font-bold leading-tight tracking-tight text-white/95">{aiFeedback.summary}</p>
          
          {aiFeedback.warnings.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] text-indigo-300 font-black uppercase tracking-wider">重要警示</p>
              {aiFeedback.warnings.map((w: string, i: number) => (
                <div key={i} className="flex gap-2 text-sm text-rose-300 font-medium bg-rose-500/10 p-2 rounded-xl border border-rose-500/20">
                  <span>•</span> {w}
                </div>
              ))}
            </div>
          )}

          <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
             <p className="text-[10px] text-indigo-200 font-black uppercase tracking-wider mb-2">明日高效建议</p>
             <p className="text-xs text-white/70 whitespace-pre-wrap leading-relaxed font-mono">{aiFeedback.adjustedSchedule}</p>
          </div>
        </div>
      ) : (
        <p className="text-indigo-200/60 text-sm italic">点击“巡视”获取当前阶段分析报告...</p>
      )}
    </div>
  </div>
);

const CalendarView: React.FC<{ tasks: Task[] }> = ({ tasks }) => (
  <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm animate-in zoom-in-95">
     <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-bold">寒假全程时间表 (1.28 - 3.1)</h3>
        <div className="flex gap-2 text-xs font-bold bg-slate-100 p-1 rounded-xl">
           <span className="px-3 py-1 bg-white rounded-lg shadow-sm">1月/2月</span>
           <span className="px-3 py-1 text-slate-400">3月</span>
        </div>
     </div>
     <div className="grid grid-cols-7 gap-4">
        {['日','一','二','三','四','五','六'].map(d => <div key={d} className="text-center text-xs font-black text-slate-300 py-2 uppercase">{d}</div>)}
        {[...Array(35)].map((_, i) => {
          const d = i - 1; // Align to 1.28
          const isCheck = d === 7 || d === 14 || d === 28;
          return (
            <div key={i} className={`aspect-video p-2 border rounded-2xl transition-all ${d > 0 && d <= 32 ? 'bg-white border-slate-100' : 'bg-slate-50 border-transparent opacity-30'} ${isCheck ? 'ring-2 ring-emerald-400' : ''}`}>
               <span className="text-[10px] font-bold text-slate-400">{d > 0 ? (d > 28 ? d - 28 : d) : d + 31}</span>
               {d === 14 && <div className="mt-1 text-[8px] bg-rose-500 text-white rounded p-0.5 text-center font-black">大创提交</div>}
               {d === 7 && <div className="mt-1 text-[8px] bg-emerald-500 text-white rounded p-0.5 text-center font-black">驾考科一</div>}
            </div>
          );
        })}
     </div>
  </div>
);

const AnalysisView: React.FC<{ tasks: Task[] }> = ({ tasks }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4">
    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
       <h3 className="text-lg font-bold mb-6">任务类别权重分布</h3>
       <div className="space-y-6">
          {Object.values(TaskCategory).map(cat => {
            const count = tasks.filter(t => t.category === cat).length;
            if (count === 0) return null;
            return (
              <div key={cat} className="space-y-2">
                 <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-600">{cat}</span>
                    <span className="text-slate-900">{count} 项</span>
                 </div>
                 <div className="h-4 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                    <div className="h-full bg-slate-900 transition-all duration-1000" style={{ width: `${(count / tasks.length) * 100}%` }} />
                 </div>
              </div>
            );
          })}
       </div>
    </div>
    <div className="bg-emerald-900 text-white rounded-[2.5rem] p-8 shadow-xl flex flex-col justify-center text-center items-center">
       <div className="bg-emerald-800 p-4 rounded-3xl mb-6">
          <Target size={40} />
       </div>
       <h3 className="text-xl font-bold mb-2">综合效率评分: 85</h3>
       <p className="text-sm text-emerald-200/80 leading-relaxed max-w-xs">
         学术类任务占比最高 (42%)。目前的瓶颈主要在于毕业论文的启动。建议在第一周将“驾考刷题”与“论文综述”交替进行。
       </p>
       <div className="mt-8 grid grid-cols-2 gap-4 w-full">
          <div className="bg-emerald-800/50 p-4 rounded-3xl border border-emerald-700">
             <p className="text-[10px] font-black uppercase text-emerald-400 mb-1">已消耗时间</p>
             <p className="text-lg font-bold">12%</p>
          </div>
          <div className="bg-emerald-800/50 p-4 rounded-3xl border border-emerald-700">
             <p className="text-[10px] font-black uppercase text-emerald-400 mb-1">剩余天数</p>
             <p className="text-lg font-bold">28天</p>
          </div>
       </div>
    </div>
  </div>
);

export default App;
