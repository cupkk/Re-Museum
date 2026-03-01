
import React, { useState } from 'react';
import { CollectedItem, GuideData } from '../types';
import { BookOpen, Plus, X, Star, Sparkles, Calendar, Search } from 'lucide-react';

interface CollectionGuideProps {
    items: CollectedItem[];
    guideData: GuideData;
    onUpdateGuide: (category: keyof GuideData, itemId: string) => void;
}

const GuideSection: React.FC<{
    title: string;
    description: string;
    icon: React.ReactNode;
    colorClass: string;
    itemIds: string[];
    allItems: CollectedItem[];
    onAdd: () => void;
}> = ({ title, description, icon, colorClass, itemIds, allItems, onAdd }) => {
    
    // Create a mix of filled slots and placeholders (visual consistency)
    const filledItems = itemIds.map(id => allItems.find(i => i.id === id)).filter(Boolean) as CollectedItem[];
    
    return (
        <div className="mb-12">
            <div className="flex items-center gap-4 mb-4 border-b border-neutral-800 pb-4">
                <div className={`p-3 rounded-full bg-neutral-900 border ${colorClass}`}>
                    {icon}
                </div>
                <div>
                    <h3 className="text-xl font-bold font-display text-white">{title}</h3>
                    <p className="text-xs text-neutral-500">{description}</p>
                </div>
            </div>

            <div className="flex flex-wrap gap-6">
                {/* Render Filled Items */}
                {filledItems.map(item => (
                    <div key={item.id} className="group relative flex flex-col items-center gap-3">
                         <div className={`w-16 h-16 md:w-24 md:h-24 rounded-full p-1 border-2 border-dashed ${colorClass} hover:border-solid hover:scale-110 transition-all duration-300 relative overflow-hidden bg-black`}>
                             <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-full" />
                             {/* Gloss effect */}
                             <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent to-white/20 pointer-events-none"></div>
                         </div>
                         <span className="text-xs font-mono text-neutral-400 max-w-[100px] truncate text-center group-hover:text-white transition-colors">
                             {item.name}
                         </span>
                    </div>
                ))}

                {/* Render 'Add' Slot */}
                    <button 
                    onClick={onAdd}
                    className={`w-16 h-16 md:w-24 md:h-24 rounded-full border-2 border-dashed border-neutral-700 hover:border-white hover:bg-neutral-800 transition-all flex flex-col items-center justify-center gap-2 group`}
                >
                    <Plus size={24} className="text-neutral-500 group-hover:text-white" />
                    <span className="text-[10px] text-neutral-500 font-mono group-hover:text-white">ADD</span>
                </button>
            </div>
        </div>
    );
};

const CollectionGuide: React.FC<CollectionGuideProps> = ({ items, guideData, onUpdateGuide }) => {
    const [activeCategory, setActiveCategory] = useState<keyof GuideData | null>(null);

    // Calculate existing IDs to disable them in modal
    const allUsedIds = new Set([
        ...guideData.common,
        ...guideData.rare,
        ...guideData.seasonal
    ]);

    const handleAddItem = (itemId: string) => {
        if (activeCategory) {
            onUpdateGuide(activeCategory, itemId);
            setActiveCategory(null);
        }
    };

    return (
        <div className="h-full bg-remuse-dark text-white relative">
            <div className="p-4 md:p-8 h-full overflow-y-auto pb-32">
                 {/* Header */}
                 <div className="flex items-end justify-between mb-12 animate-fade-in">
                     <div>
                         <h1 className="text-2xl md:text-4xl font-bold font-display tracking-tight mb-2 flex items-center gap-3">
                             <BookOpen size={36} className="text-remuse-secondary" />
                             COLLECTION GUIDE
                         </h1>
                         <p className="text-neutral-500 text-sm max-w-lg">
                             归档你的特殊发现。完成图鉴以解锁专属徽章。
                         </p>
                     </div>
                     <div className="hidden md:block text-right">
                         <span className="block text-3xl font-display font-bold text-white">
                             {guideData.common.length + guideData.rare.length + guideData.seasonal.length}
                         </span>
                         <span className="text-[10px] text-neutral-500 font-mono tracking-widest uppercase">Badges Collected</span>
                     </div>
                 </div>

                 <div className="max-w-6xl mx-auto animate-fade-in" style={{ animationDelay: '100ms' }}>
                     
                     <GuideSection 
                        title="COMMON OBJECTS" 
                        description="日常生活的碎片，记录平凡中的美。"
                        icon={<Star className="text-neutral-300" />}
                        colorClass="border-neutral-500 text-neutral-300"
                        itemIds={guideData.common}
                        allItems={items}
                        onAdd={() => setActiveCategory('common')}
                     />

                     <GuideSection 
                        title="RARE FINDS" 
                        description="独特的材质或不再生产的绝版包装。"
                        icon={<Sparkles className="text-purple-400" />}
                        colorClass="border-purple-500 text-purple-400"
                        itemIds={guideData.rare}
                        allItems={items}
                        onAdd={() => setActiveCategory('rare')}
                     />

                     <GuideSection 
                        title="SEASONAL LIMITED" 
                        description="特定节日或季节限定的特殊收藏。"
                        icon={<Calendar className="text-remuse-accent" />}
                        colorClass="border-remuse-accent text-remuse-accent"
                        itemIds={guideData.seasonal}
                        allItems={items}
                        onAdd={() => setActiveCategory('seasonal')}
                     />

                 </div>
            </div>

            {/* Selection Modal */}
            {activeCategory && (
                <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col animate-fade-in">
                    <div className="p-6 border-b border-white/10 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold font-display text-white">SELECT ITEM FOR ARCHIVE</h2>
                            <p className="text-xs text-neutral-500 font-mono mt-1">
                                TARGET: <span className="text-remuse-secondary uppercase">{activeCategory}</span>
                            </p>
                        </div>
                        <button 
                            onClick={() => setActiveCategory(null)}
                            className="p-2 bg-neutral-800 hover:bg-white hover:text-black rounded-full transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6">
                        {items.filter(i => !allUsedIds.has(i.id)).length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-neutral-500">
                                <Search size={48} className="mb-4 opacity-50" />
                                <p>没有更多可选物品</p>
                                <p className="text-xs mt-2">快去收集更多物品吧！</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {items.map((item) => {
                                    const isUsed = allUsedIds.has(item.id);
                                    if (isUsed) return null;

                                    return (
                                        <button 
                                            key={item.id}
                                            onClick={() => handleAddItem(item.id)}
                                            className="group relative aspect-square bg-neutral-900 border border-neutral-800 hover:border-remuse-secondary rounded-lg overflow-hidden transition-all text-left"
                                        >
                                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                                            <div className="absolute bottom-0 left-0 w-full p-2 bg-gradient-to-t from-black to-transparent">
                                                <span className="text-xs font-display font-bold text-white truncate block">{item.name}</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CollectionGuide;
