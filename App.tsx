
import React, { useState, useEffect, useMemo } from 'react';
import Layout from './components/Layout';
import Scanner from './components/Scanner';
import Gallery from './components/Gallery';
import IdeaGenerator from './components/IdeaGenerator';
import LaunchScreen from './components/LaunchScreen';
import Onboarding from './components/Onboarding'; // Import Onboarding
import CuratorOffice from './components/CuratorOffice';
import CollectionGuide from './components/CollectionGuide';
import StickerLibrary from './components/StickerLibrary';
import { CollectedItem, ItemCategory, ViewState, Difficulty, ExhibitionHall, GuideData, Sticker } from './types';

// Mock Data for Initial Load
const MOCK_ITEMS: CollectedItem[] = [
  {
    id: '1',
    name: '复古茶叶罐',
    category: ItemCategory.CONTAINER,
    material: '金属',
    imageUrl: 'https://picsum.photos/400/400?random=1',
    dateCollected: '2023-10-15',
    story: '承载着一个被遗忘冬日温暖的容器。',
    tags: ['复古', '收纳', '金属'],
    status: 'raw',
    ideas: [
      {
        title: '多肉植物盆栽',
        description: '将铁罐改造成耐旱植物的田园风家园。',
        difficulty: Difficulty.EASY,
        materials: ['土壤', '碎石', '多肉植物'],
        steps: ['在底部钻排水孔', '铺设碎石层', '填入土壤', '种下多肉植物']
      }
    ]
  },
  {
    id: '2',
    name: '电路板碎片',
    category: ItemCategory.ELECTRONIC,
    material: '复合材料',
    imageUrl: 'https://picsum.photos/400/400?random=2',
    dateCollected: '2023-11-02',
    story: '一台退役机器的神经系统。',
    tags: ['科技', '艺术', '环保'],
    status: 'remused',
    ideas: []
  },
  {
    id: '3',
    name: '玻璃汽水瓶',
    category: ItemCategory.CONTAINER,
    material: '玻璃',
    imageUrl: 'https://picsum.photos/400/400?random=3',
    dateCollected: '2023-11-05',
    story: '夏日清凉的透明回声。',
    tags: ['透明', '蓝色', '装饰'],
    status: 'raw',
    ideas: [
       {
        title: 'LED氛围灯',
        description: '放入灯串，营造忧郁或温馨的夜间氛围灯。',
        difficulty: Difficulty.EASY,
        materials: ['LED灯串', '软木塞'],
        steps: ['彻底清洗瓶子', '塞入灯串', '固定电池盒']
      }
    ]
  }
];

// Default Covers
const DEFAULT_COVERS: Record<string, string> = {
  [ItemCategory.PACKAGING]: 'https://images.unsplash.com/photo-1595079676614-889844277d33?auto=format&fit=crop&q=80&w=400',
  [ItemCategory.CONTAINER]: 'https://images.unsplash.com/photo-1610847035619-38c64273df1a?auto=format&fit=crop&q=80&w=400',
  [ItemCategory.PAPER]: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&q=80&w=400',
  [ItemCategory.ELECTRONIC]: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=400',
  [ItemCategory.TEXTILE]: 'https://images.unsplash.com/photo-1520006403909-838d6b92c22e?auto=format&fit=crop&q=80&w=400',
  [ItemCategory.OTHER]: 'https://images.unsplash.com/photo-1552168324-d612d77725e3?auto=format&fit=crop&q=80&w=400',
};

const INITIAL_HALLS: ExhibitionHall[] = Object.values(ItemCategory).map(cat => ({
  id: cat,
  name: cat,
  imageUrl: DEFAULT_COVERS[cat] || DEFAULT_COVERS[ItemCategory.OTHER],
  isCustom: false
}));

