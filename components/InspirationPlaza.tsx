import React, { useState } from 'react';
import { InspirationPost } from '../types';
import { Heart, MessageCircle, Share2, Zap, ArrowRight } from 'lucide-react';

// Mock Data
const MOCK_POSTS: InspirationPost[] = [
  {
    id: '1',
    author: 'EcoArtist_99',
    avatar: 'https://i.pravatar.cc/150?u=1',
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600',
    title: '废旧灯泡变身微景观',
    tags: ['#瓶罐艺术', '#微景观'],
    likes: 1240,
    comments: 45
  },
  {
    id: '2',
    author: 'RemuseMaster',
    avatar: 'https://i.pravatar.cc/150?u=2',
    image: 'https://images.unsplash.com/photo-1534349762913-961f7776530f?auto=format&fit=crop&q=80&w=600',
    title: '牛仔裤的第二次生命：托特包',
    tags: ['#旧衣改造', '#缝纫'],
    likes: 892,
    comments: 23
  },
  {
    id: '3',
    author: 'GreenLife',
    avatar: 'https://i.pravatar.cc/150?u=3',
    image: 'https://images.unsplash.com/photo-1517260739713-289414f09d8e?auto=format&fit=crop&q=80&w=600',
    title: '电子垃圾朋克相框',
    tags: ['#赛博手工', '#电子'],
    likes: 2300,
    comments: 112
  },
  {
    id: '4',
    author: 'TeaLover',
    avatar: 'https://i.pravatar.cc/150?u=4',
    image: 'https://images.unsplash.com/photo-1596464716127-f9a081942444?auto=format&fit=crop&q=80&w=600',
    title: '奶茶袋收纳挂件',
    tags: ['#包装再造', '#收纳'],
    likes: 567,
    comments: 12
  },
];

const InspirationPlaza: React.FC = () => {
  const [activeTag, setActiveTag] = useState('全部');

  const tags = ['全部', '#旧衣改造', '#瓶罐艺术', '#电子再生', '#自然系', '#包装艺术'];

  return (
    <div className="h-full overflow-y-auto pb-24 bg-remuse-dark">
      
      {/* 1. Weekly Challenge Banner */}
      <div className="relative w-full h-48 md:h-64 overflow-hidden mb-6 group cursor-pointer">
        <div className="absolute inset-0 bg-gradient-to-r from-remuse-accent via-green-400 to-remuse-secondary opacity-90 clip-corner-top z-10"></div>
        <img 
            src="https://images.unsplash.com/photo-1530541930197-ff16ac917b0e?auto=format&fit=crop&q=80&w=1000" 
            className="absolute inset-0 w-full h-full object-cover mix-blend-overlay grayscale group-hover:grayscale-0 transition-all duration-700"
            alt="Challenge BG"
        />
        
        {/* Geometric Decor */}
        <div className="absolute top-0 right-0 w-32 h-full bg-black/20 transform -skew-x-12 translate-x-10"></div>
        <div className="absolute bottom-0 left-10 w-20 h-2 bg-white/30"></div>

        <div className="absolute inset-0 z-20 flex flex-col justify-center px-6 md:px-12">
            <div className="inline-flex items-center gap-2 bg-black/80 text-white px-3 py-1 font-mono text-xs mb-2 self-start transform -skew-x-12">
                <Zap size={12} className="text-remuse-accent fill-current" />
                <span className="skew-x-12">本周挑战</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-black italic tracking-tighter drop-shadow-sm mb-2">
                #零废弃生活
            </h1>
            <p className="text-black font-bold text-sm md:text-base max-w-md">
                挑战规则：展示你如何将生活中的一次性塑料转化为永久性艺术品。
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs font-bold font-display bg-white text-black px-4 py-2 self-start rounded-full hover:scale-105 transition-transform">
                接受挑战 <ArrowRight size={14} />
            </div>
        </div>
      </div>

      {/* 2. Tag Filter - Horizontal Scroll */}
      <div className="px-4 mb-6 overflow-x-auto no-scrollbar">
        <div className="flex gap-3">
            {tags.map((tag, i) => (
                <button 
                    key={tag}
                    onClick={() => setActiveTag(tag)}
                    className={`
                        px-4 py-2 text-xs font-bold whitespace-nowrap transition-all transform hover:-translate-y-1
                        ${activeTag === tag 
                            ? 'bg-remuse-secondary text-black clip-corner' 
                            : 'bg-neutral-800 text-neutral-400 border border-neutral-700 clip-corner hover:border-remuse-secondary hover:text-white'}
                    `}
                >
                    {tag}
                </button>
            ))}
        </div>
      </div>

      {/* 3. Waterfall Content Flow */}
      <div className="px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
         {MOCK_POSTS.map((post) => (
             <div key={post.id} className="bg-white group overflow-hidden hover:shadow-[0_0_15px_rgba(204,255,0,0.3)] transition-shadow duration-300 relative">
                 {/* Image */}
                 <div className="relative aspect-[4/5] overflow-hidden">
                     <img 
                        src={post.image} 
                        alt={post.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                     />
                     <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white text-[10px] px-2 py-1 font-mono rounded-full">
                         {post.tags[0]}
                     </div>
                 </div>

                 {/* Content Body */}
                 <div className="p-4">
                     <h3 className="text-black font-bold text-lg mb-3 leading-tight group-hover:text-remuse-border transition-colors">
                        {post.title}
                     </h3>
                     
                     <div className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                             <img src={post.avatar} alt={post.author} className="w-6 h-6 rounded-full border border-neutral-200" />
                             <span className="text-xs text-neutral-500 font-mono truncate max-w-[80px]">{post.author}</span>
                         </div>
                         
                         {/* Action Buttons - Energy Color */}
                         <div className="flex items-center gap-3">
                             <button className="flex items-center gap-1 text-black hover:text-remuse-secondary transition-colors group/btn">
                                 <Heart size={16} className="group-hover/btn:fill-current" />
                                 <span className="text-xs font-bold">{post.likes}</span>
                             </button>
                             <button className="text-black hover:text-remuse-secondary transition-colors">
                                 <MessageCircle size={16} />
                             </button>
                         </div>
                     </div>
                 </div>

                 {/* Decorative Corner */}
                 <div className="absolute bottom-0 right-0 w-3 h-3 bg-remuse-accent clip-corner-top"></div>
             </div>
         ))}
      </div>

      {/* Loading Sentinel */}
      <div className="py-8 text-center text-neutral-400 font-mono text-xs animate-pulse">
          LOADING STREAM...
      </div>
    </div>
  );
};

export default InspirationPlaza;
