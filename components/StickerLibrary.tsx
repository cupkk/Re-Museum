
import React, { useState, useRef, useEffect } from 'react';
import { Sticker, ItemCategory } from '../types';
import { Sticker as StickerIcon, Search, Download, Trash2, Box, Layers, RotateCcw, Move, MousePointer2, CheckCircle2, X, Grid, Shuffle, Save } from 'lucide-react';

interface StickerLibraryProps {
    stickers: Sticker[];
    onDeleteSticker: (id: string) => void;
}

interface LayoutItem {
    instanceId: string;
    sticker: Sticker;
    x: number; // percentage 0-100
    y: number; // percentage 0-100
    rotation: number;
    scale: number;
    zIndex: number;
}

const StickerCard: React.FC<{ 
    sticker: Sticker; 
    onDelete: () => void; 
    selectable?: boolean;
    selected?: boolean;
    onToggleSelect?: () => void;
}> = ({ sticker, onDelete, selectable, selected, onToggleSelect }) => {
    return (
        <div 
            onClick={selectable ? onToggleSelect : undefined}
            className={`relative group bg-neutral-900 border rounded-lg p-4 flex flex-col items-center transition-all duration-200
                ${selectable ? 'cursor-pointer' : ''}
                ${selected 
                    ? 'border-remuse-accent ring-1 ring-remuse-accent bg-neutral-800' 
                    : 'border-neutral-800 hover:border-neutral-600'}
            `}
        >
            
            {/* Selection Indicator */}
            {selectable && (
                <div className={`absolute top-2 left-2 w-5 h-5 rounded-full border flex items-center justify-center transition-colors z-20
                    ${selected ? 'bg-remuse-accent border-remuse-accent text-black' : 'border-neutral-600 bg-black/50'}
                `}>
                    {selected && <CheckCircle2 size={12} />}
                </div>
            )}

            {/* Action Bar (Only show if not in selection mode) */}
            {!selectable && (
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            const link = document.createElement('a');
                            link.href = sticker.stickerImageUrl;
                            link.download = `remuse-sticker-${sticker.id}.png`;
                            link.click();
                        }}
                        className="p-1.5 bg-neutral-800 text-white hover:text-remuse-accent rounded border border-neutral-700"
                        title="Download"
                    >
                        <Download size={14} />
                    </button>
                    <button 
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className="p-1.5 bg-neutral-800 text-white hover:text-red-500 rounded border border-neutral-700"
                        title="Delete"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            )}

            {/* Sticker Image */}
            <div className="relative w-full aspect-square mb-4 flex items-center justify-center bg-neutral-950 rounded overflow-hidden border border-neutral-800" style={{ backgroundImage: 'linear-gradient(45deg, #1a1a1a 25%, transparent 25%), linear-gradient(-45deg, #1a1a1a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #1a1a1a 75%), linear-gradient(-45deg, transparent 75%, #1a1a1a 75%)', backgroundSize: '16px 16px', backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px' }}>
                <img 
                    src={sticker.stickerImageUrl} 
                    alt="Sticker" 
                    className={`max-w-[80%] max-h-[80%] object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-transform duration-500
                        ${!selectable && 'group-hover:scale-110'}
                    `}
                />
            </div>

            {/* Text Bubble - ONLY in Library Card View, NOT in Collage */}
            <div className={`relative w-full bg-black border border-white p-2 md:p-3 rounded-none shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] transform transition-transform ${selected ? 'rotate-0' : '-rotate-1'}`}>
                <p className="font-mono text-[10px] md:text-xs font-bold text-white text-center leading-relaxed line-clamp-2">
                    "{sticker.dramaText}"
                </p>
            </div>
        </div>
    );
};

