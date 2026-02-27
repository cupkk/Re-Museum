
import React, { useMemo, useState } from 'react';
import { CollectedItem, Tool } from '../types';
import { Trophy, Sprout, Star, Hexagon, Zap, Award, Crown, Medal, Briefcase, Wrench, Scissors, PenTool, Ruler, Brush, X, Plus, Check, Trash2 } from 'lucide-react';

interface CuratorOfficeProps {
  items: CollectedItem[];
}

// --- Visualizations ---

const JarVisualization: React.FC<{ count: number }> = ({ count }) => {
  // Generate random positions for particles inside the jar
  const particles = useMemo(() => {
    return Array.from({ length: Math.min(count, 50) }).map((_, i) => ({
      id: i,
      x: 20 + Math.random() * 60, // 20% to 80% width
      y: 80 - Math.random() * (Math.min(i * 2, 60)), // Stack upwards roughly
      rotation: Math.random() * 360,
      type: Math.random() > 0.5 ? 'star' : 'crane',
      color: ['#ccff00', '#00ffff', '#ffffff'][Math.floor(Math.random() * 3)]
    }));
  }, [count]);

  return (
    <div className="relative w-full h-64 flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="h-full overflow-visible drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">
        {/* Jar Body */}
        <path 
          d="M30 10 L70 10 L75 20 L75 85 Q75 95 65 95 L35 95 Q25 95 25 85 L25 20 L30 10 Z" 
          fill="rgba(255,255,255,0.05)" 
          stroke="rgba(255,255,255,0.3)" 
          strokeWidth="1"
        />
        {/* Jar Lid Highlight */}
        <path d="M30 12 L70 12" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5" />
        
        {/* Particles */}
        {particles.map((p) => (
          <g key={p.id} transform={`translate(${p.x}, ${p.y}) rotate(${p.rotation})`}>
            {p.type === 'star' ? (
              <path d="M0 -2 L0.6 -0.6 L2 0 L0.6 0.6 L0 2 L-0.6 0.6 L-2 0 L-0.6 -0.6 Z" fill={p.color} className="animate-pulse" style={{animationDuration: `${2 + Math.random()}s`}} />
            ) : (
              // Abstract crane/paper shape
              <path d="M0 0 L3 -2 L0 -4 L-3 -2 Z" fill={p.color} opacity="0.8" />
            )}
          </g>
        ))}

        {/* Label */}
        <text x="50" y="105" textAnchor="middle" className="text-[6px] fill-neutral-500 font-mono tracking-widest">
          COLLECTION JAR
        </text>
      </svg>
      <div className="absolute top-4 right-4 bg-remuse-panel border border-remuse-border px-2 py-1 rounded">
        <span className="text-xs text-white font-mono">{count} Items</span>
      </div>
    </div>
  );
};

const GardenVisualization: React.FC<{ remusedCount: number }> = ({ remusedCount }) => {
  // Generate trees based on count
  const trees = useMemo(() => {
    return Array.from({ length: Math.min(remusedCount, 20) }).map((_, i) => ({
      id: i,
      x: 10 + (i % 5) * 20 + (Math.random() * 10 - 5), 
      y: 20 + Math.floor(i / 5) * 20 + (Math.random() * 10 - 5),
      scale: 0.8 + Math.random() * 0.4
    }));
  }, [remusedCount]);

  return (
    <div className="relative w-full h-64 bg-neutral-900/30 border border-neutral-800 flex items-center justify-center overflow-hidden">
        {/* Grid Floor */}
        <div className="absolute inset-0 bg-grid-pattern opacity-20 transform perspective-1000 rotate-x-60 scale-150"></div>
        
        <div className="relative w-full h-full p-8 grid grid-cols-5 gap-4 content-center">
            {trees.length === 0 && (
                <div className="col-span-5 text-center text-neutral-600 font-mono text-xs">
                    森林尚未生长...<br/>完成改造以种植树木
                </div>
            )}
            {trees.map((tree) => (
                <div 
                    key={tree.id} 
                    className="flex justify-center items-end animate-fade-in"
                    style={{ transitionDelay: `${tree.id * 100}ms` }}
                >
                    <Sprout 
                        size={32 * tree.scale} 
                        className="text-remuse-accent drop-shadow-[0_0_5px_rgba(204,255,0,0.5)]" 
                        strokeWidth={1.5}
                    />
                </div>
            ))}
        </div>
        
        {/* Label */}
        <div className="absolute bottom-2 w-full text-center">
             <span className="text-[10px] text-neutral-500 font-mono tracking-widest uppercase">Regeneration Forest</span>
        </div>
        <div className="absolute top-4 right-4 bg-remuse-panel border border-remuse-border px-2 py-1 rounded">
           <span className="text-xs text-remuse-accent font-mono">{remusedCount} Trees</span>
        </div>
    </div>
  );
};

