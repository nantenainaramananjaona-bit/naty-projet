
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Check, 
  Type, 
  Sun, 
  RotateCcw, 
  Contrast, 
  Crop,
  Move,
  Search,
  Maximize2,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

interface ImageEditorProps {
  dataUrl: string;
  onSave: (newDataUrl: string) => void;
  onClose: () => void;
}

type EditorMode = 'FILTERS' | 'TEXT' | 'CROP';

export const ImageEditor: React.FC<ImageEditorProps> = ({ dataUrl, onSave, onClose }) => {
  const [mode, setMode] = useState<EditorMode>('FILTERS');
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [grayscale, setGrayscale] = useState(0);
  const [text, setText] = useState('');
  const [zoom, setZoom] = useState(1);
  const [posX, setPosX] = useState(0);
  const [posY, setPosY] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null); // null = libre
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const ratios = [
    { label: 'Libre', value: null },
    { label: '1:1', value: 1 },
    { label: '4:3', value: 4/3 },
    { label: '16:9', value: 16/9 },
    { label: '4:16', value: 4/16 },
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      // Base dimensions based on image
      const baseW = 800;
      const baseH = (img.height / img.width) * baseW;
      
      canvas.width = baseW;
      canvas.height = baseH;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      
      // Apply transforms (Zoom & Pan)
      ctx.translate(canvas.width/2 + posX, canvas.height/2 + posY);
      ctx.scale(zoom, zoom);
      ctx.translate(-canvas.width/2, -canvas.height/2);

      // Apply Filters
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) grayscale(${grayscale}%)`;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      ctx.restore();

      // Draw Text Overlay (Fixed on top)
      if (text) {
        ctx.font = 'bold 28px Inter, sans-serif';
        const textWidth = ctx.measureText(text).width;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(20, canvas.height - 70, textWidth + 30, 50);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(text, 35, canvas.height - 35);
      }
    };
  }, [dataUrl, brightness, contrast, grayscale, text, zoom, posX, posY]);

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (mode !== 'CROP') return;
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragStart.current = { x: clientX - posX, y: clientY - posY };
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || mode !== 'CROP') return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setPosX(clientX - dragStart.current.x);
    setPosY(clientY - dragStart.current.y);
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleApply = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Si on a un ratio défini, on effectue un recadrage réel sur le canvas de sortie
    if (aspectRatio) {
      const outputCanvas = document.createElement('canvas');
      const outW = 800;
      const outH = outW / aspectRatio;
      outputCanvas.width = outW;
      outputCanvas.height = outH;
      const outCtx = outputCanvas.getContext('2d');
      if (outCtx) {
        // On dessine le centre du canvas actuel dans le nouveau canvas
        outCtx.drawImage(canvas, (canvas.width - outW)/2, (canvas.height - outH)/2, outW, outH, 0, 0, outW, outH);
        onSave(outputCanvas.toDataURL('image/jpeg', 0.9));
        return;
      }
    }
    
    onSave(canvas.toDataURL('image/jpeg', 0.9));
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col select-none"
    >
      {/* Header */}
      <div className="p-4 flex justify-between items-center bg-zinc-900 border-b border-white/5">
        <button onClick={onClose} className="p-2 text-white/40 hover:text-white"><X className="w-6 h-6" /></button>
        <div className="flex bg-black/40 rounded-xl p-1">
            <button 
                onClick={() => setMode('FILTERS')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'FILTERS' ? 'bg-blue-600 text-white shadow-lg' : 'text-white/40'}`}
            >Traitement</button>
            <button 
                onClick={() => setMode('CROP')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'CROP' ? 'bg-blue-600 text-white shadow-lg' : 'text-white/40'}`}
            >Recadrer</button>
            <button 
                onClick={() => setMode('TEXT')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'TEXT' ? 'bg-blue-600 text-white shadow-lg' : 'text-white/40'}`}
            >Annoter</button>
        </div>
        <button onClick={handleApply} className="bg-emerald-600 text-white px-5 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center">
          <Check className="w-4 h-4 mr-2" /> Valider
        </button>
      </div>

      {/* Viewport */}
      <div 
        ref={containerRef} 
        className={`flex-1 flex items-center justify-center p-4 overflow-hidden relative touch-none ${mode === 'CROP' ? 'cursor-move' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
      >
        <div className="relative shadow-2xl ring-1 ring-white/10 rounded-sm overflow-hidden bg-zinc-800">
          <canvas ref={canvasRef} className="max-w-full max-h-[70vh] object-contain transition-filter duration-300" />
          
          {/* Crop Overlay Grid */}
          {mode === 'CROP' && (
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 border-2 border-blue-500/50" />
                <div className="absolute top-1/3 w-full h-px bg-white/20" />
                <div className="absolute top-2/3 w-full h-px bg-white/20" />
                <div className="absolute left-1/3 h-full w-px bg-white/20" />
                <div className="absolute left-2/3 h-full w-px bg-white/20" />
            </div>
          )}
        </div>

        {/* Floating Text Indicator */}
        {text && mode !== 'TEXT' && (
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10 flex items-center space-x-2">
                <Type className="w-3 h-3 text-blue-400" />
                <span className="text-white text-[10px] font-black uppercase tracking-widest">{text}</span>
            </div>
        )}
      </div>

      {/* Controls Area */}
      <div className="bg-zinc-900 border-t border-white/5 p-6 pb-10">
        <AnimatePresence mode="wait">
          {mode === 'FILTERS' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="flex items-center space-x-4">
                    <Sun className="w-5 h-5 text-white/40" />
                    <input type="range" min="50" max="200" value={brightness} onChange={(e) => setBrightness(parseInt(e.target.value))} className="flex-1 accent-blue-600 h-1 bg-white/10 rounded-full appearance-none" />
                    <span className="text-[10px] font-black text-white/40 w-8">{brightness}%</span>
                </div>
                <div className="flex items-center space-x-4">
                    <Contrast className="w-5 h-5 text-white/40" />
                    <input type="range" min="50" max="200" value={contrast} onChange={(e) => setContrast(parseInt(e.target.value))} className="flex-1 accent-blue-600 h-1 bg-white/10 rounded-full appearance-none" />
                    <span className="text-[10px] font-black text-white/40 w-8">{contrast}%</span>
                </div>
                <div className="flex justify-center pt-2">
                    <button onClick={() => setGrayscale(p => p === 0 ? 100 : 0)} className={`flex items-center space-x-2 px-6 py-3 rounded-2xl border transition-all ${grayscale > 0 ? 'bg-white text-black border-white' : 'bg-transparent text-white/60 border-white/10'}`}>
                        <Maximize2 className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Noir & Blanc</span>
                    </button>
                </div>
            </motion.div>
          )}

          {mode === 'CROP' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                <div className="flex items-center space-x-4 px-2">
                    <Search className="w-5 h-5 text-white/40" />
                    <input type="range" min="1" max="3" step="0.1" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} className="flex-1 accent-blue-600 h-1 bg-white/10 rounded-full appearance-none" />
                    <span className="text-[10px] font-black text-white/40 w-8">x{zoom.toFixed(1)}</span>
                </div>
                <div className="flex overflow-x-auto space-x-2 py-2 no-scrollbar">
                    {ratios.map((r, i) => (
                        <button 
                            key={i} 
                            onClick={() => setAspectRatio(r.value)}
                            className={`flex-shrink-0 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${aspectRatio === r.value ? 'bg-blue-600 text-white' : 'bg-white/5 text-white/40'}`}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>
                <div className="flex justify-center">
                    <button onClick={() => { setPosX(0); setPosY(0); setZoom(1); setAspectRatio(null); }} className="text-red-400 text-[10px] font-black uppercase tracking-widest flex items-center">
                        <RotateCcw className="w-4 h-4 mr-2" /> Réinitialiser
                    </button>
                </div>
            </motion.div>
          )}

          {mode === 'TEXT' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                <div className="bg-black/40 rounded-2xl p-4 border border-white/10">
                    <input 
                        autoFocus
                        type="text" 
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="TAPPEZ VOTRE NOTE ICI..."
                        className="w-full bg-transparent text-white font-bold placeholder:text-white/20 outline-none text-center uppercase"
                    />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setText('')} className="py-3 bg-white/5 text-white/40 rounded-xl font-black text-[10px] uppercase tracking-widest">Effacer</button>
                    <button onClick={() => setMode('FILTERS')} className="py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest">Terminer</button>
                </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