const StickerLibrary: React.FC<StickerLibraryProps> = ({ stickers, onDeleteSticker }) => {
    // View Mode: 'LIBRARY' (Grid) or 'CANVAS' (Layout Editor)
    const [viewMode, setViewMode] = useState<'LIBRARY' | 'CANVAS'>('LIBRARY');
    
    // Filter & Selection
    const [filter, setFilter] = useState('ALL');
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Canvas State
    const [layoutItems, setLayoutItems] = useState<LayoutItem[]>([]);
    const [isCustomMode, setIsCustomMode] = useState(false); // Enable dragging
    const [activeDragId, setActiveDragId] = useState<string | null>(null);
    const canvasRef = useRef<HTMLDivElement>(null);

    const categories = ['ALL', ...Object.values(ItemCategory)];
    const filteredStickers = filter === 'ALL' 
        ? stickers 
        : stickers.filter(s => s.category === filter);

    // --- Selection Handlers ---

    const toggleSelectionMode = () => {
        if (isSelectionMode) {
            // Cancel selection
            setIsSelectionMode(false);
            setSelectedIds(new Set());
        } else {
            setIsSelectionMode(true);
        }
    };

    const handleSelectSticker = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            if (newSet.size >= 9) {
                alert("最多选择 9 张贴纸");
                return;
            }
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    // --- Layout Handlers ---

    const generateRandomLayout = (itemsToLayout: Sticker[]) => {
        const count = itemsToLayout.length;
        if (count === 0) {
            setLayoutItems([]);
            return;
        }

        // --- Non-overlapping Grid Algorithm ---
        
        // Determine grid size (e.g., 4 items -> 2x2, 5 items -> 3x2 or 2x3)
        const cols = Math.ceil(Math.sqrt(count));
        const rows = Math.ceil(count / cols);
        
        const cellWidth = 100 / cols;
        const cellHeight = 100 / rows;

        // Dynamic Base Scale to prevent overlap
        let baseScale = 1.0;
        if (count > 1) baseScale = 0.9;
        if (count > 4) baseScale = 0.75;
        if (count > 6) baseScale = 0.65;
        if (count >= 9) baseScale = 0.55;

        // Shuffle items so they don't always appear in same order
        const shuffled = [...itemsToLayout].sort(() => Math.random() - 0.5);

        const newLayoutItems: LayoutItem[] = shuffled.map((sticker, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);

            // Calculate base center of the cell
            const baseX = (col * cellWidth) + (cellWidth / 2);
            const baseY = (row * cellHeight) + (cellHeight / 2);

            // Restrict jitter to small percentage of cell size to ensure sticker stays in its lane
            const jitterX = (Math.random() - 0.5) * (cellWidth * 0.2); 
            const jitterY = (Math.random() - 0.5) * (cellHeight * 0.2);

            return {
                instanceId: `layout-${sticker.id}-${Date.now()}-${index}`,
                sticker,
                x: baseX + jitterX,
                y: baseY + jitterY,
                rotation: (Math.random() * 20) - 10, // Moderate rotation (-10 to 10 deg)
                scale: baseScale * (0.9 + Math.random() * 0.2), // Variation +/- 10%
                zIndex: index + 1
            };
        });
        setLayoutItems(newLayoutItems);
    };

    const enterCanvasMode = () => {
        const selectedStickers = stickers.filter(s => selectedIds.has(s.id));
        generateRandomLayout(selectedStickers);
        setViewMode('CANVAS');
        setIsCustomMode(false);
    };

    const handleReLayout = () => {
        const currentStickers = layoutItems.map(item => item.sticker);
        generateRandomLayout(currentStickers);
    };

    const handleExportLayout = async () => {
        if (!canvasRef.current) return;
        
        const canvas = document.createElement('canvas');
        const rect = canvasRef.current.getBoundingClientRect();
        
        // High resolution export
        const scaleFactor = 2; 
        canvas.width = rect.width * scaleFactor;
        canvas.height = rect.height * scaleFactor;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        ctx.scale(scaleFactor, scaleFactor);
        
        // 1. Fill Background - transparent (clearRect)
        ctx.clearRect(0, 0, rect.width, rect.height);
        
        // 2. Draw Items
        const sortedItems = [...layoutItems].sort((a, b) => a.zIndex - b.zIndex);
        
        const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
             const img = new Image();
             img.crossOrigin = "anonymous";
             img.onload = () => resolve(img);
             img.onerror = reject;
             img.src = src;
        });

        for (const item of sortedItems) {
             try {
                 const img = await loadImage(item.sticker.stickerImageUrl);
                 ctx.save();
                 
                 const x = (item.x / 100) * rect.width;
                 const y = (item.y / 100) * rect.height;
                 
                 ctx.translate(x, y);
                 ctx.rotate((item.rotation * Math.PI) / 180);
                 ctx.scale(item.scale, item.scale);
                 
                 const baseWidth = window.innerWidth >= 768 ? 192 : 128;
                 const drawWidth = baseWidth;
                 const drawHeight = (img.height / img.width) * drawWidth;
                 
                 // 贴纸已有真透明背景，直接绘制
                 ctx.globalCompositeOperation = 'source-over';
                 ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
                 
                 ctx.restore();
             } catch (err) {
                 console.error(err);
             }
        }
        
        // 3. Download
        const link = document.createElement('a');
        link.download = `remuse-layout-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    // --- Drag & Drop Logic ---

    const handleMouseDown = (e: React.MouseEvent, instanceId: string) => {
        if (!isCustomMode || !canvasRef.current) return;
        
        setActiveDragId(instanceId);
        
        // Bring to front
        setLayoutItems(prev => {
            const maxZ = Math.max(...prev.map(i => i.zIndex));
            return prev.map(item => 
                item.instanceId === instanceId ? { ...item, zIndex: maxZ + 1 } : item
            );
        });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!activeDragId || !isCustomMode || !canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
        const yPercent = ((e.clientY - rect.top) / rect.height) * 100;

        // Clamp to some bounds so we don't lose items
        const clampedX = Math.max(0, Math.min(100, xPercent));
        const clampedY = Math.max(0, Math.min(100, yPercent));

        setLayoutItems(prev => prev.map(item => {
            if (item.instanceId === activeDragId) {
                return { ...item, x: clampedX, y: clampedY };
            }
            return item;
        }));
    };

    const handleMouseUp = () => {
        setActiveDragId(null);
    };

    // Global mouse up to catch drops outside the element
    useEffect(() => {
        const handleGlobalUp = () => setActiveDragId(null);
        window.addEventListener('mouseup', handleGlobalUp);
        return () => window.removeEventListener('mouseup', handleGlobalUp);
    }, []);


    // --- RENDER: CANVAS MODE ---
    if (viewMode === 'CANVAS') {
        return (
            <div className="h-full bg-remuse-dark text-white flex flex-col">
                {/* Canvas Header */}
                <div className="p-4 border-b border-neutral-800 bg-remuse-panel flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setViewMode('LIBRARY')} className="text-neutral-500 hover:text-white">
                            <X size={24} />
                        </button>
                        <h2 className="text-xl font-bold font-mono text-white flex items-center gap-2">
                            <Grid size={20} className="text-remuse-accent" />
                            STICKER COLLAGE
                        </h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handleReLayout}
                            className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded text-sm font-mono border border-neutral-700"
                        >
                            <Shuffle size={16} /> 重新排版
                        </button>
                        <button 
                            onClick={() => setIsCustomMode(!isCustomMode)}
                            className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-mono border transition-colors
                                ${isCustomMode 
                                    ? 'bg-remuse-accent text-black border-remuse-accent' 
                                    : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:text-white'}
                            `}
                        >
                            <Move size={16} /> {isCustomMode ? '完成自定义' : '自定义排版'}
                        </button>
                        <button 
                            onClick={handleExportLayout}
                            className="flex items-center gap-2 px-4 py-2 bg-remuse-secondary text-black hover:bg-white rounded text-sm font-mono font-bold border border-remuse-secondary transition-colors"
                        >
                            <Save size={16} /> 导出排版
                        </button>
                    </div>
                </div>

                {/* Canvas Area */}
                <div className="flex-1 overflow-hidden relative flex items-center justify-center p-8 bg-[#111]">
                    <div 
                        ref={canvasRef}
                        onMouseMove={handleMouseMove}
                        className={`
                            relative w-full max-w-3xl aspect-[4/3] bg-black shadow-2xl border border-neutral-800 overflow-hidden
                            ${isCustomMode ? 'cursor-default' : ''}
                        `}
                    >
                         {/* Removed Grid Visual */}

                         {layoutItems.map(item => (
                             <div
                                key={item.instanceId}
                                onMouseDown={(e) => handleMouseDown(e, item.instanceId)}
                                style={{
                                    position: 'absolute',
                                    left: `${item.x}%`,
                                    top: `${item.y}%`,
                                    transform: `translate(-50%, -50%) rotate(${item.rotation}deg) scale(${item.scale})`,
                                    zIndex: item.zIndex,
                                    cursor: isCustomMode ? (activeDragId === item.instanceId ? 'grabbing' : 'grab') : 'default'
                                }}
                                className={`
                                    w-32 md:w-48 transition-transform duration-300 ease-out select-none
                                    ${activeDragId === item.instanceId ? 'duration-0 scale-105' : ''}
                                `}
                             >
                                <img 
                                    src={item.sticker.stickerImageUrl} 
                                    alt="Sticker" 
                                    className="w-full h-auto pointer-events-none" 
                                />
                                {isCustomMode && (
                                    <div className="absolute inset-0 border border-remuse-accent/50 rounded-lg pointer-events-none"></div>
                                )}
                             </div>
                         ))}
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="p-4 bg-remuse-panel border-t border-neutral-800 flex justify-center">
                    <p className="text-xs text-neutral-500 font-mono">
                        {isCustomMode ? '拖拽贴纸以调整位置' : '选择一个模式来调整布局'}
                    </p>
                </div>
            </div>
        );
    }

    // --- RENDER: LIBRARY MODE ---
    return (
        <div className="h-full bg-remuse-dark text-white p-6 md:p-10 overflow-y-auto pb-32">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                <div>
                    <h1 className="text-4xl font-bold font-mono tracking-tighter mb-2 flex items-center gap-3">
                        <StickerIcon size={36} className="text-remuse-accent" />
                        STICKER LIBRARY
                    </h1>
                    <p className="text-neutral-500 font-mono text-sm">
                        实体物品的数字分身与专属剧情。
                    </p>
                </div>
                
                {/* Action Area */}
                <div className="flex flex-col md:flex-row items-end gap-3">
                    <div className="flex items-center gap-2 px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-full">
                        <Box size={16} className="text-neutral-500" />
                        <span className="text-sm font-mono text-white">{stickers.length} ITEMS</span>
                    </div>
                    
                    {/* Toggle Selection Mode Button */}
                    <button 
                        onClick={toggleSelectionMode}
                        className={`flex items-center gap-2 px-5 py-2 rounded-full font-mono text-sm border transition-all
                            ${isSelectionMode 
                                ? 'bg-neutral-800 text-white border-neutral-600' 
                                : 'bg-remuse-secondary text-black border-remuse-secondary hover:bg-cyan-300'}
                        `}
                    >
                        {isSelectionMode ? <X size={16} /> : <Grid size={16} />}
                        {isSelectionMode ? '取消选择' : '排版模式'}
                    </button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-8 pb-2">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setFilter(cat)}
                        className={`px-4 py-2 text-xs font-bold font-mono whitespace-nowrap border transition-all
                            ${filter === cat 
                                ? 'bg-remuse-accent text-black border-remuse-accent' 
                                : 'bg-transparent text-neutral-500 border-neutral-800 hover:border-neutral-600 hover:text-white'}
                        `}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Selection Status Bar */}
            {isSelectionMode && (
                <div className="mb-6 p-4 bg-remuse-accent/10 border border-remuse-accent rounded-lg flex items-center justify-between animate-fade-in">
                    <div className="flex items-center gap-2">
                         <CheckCircle2 size={20} className="text-remuse-accent" />
                         <span className="text-sm font-mono text-white">已选择: {selectedIds.size} / 9</span>
                    </div>
                    <button 
                        onClick={enterCanvasMode}
                        disabled={selectedIds.size === 0}
                        className={`px-6 py-2 rounded font-bold font-mono text-xs transition-all
                            ${selectedIds.size > 0 
                                ? 'bg-remuse-accent text-black hover:scale-105' 
                                : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'}
                        `}
                    >
                        开始排版
                    </button>
                </div>
            )}

            {/* Grid */}
            {filteredStickers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-neutral-800 rounded-lg">
                    <StickerIcon size={48} className="text-neutral-700 mb-4" />
                    <p className="text-neutral-500 font-mono">暂无贴纸</p>
                    <p className="text-xs text-neutral-600 mt-2">使用扫描仪生成你的第一个贴纸</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredStickers.map(sticker => (
                        <StickerCard 
                            key={sticker.id} 
                            sticker={sticker} 
                            onDelete={() => onDeleteSticker(sticker.id)}
                            selectable={isSelectionMode}
                            selected={selectedIds.has(sticker.id)}
                            onToggleSelect={() => handleSelectSticker(sticker.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default StickerLibrary;
