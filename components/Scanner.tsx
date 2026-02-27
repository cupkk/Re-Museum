
import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Loader2, Sparkles, X, Box, Check, Sticker as StickerIcon, ArrowRight } from 'lucide-react';
import { fileToGenerativePart, analyzeItemImage, generateRemuseIdeas, generateSticker } from '../services/geminiService';
import { CollectedItem, ExhibitionHall, Sticker } from '../types';

interface ScannerProps {
  halls: ExhibitionHall[];
  onItemAdded: (item: CollectedItem) => void;
  onStickerCreated: (sticker: Sticker) => void;
  onCancel: () => void;
}

const ScrambleButton: React.FC<{ 
    text: string; 
    onClick: () => void; 
    isActive?: boolean;
    subText?: string;
}> = ({ text, onClick, isActive, subText }) => {
    const [display, setDisplay] = useState(text);
    const [isHovering, setIsHovering] = useState(false);
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';

    useEffect(() => {
        let interval: any;
        if (isHovering) {
            let iteration = 0;
            interval = setInterval(() => {
                setDisplay(text.split("").map((char, index) => {
                    if (index < iteration) return text[index];
                    return chars[Math.floor(Math.random() * chars.length)];
                }).join(""));

                if (iteration >= text.length) clearInterval(interval);
                iteration += 1 / 2;
            }, 30);
        } else {
            setDisplay(text);
        }
        return () => clearInterval(interval);
    }, [isHovering, text]);

    return (
        <button
            onClick={onClick}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            className={`
                group relative px-6 py-3 border transition-all duration-300 w-full md:w-auto
                ${isActive 
                    ? 'border-remuse-accent bg-remuse-accent/10' 
                    : 'border-neutral-700 bg-neutral-900/50 hover:border-remuse-secondary'}
            `}
        >
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Box size={16} className={`${isActive ? 'text-remuse-accent' : 'text-neutral-500 group-hover:text-remuse-secondary'}`} />
                    <span className={`font-mono text-sm tracking-widest ${isActive ? 'text-white' : 'text-neutral-300'}`}>
                        {display}
                    </span>
                </div>
                {subText && (
                    <span className="text-[10px] font-mono text-remuse-accent bg-remuse-accent/10 px-2 py-0.5 rounded">
                        {subText}
                    </span>
                )}
            </div>
            {/* Corner Accents */}
            <div className={`absolute top-0 right-0 w-2 h-2 border-t border-r ${isActive ? 'border-remuse-accent' : 'border-neutral-500 group-hover:border-remuse-secondary'}`}></div>
            <div className={`absolute bottom-0 left-0 w-2 h-2 border-b border-l ${isActive ? 'border-remuse-accent' : 'border-neutral-500 group-hover:border-remuse-secondary'}`}></div>
        </button>
    );
};