const App: React.FC = () => {
  const [showLaunch, setShowLaunch] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false); // New state for onboarding

  // Default view is SCANNER
  const [currentView, setCurrentView] = useState<ViewState>('SCANNER');
  const [items, setItems] = useState<CollectedItem[]>(MOCK_ITEMS);
  const [halls, setHalls] = useState<ExhibitionHall[]>(INITIAL_HALLS);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [selectedItem, setSelectedItem] = useState<CollectedItem | null>(null);
  
  // Guide State
  const [guideData, setGuideData] = useState<GuideData>({
    common: [],
    rare: [],
    seasonal: []
  });

  // Handle Launch Completion
  const handleLaunchComplete = () => {
    setShowLaunch(false);
    // Check local storage to see if user has already visited
    const hasVisited = localStorage.getItem('remuse_visited_v1');
    if (!hasVisited) {
      setShowOnboarding(true);
    }
  };

  // Handle Onboarding Completion
  const handleOnboardingComplete = () => {
    localStorage.setItem('remuse_visited_v1', 'true');
    setShowOnboarding(false);
  };

  // Calculate Eco Points dynamically
  const ecoPoints = useMemo(() => {
    return items.reduce((total, item) => {
        let points = 5; // Base collection points
        if (item.status === 'remused') {
            points += 10; // Remuse bonus
        }
        return total + points;
    }, 0);
  }, [items]);

  const handleAddItem = (newItem: CollectedItem) => {
    setItems(prev => [newItem, ...prev]);
  };

  const handleStickerCreated = (newSticker: Sticker) => {
      setStickers(prev => [newSticker, ...prev]);
  };

  const handleDeleteSticker = (id: string) => {
      setStickers(prev => prev.filter(s => s.id !== id));
  };

  const handleSelectItem = (item: CollectedItem) => {
    setSelectedItem(item);
    setCurrentView('ITEM_DETAIL');
  };

  const handleCompleteRemuse = (itemId: string) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, status: 'remused' } : item
    ));
  };

  const handleAddHall = (name: string, imageUrl: string) => {
    const newHall: ExhibitionHall = {
      id: name,
      name: name,
      imageUrl: imageUrl,
      isCustom: true
    };
    setHalls(prev => [...prev, newHall]);
  };
  
  const handleUpdateGuide = (category: keyof GuideData, itemId: string) => {
    setGuideData(prev => ({
        ...prev,
        [category]: [...prev[category], itemId]
    }));
  };

  return (
    <>
      {showLaunch && <LaunchScreen onComplete={handleLaunchComplete} />}
      
      {/* Show Onboarding after Launch and before Layout if needed */}
      {!showLaunch && showOnboarding && (
        <Onboarding onComplete={handleOnboardingComplete} />
      )}
      
      {!showLaunch && !showOnboarding && (
        <Layout 
            currentView={currentView} 
            onChangeView={setCurrentView}
            ecoPoints={ecoPoints}
        >
          {currentView === 'SCANNER' && (
            <Scanner 
              halls={halls}
              onItemAdded={handleAddItem} 
              onStickerCreated={handleStickerCreated}
              onCancel={() => setCurrentView('MUSEUM')} 
            />
          )}

          {currentView === 'MUSEUM' && (
            <Gallery 
              items={items} 
              halls={halls}
              onSelectItem={handleSelectItem} 
              onAddHall={handleAddHall}
            />
          )}
          
          {currentView === 'GUIDE' && (
            <CollectionGuide 
                items={items}
                guideData={guideData}
                onUpdateGuide={handleUpdateGuide}
            />
          )}

          {currentView === 'STICKER_LIBRARY' && (
            <StickerLibrary 
                stickers={stickers}
                onDeleteSticker={handleDeleteSticker}
            />
          )}
          
          {currentView === 'ITEM_DETAIL' && selectedItem && (
            <IdeaGenerator 
              item={selectedItem} 
              onBack={() => setCurrentView('MUSEUM')}
              onComplete={handleCompleteRemuse}
            />
          )}

          {currentView === 'PROFILE' && (
            <CuratorOffice items={items} />
          )}
        </Layout>
      )}
    </>
  );
};

export default App;