// --- Achievements ---

interface Achievement {
    id: string;
    title: string;
    desc: string;
    icon: React.ReactNode;
    condition: (items: CollectedItem[]) => boolean;
}

const ACHIEVEMENTS: Achievement[] = [
    {
        id: 'beginner',
        title: '初级收藏家',
        desc: '收集首个物品',
        icon: <Star size={24} />,
        condition: (items) => items.length >= 1
    },
    {
        id: 'creator',
        title: '再生新手',
        desc: '完成1次改造',
        icon: <Zap size={24} />,
        condition: (items) => items.some(i => i.status === 'remused')
    },
    {
        id: 'hoarder',
        title: '档案管理员',
        desc: '收集超过10个物品',
        icon: <Award size={24} />,
        condition: (items) => items.length >= 10
    },
    {
        id: 'master',
        title: '再生大师',
        desc: '完成5次改造',
        icon: <Crown size={24} />,
        condition: (items) => items.filter(i => i.status === 'remused').length >= 5
    },
    {
        id: 'guardian',
        title: '地球守护者',
        desc: '收集超过20个物品',
        icon: <Medal size={24} />,
        condition: (items) => items.length >= 20
    }
];

const AchievementBadge: React.FC<{ achievement: Achievement; unlocked: boolean }> = ({ achievement, unlocked }) => {
    return (
        <div className={`group relative flex flex-col items-center p-4 transition-all duration-500 ${unlocked ? 'opacity-100' : 'opacity-40 grayscale'}`}>
            <div className="relative mb-3">
                {/* Hexagon Background */}
                <div className={`w-16 h-16 flex items-center justify-center transition-all duration-500 clip-corner
                    ${unlocked 
                        ? 'bg-remuse-accent text-black shadow-[0_0_20px_rgba(204,255,0,0.4)] scale-110' 
                        : 'bg-transparent border border-neutral-600 text-neutral-500'}
                `}>
                    {achievement.icon}
                </div>
                {unlocked && <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full animate-ping"></div>}
            </div>
            <h4 className={`font-bold font-display text-sm mb-1 ${unlocked ? 'text-white' : 'text-neutral-500'}`}>
                {achievement.title}
            </h4>
            <p className="text-[10px] text-neutral-500 text-center max-w-[100px]">{achievement.desc}</p>
        </div>
    );
};

// --- Toolkit Section Components ---

const DEFAULT_TOOLS: Tool[] = [
  { id: '1', name: '精密剪刀', iconType: 'scissors', color: '#ff0055' },
  { id: '2', name: '强力胶带', iconType: 'tape', color: '#ccff00' },
  { id: '3', name: '万能胶水', iconType: 'glue', color: '#00ffff' },
  { id: '4', name: '螺丝刀组', iconType: 'screwdriver', color: '#ff9900' },
  { id: '5', name: '刻刀', iconType: 'knife', color: '#e5e5e5' },
  { id: '6', name: '钢尺', iconType: 'ruler', color: '#a3a3a3' },
];

const ToolIcon: React.FC<{ type: string; size?: number; color?: string }> = ({ type, size = 24, color = 'currentColor' }) => {
  switch (type) {
    case 'scissors': return <Scissors size={size} color={color} />;
    case 'tape': return <div style={{width: size, height: size, borderRadius: '50%', border: `3px solid ${color}`, opacity: 0.8}}></div>;
    case 'glue': return <PenTool size={size} color={color} />;
    case 'screwdriver': return <Wrench size={size} color={color} />;
    case 'brush': return <Brush size={size} color={color} />;
    case 'ruler': return <Ruler size={size} color={color} />;
    case 'knife': return <div className="rotate-45" style={{ color }}><PenTool size={size} /></div>;
    default: return <Briefcase size={size} color={color} />;
  }
};

const CuratorOffice: React.FC<CuratorOfficeProps> = ({ items }) => {
  const remusedCount = items.filter(i => i.status === 'remused').length;
  const [isToolkitOpen, setIsToolkitOpen] = useState(false);
  const [myTools, setMyTools] = useState<Tool[]>(DEFAULT_TOOLS);
  
  // Add Tool Modal State
  const [showAddToolModal, setShowAddToolModal] = useState(false);
  const [newToolName, setNewToolName] = useState('');
  const [newToolColor, setNewToolColor] = useState('#ccff00');

  // Determine icon based on name
  const determineIconType = (name: string): Tool['iconType'] => {
    const n = name.trim().toLowerCase();
    if (n.includes('剪') || n.includes('scissors') || n.includes('cut')) return 'scissors';
    if (n.includes('胶带') || n.includes('tape')) return 'tape';
    if (n.includes('胶') || n.includes('glue') || n.includes('粘')) return 'glue';
    if (n.includes('螺') || n.includes('driver') || n.includes('screw') || n.includes('wrench') || n.includes('扳')) return 'screwdriver';
    if (n.includes('笔') || n.includes('刷') || n.includes('brush') || n.includes('paint')) return 'brush';
    if (n.includes('尺') || n.includes('ruler') || n.includes('量')) return 'ruler';
    if (n.includes('刀') || n.includes('knife')) return 'knife';
    return 'other';
  };

  const handleAddTool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newToolName.trim()) return;

    const newTool: Tool = {
        id: crypto.randomUUID(),
        name: newToolName,
        iconType: determineIconType(newToolName),
        color: newToolColor
    };

    setMyTools([...myTools, newTool]);
    setNewToolName('');
    setNewToolColor('#ccff00');
    setShowAddToolModal(false);
  };

  const handleDeleteTool = (id: string) => {
      setMyTools(prev => prev.filter(t => t.id !== id));
  };

  // If toolkit is open, render the sub-page overlay
  if (isToolkitOpen) {
    return (
      <div className="absolute inset-0 z-50 bg-neutral-900 flex flex-col animate-fade-in">
        {/* Header */}
        <div className="p-6 border-b border-remuse-border bg-remuse-panel flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-remuse-accent text-black clip-corner">
               <Briefcase size={24} />
             </div>
             <div>
               <h2 className="text-2xl font-bold font-display text-white tracking-wide">MY TOOLKIT</h2>
               <p className="text-xs text-neutral-500 mt-1">自定义你的再生工具库</p>
             </div>
          </div>
          <button 
            onClick={() => setIsToolkitOpen(false)}
            className="p-2 hover:bg-neutral-800 rounded-full text-neutral-500 hover:text-white transition-colors"
          >
            <X size={28} />
          </button>
        </div>

        {/* Grid Cabinet Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-12 bg-neutral-900">
           <div className="max-w-4xl mx-auto">
              
              {/* Cabinet Frame */}
              <div className="bg-[#151515] p-4 rounded-lg border-[3px] border-neutral-700 shadow-2xl relative">
                  {/* Decorative Screws */}
                  <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-neutral-600"></div>
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-neutral-600"></div>
                  <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-neutral-600"></div>
                  <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-neutral-600"></div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                     {/* Render Tools in Slots */}
                     {myTools.map((tool, idx) => (
                       <div key={tool.id} className="aspect-square bg-[#0a0a0a] border border-neutral-800 rounded shadow-inner flex flex-col items-center justify-center group relative hover:border-remuse-accent/50 transition-colors">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteTool(tool.id); }}
                            className="absolute top-1 right-1 p-1 text-neutral-700 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                             <Trash2 size={12} />
                          </button>

                          <div className="transform group-hover:scale-110 transition-transform duration-300 drop-shadow-lg">
                             <ToolIcon type={tool.iconType} size={40} color={tool.color} />
                          </div>
                          <span className="mt-4 text-xs font-mono text-neutral-400 group-hover:text-white">{tool.name}</span>
                          
                          {/* Slot Number Label */}
                          <span className="absolute top-2 left-2 text-[8px] text-neutral-700 font-mono">SLOT-{String(idx + 1).padStart(2,'0')}</span>
                       </div>
                     ))}
                     
                     {/* Add Button Slot */}
                     {myTools.length < 16 && (
                        <button 
                            onClick={() => setShowAddToolModal(true)}
                            className="aspect-square bg-[#0f0f0f] border border-dashed border-neutral-700 hover:border-remuse-accent rounded flex flex-col items-center justify-center group transition-colors"
                        >
                            <div className="w-10 h-10 rounded-full bg-neutral-800 group-hover:bg-remuse-accent group-hover:text-black flex items-center justify-center transition-colors mb-2">
                                <Plus size={20} />
                            </div>
                            <span className="text-[10px] text-neutral-500 group-hover:text-remuse-accent font-display">ADD TOOL</span>
                        </button>
                     )}

                     {/* Remaining Empty Slots (Filler to maintain grid look) */}
                     {Array.from({ length: Math.max(0, 11 - myTools.length) }).map((_, i) => (
                        <div key={`empty-${i}`} className="aspect-square bg-[#0a0a0a]/50 border border-neutral-800/30 rounded flex items-center justify-center opacity-30 border-dashed pointer-events-none">
                           <Plus size={20} className="text-neutral-800" />
                        </div>
                     ))}
                  </div>
              </div>
              
              <div className="mt-8 text-center">
                 <p className="text-xs font-mono text-neutral-500">
                    * 更多工具插槽正在解锁中 (Level {Math.floor(items.length / 5) + 1})
                 </p>
              </div>
           </div>
        </div>

        {/* Add Tool Modal */}
        {showAddToolModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
             <div className="bg-remuse-panel border border-remuse-border w-full max-w-sm p-6 relative clip-corner shadow-2xl">
                <button 
                  onClick={() => setShowAddToolModal(false)}
                  className="absolute top-4 right-4 text-neutral-500 hover:text-white"
                >
                  <X size={20} />
                </button>
                
                <h2 className="text-xl font-bold text-white font-display mb-6 flex items-center gap-2">
                    <Wrench size={20} className="text-remuse-accent" /> 获取新装备
                </h2>
                
                <form onSubmit={handleAddTool} className="space-y-4">
                  <div>
                    <label className="block text-xs font-mono text-neutral-500 mb-2">工具名称</label>
                    <input 
                      type="text" 
                      value={newToolName}
                      onChange={(e) => setNewToolName(e.target.value)}
                      placeholder="例如：热熔胶枪"
                      className="w-full bg-neutral-900 border border-neutral-700 p-3 text-white focus:border-remuse-accent outline-none font-mono text-sm"
                      autoFocus
                    />
                    <p className="text-[10px] text-neutral-600 mt-1">* 系统将根据名称自动匹配图标</p>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-neutral-500 mb-2">标识颜色</label>
                    <div className="flex items-center gap-3">
                        <input 
                            type="color" 
                            value={newToolColor}
                            onChange={(e) => setNewToolColor(e.target.value)}
                            className="w-10 h-10 bg-transparent cursor-pointer border-none p-0"
                        />
                        <span className="text-xs font-mono text-neutral-400">{newToolColor}</span>
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={!newToolName}
                    className={`w-full py-3 mt-4 font-bold font-display flex items-center justify-center gap-2 transition-colors
                      ${!newToolName 
                        ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed' 
                        : 'bg-remuse-accent text-black hover:bg-white'}
                    `}
                  >
                    <Check size={18} /> 确认入库
                  </button>
                </form>
             </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-remuse-dark pb-24">
      {/* Header */}
      <div className="p-8 border-b border-remuse-border bg-remuse-panel">
          <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-neutral-800 rounded-full border-2 border-remuse-accent overflow-hidden relative">
                  <img src="https://i.pravatar.cc/150?u=remuse" alt="Avatar" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-remuse-accent mix-blend-color opacity-20"></div>
              </div>
              <div>
                  <h1 className="text-2xl font-bold text-white font-display tracking-tight">
                      CURATOR OFFICE <span className="text-remuse-accent">::</span> ADMIN
                  </h1>
                  <p className="text-neutral-500 text-xs mt-1">
                      ID: 89757 // LEVEL {Math.floor(items.length / 5) + 1}
                  </p>
              </div>
          </div>
      </div>

      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-12">
          
          {/* Visualizations Section */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left: Collection Jar */}
              <div className="bg-remuse-panel border border-remuse-border p-6 rounded-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 flex gap-2">
                       <Hexagon size={16} className="text-neutral-700" />
                       <Hexagon size={16} className="text-neutral-700" />
                  </div>
                  <h3 className="text-lg font-display text-neutral-300 mb-6 flex items-center gap-2">
                      <Star size={16} className="text-remuse-secondary"/> 馆藏星屑
                  </h3>
                  <JarVisualization count={items.length} />
                  <p className="text-center text-neutral-500 text-xs mt-4 font-mono">
                      每一件物品都是时间的结晶
                  </p>
              </div>

              {/* Right: Regeneration Forest */}
              <div className="bg-remuse-panel border border-remuse-border p-6 rounded-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 flex gap-2">
                       <Hexagon size={16} className="text-neutral-700" />
                       <Hexagon size={16} className="text-neutral-700" />
                  </div>
                  <h3 className="text-lg font-display text-neutral-300 mb-6 flex items-center gap-2">
                      <Sprout size={16} className="text-remuse-accent"/> 再生森林
                  </h3>
                  <GardenVisualization remusedCount={remusedCount} />
                  <p className="text-center text-neutral-500 text-xs mt-4 font-mono">
                      你的创意正在治愈这片数字荒原
                  </p>
              </div>
          </section>
          
          {/* --- NEW: TOOLKIT SECTION --- */}
          <section>
             <div className="flex items-center gap-4 mb-6">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent to-neutral-700"></div>
                <h2 className="text-xl font-display text-white flex items-center gap-2">
                    <Briefcase className="text-remuse-accent" size={20} /> 
                    EQUIPMENT
                </h2>
                <div className="h-px flex-1 bg-gradient-to-l from-transparent to-neutral-700"></div>
             </div>

             <div 
               onClick={() => setIsToolkitOpen(true)}
               className="group relative w-full h-32 md:h-40 bg-[#1a1a1a] border-2 border-neutral-700 hover:border-remuse-accent cursor-pointer transition-all duration-300 rounded-lg overflow-hidden flex items-center justify-center shadow-lg hover:shadow-[0_0_20px_rgba(204,255,0,0.1)]"
             >
                {/* Background Details simulating metal texture */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                
                {/* Handle Visual */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-4 bg-neutral-800 rounded-b-lg border-b border-x border-neutral-600"></div>

                {/* Content */}
                <div className="relative z-10 flex flex-col items-center gap-3">
                   <div className="flex items-center gap-4 text-neutral-400 group-hover:text-remuse-accent transition-colors">
                      <Briefcase size={32} strokeWidth={1.5} />
                      <span className="text-2xl md:text-3xl font-black font-display tracking-tight">TOOLKIT</span>
                   </div>
                   <div className="flex gap-2">
                      {myTools.slice(0, 5).map((tool) => (
                        <div key={tool.id} className="w-1 h-1 rounded-full" style={{ backgroundColor: tool.color }}></div>
                      ))}
                      <span className="text-[10px] text-neutral-500 font-mono ml-2">ACCESS GRANTED</span>
                   </div>
                </div>

                {/* "Open" Hint */}
                <div className="absolute bottom-3 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-mono text-remuse-accent flex items-center gap-1">
                   OPEN CASE <Zap size={10} />
                </div>
             </div>
          </section>

          {/* Achievement Grid */}
          <section>
              <div className="flex items-center gap-4 mb-8">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-neutral-700"></div>
                  <h2 className="text-xl font-display text-white flex items-center gap-2">
                      <Trophy className="text-remuse-secondary" size={20} /> 
                      ACHIEVEMENTS
                  </h2>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-neutral-700"></div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {ACHIEVEMENTS.map(ach => (
                      <AchievementBadge 
                          key={ach.id} 
                          achievement={ach} 
                          unlocked={ach.condition(items)} 
                      />
                  ))}
              </div>
          </section>

          {/* Stats Summary Footer */}
          <div className="grid grid-cols-3 gap-4 border-t border-neutral-800 pt-8">
              <div className="text-center">
                  <span className="block text-3xl font-display font-bold text-white mb-1">{items.length}</span>
                  <span className="text-[10px] text-neutral-500 font-mono uppercase">Total Items</span>
              </div>
              <div className="text-center border-l border-neutral-800">
                  <span className="block text-3xl font-display font-bold text-remuse-accent mb-1">{remusedCount}</span>
                  <span className="text-[10px] text-neutral-500 font-mono uppercase">Remused</span>
              </div>
              <div className="text-center border-l border-neutral-800">
                  <span className="block text-3xl font-display font-bold text-remuse-secondary mb-1">
                      {remusedCount * 10 + items.length * 5}
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono uppercase">Eco Points</span>
              </div>
          </div>

      </div>
    </div>
  );
};

export default CuratorOffice;