const Scanner: React.FC<ScannerProps> = ({ halls, onItemAdded, onStickerCreated, onCancel }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingSticker, setIsGeneratingSticker] = useState(false);
  
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [statusText, setStatusText] = useState("准备归档");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Hall Selection State
  const [selectedHallId, setSelectedHallId] = useState<string | null>(null);
  const [showHallSelector, setShowHallSelector] = useState(false);
  
  // Analysis Result
  const [analysisResult, setAnalysisResult] = useState<CollectedItem | null>(null);
  const [generatedSticker, setGeneratedSticker] = useState<Sticker | null>(null);

  const selectedHallName = halls.find(h => h.id === selectedHallId)?.name;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      // Auto start analysis, pass url directly to avoid stale state
      await processImage(file, url);
    }
  };

  const processImage = async (file: File, directUrl?: string) => {
    setIsAnalyzing(true);
    setStatusText("正在扫描物质结构...");
    setAnalysisResult(null);
    setGeneratedSticker(null);
    
    // Use directly passed URL or fallback to state (though state might be stale if called immediately)
    const effectiveImageUrl = directUrl || previewUrl || '';

    try {
      const base64 = await fileToGenerativePart(file);
      
      setStatusText("Gemini 视觉系统识别中...");
      const analysis = await analyzeItemImage(base64);
      
      setStatusText("正在计算再生潜力...");
      const ideas = await generateRemuseIdeas(analysis.name, analysis.material);

      const newItem: CollectedItem = {
        id: crypto.randomUUID(),
        name: analysis.name,
        category: selectedHallId || analysis.category, 
        material: analysis.material,
        story: analysis.story,
        tags: analysis.tags,
        imageUrl: effectiveImageUrl,
        dateCollected: new Date().toISOString(),
        status: 'raw',
        ideas: ideas
      };

      setAnalysisResult(newItem);
      onItemAdded(newItem);
      setIsAnalyzing(false);

    } catch (err) {
      console.error(err);
      setStatusText("分析失败，请重试。");
      setTimeout(() => {
        setIsAnalyzing(false);
        setPreviewUrl(null);
      }, 2000);
    }
  };

  const handleGenerateSticker = async () => {
    if (!analysisResult || !previewUrl) return;
    
    setIsGeneratingSticker(true);
    setStatusText("正在生成矢量贴纸与短剧...");

    try {
        // Fetch base64 from current previewUrl (blob)
        const response = await fetch(previewUrl);
        const blob = await response.blob();
        const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
            reader.readAsDataURL(blob);
        });

        const { stickerImageUrl, dramaText } = await generateSticker(base64, analysisResult.name);
        
        const newSticker: Sticker = {
            id: crypto.randomUUID(),
            originalItemId: analysisResult.id,
            stickerImageUrl: stickerImageUrl,
            dramaText: dramaText,
            category: analysisResult.category,
            dateCreated: new Date().toISOString()
        };

        setGeneratedSticker(newSticker);
        onStickerCreated(newSticker);
    } catch (e) {
        console.error("Sticker Gen Error", e);
        alert("贴纸生成失败，请重试");
    } finally {
        setIsGeneratingSticker(false);
    }
  };

  const triggerInput = () => fileInputRef.current?.click();

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 relative bg-remuse-dark">
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>

      <button 
        onClick={onCancel}
        className="absolute top-4 right-4 text-neutral-500 hover:text-white"
      >
        <X size={24} />
      </button>

      <div className="max-w-md w-full relative z-10">
        
        {/* Header (Only show if not in result view) */}
        {!analysisResult && !isAnalyzing && (
            <div className="text-center mb-10">
                <h2 className="text-4xl font-mono font-bold tracking-tighter mb-2 text-white">
                    ARCHIVE <span className="text-remuse-accent">ENTITY</span>
                </h2>
                <p className="text-neutral-400 text-sm font-mono">
                    将实体物品数字化以进行再生。
                </p>
            </div>
        )}

        {/* --- STATE 1: ANALYZING / GENERATING STICKER --- */}
        {(isAnalyzing || isGeneratingSticker) && (
          <div className="bg-remuse-panel border border-remuse-border p-8 rounded-none clip-corner flex flex-col items-center animate-fade-in">
            <div className="relative w-32 h-32 mb-6">
               <div className="absolute inset-0 border-2 border-remuse-accent rounded-full animate-ping opacity-20"></div>
               <div className="absolute inset-0 border-2 border-remuse-secondary rounded-full animate-spin border-t-transparent"></div>
               {previewUrl && (
                 <img src={previewUrl} alt="Scanning" className="w-full h-full object-cover rounded-full opacity-50 grayscale" />
               )}
            </div>
            <h3 className="text-xl font-mono text-remuse-accent animate-pulse text-center">{statusText}</h3>
            {isGeneratingSticker && (
                <p className="text-xs text-neutral-500 mt-2 font-mono">Drawing Vector Lines...</p>
            )}
          </div>
        )}

        {/* --- STATE 2: INITIAL UPLOAD --- */}
        {!isAnalyzing && !analysisResult && !isGeneratingSticker && (
          <div className="space-y-6">
            <div className="flex justify-center">
                <ScrambleButton 
                    text="选择展馆" 
                    onClick={() => setShowHallSelector(true)} 
                    isActive={!!selectedHallId}
                    subText={selectedHallName}
                />
            </div>
            <div 
              onClick={triggerInput}
              className="group cursor-pointer border-2 border-dashed border-neutral-700 hover:border-remuse-accent transition-colors bg-remuse-panel/50 p-12 flex flex-col items-center justify-center min-h-[300px] clip-corner"
            >
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <div className="w-16 h-16 bg-neutral-800 group-hover:bg-remuse-accent group-hover:text-black rounded-full flex items-center justify-center mb-4 transition-all">
                <Camera size={32} />
              </div>
              <span className="font-mono text-lg text-neutral-300">拍摄 / 上传</span>
              <span className="text-xs text-neutral-500 mt-2 font-mono text-center">
                支持 JPG, PNG <br/> AI 自动开始分析
              </span>
            </div>
          </div>
        )}

        {/* --- STATE 3: RESULT & ACTIONS --- */}
        {!isAnalyzing && analysisResult && !isGeneratingSticker && (
            <div className="bg-remuse-panel border border-remuse-border p-6 clip-corner shadow-2xl animate-fade-in">
                <div className="flex items-center justify-between mb-6 border-b border-neutral-800 pb-4">
                    <h3 className="text-xl font-bold font-mono text-white flex items-center gap-2">
                        <Check size={20} className="text-remuse-accent" />
                        归档成功
                    </h3>
                    <div className="bg-neutral-900 px-2 py-1 rounded text-xs text-neutral-400 font-mono">
                        ID: {analysisResult.id.slice(0,6)}
                    </div>
                </div>

                <div className="flex gap-4 mb-6">
                    <img src={analysisResult.imageUrl} alt="Result" className="w-24 h-24 object-cover border border-neutral-700 bg-neutral-900" />
                    <div>
                        <h4 className="font-bold text-white text-lg">{analysisResult.name}</h4>
                        <span className="inline-block bg-neutral-800 text-neutral-400 text-xs px-2 py-0.5 rounded-full mb-2">
                            {analysisResult.category}
                        </span>
                        <p className="text-neutral-500 text-xs italic font-mono line-clamp-2">"{analysisResult.story}"</p>
                    </div>
                </div>
                
                {generatedSticker ? (
                     <div className="mb-6 bg-neutral-900 p-4 border border-remuse-secondary/50 rounded-lg relative overflow-hidden">
                         <div className="absolute top-0 right-0 bg-remuse-secondary text-black text-[10px] font-bold px-2 py-1">NEW STICKER</div>
                         <div className="flex items-center gap-4">
                            <img src={generatedSticker.stickerImageUrl} alt="Sticker" className="w-20 h-20 object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" />
                            <div className="flex-1">
                                <p className="text-sm font-bold text-white mb-1">白色描边短剧</p>
                                <div className="bg-black border border-white p-2 rounded-tl-xl rounded-br-xl">
                                    <p className="text-xs text-white font-mono">"{generatedSticker.dramaText}"</p>
                                </div>
                            </div>
                         </div>
                     </div>
                ) : (
                    <button 
                        onClick={handleGenerateSticker}
                        className="w-full mb-4 bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 text-white py-3 font-mono text-sm flex items-center justify-center gap-2 transition-colors group"
                    >
                        <StickerIcon size={16} className="text-remuse-secondary group-hover:animate-bounce" />
                        生成数字贴纸 & 短剧
                    </button>
                )}

                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={onCancel}
                        className="py-3 border border-neutral-700 text-neutral-400 hover:text-white hover:border-white transition-colors font-mono text-sm"
                    >
                        返回首页
                    </button>
                    <button 
                        onClick={onCancel} // In a real app, maybe go to detail
                        className="py-3 bg-remuse-accent text-black font-bold hover:bg-white transition-colors font-mono text-sm flex items-center justify-center gap-2"
                    >
                        查看详情 <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        )}

      </div>

      {/* Hall Selection Modal (Same as before) */}
      {showHallSelector && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-remuse-panel border border-remuse-border w-full max-w-md max-h-[80vh] flex flex-col clip-corner shadow-2xl">
                  <div className="p-4 border-b border-remuse-border flex justify-between items-center bg-neutral-900">
                      <h3 className="text-white font-mono font-bold flex items-center gap-2">
                          <Box size={16} className="text-remuse-accent"/> TARGET DESTINATION
                      </h3>
                      <button onClick={() => setShowHallSelector(false)} className="text-neutral-500 hover:text-white">
                          <X size={20} />
                      </button>
                  </div>
                  
                  <div className="overflow-y-auto p-2">
                      <div className="grid grid-cols-2 gap-2">
                          <button 
                             onClick={() => { setSelectedHallId(null); setShowHallSelector(false); }}
                             className={`p-4 text-left border font-mono text-xs transition-all ${!selectedHallId ? 'bg-remuse-accent text-black border-remuse-accent' : 'bg-transparent border-neutral-800 text-neutral-400 hover:border-neutral-600'}`}
                          >
                              <span className="block font-bold mb-1">AUTO DETECT</span>
                              <span className="opacity-60">AI 自动分类</span>
                          </button>
                          
                          {halls.map(hall => (
                              <button 
                                  key={hall.id}
                                  onClick={() => { setSelectedHallId(hall.id); setShowHallSelector(false); }}
                                  className={`p-4 text-left border font-mono text-xs transition-all group relative overflow-hidden ${selectedHallId === hall.id ? 'bg-remuse-secondary text-black border-remuse-secondary' : 'bg-transparent border-neutral-800 text-neutral-400 hover:border-neutral-600'}`}
                              >
                                  <span className="block font-bold mb-1 truncate relative z-10">{hall.name}</span>
                                  <span className="opacity-60 relative z-10">ID: {hall.id.substring(0,4)}</span>
                                  <img src={hall.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-10 grayscale group-hover:opacity-20 transition-opacity" alt="" />
                              </button>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default Scanner;
