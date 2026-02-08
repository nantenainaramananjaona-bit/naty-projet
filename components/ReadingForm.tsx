
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Droplets, 
  Calendar as CalendarIcon, 
  Camera, 
  CheckCircle2,
  Save,
  Plus,
  X,
  FileText,
  Images,
  Loader2,
  Home,
  History,
  LogOut,
  Eye,
  EyeOff,
  Trash2,
  AlertTriangle,
  Edit3
} from 'lucide-react';
import { ReadingType, PhotoEntry, Reading } from '../types';
import { DEPARTMENTS_ELECTRICITY, DEPARTMENTS_WATER, THEME_COLORS } from '../constants';
import { storageService } from '../services/storageService';
import { pdfService } from '../services/pdfService';
import { ImageEditor } from './ImageEditor';

interface ReadingFormProps {
  initialReading?: Reading | null;
  onBack: () => void;
  onSaved: () => void;
  onGoHome: () => void;
  onGoHistory: () => void;
  onQuit: () => void;
}

export const ReadingForm: React.FC<ReadingFormProps> = ({ 
  initialReading, 
  onBack, 
  onSaved, 
  onGoHome, 
  onGoHistory, 
  onQuit 
}) => {
  const [type, setType] = useState<ReadingType | null>(initialReading?.type || null);
  const [date, setDate] = useState<string>(initialReading?.date || new Date().toISOString().split('T')[0]);
  const [newDeptName, setNewDeptName] = useState('');
  const [showAddDept, setShowAddDept] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // State pour l'édition d'image
  const [editingImage, setEditingImage] = useState<{ dept: string, index: number, dataUrl: string } | null>(null);
  
  const standardDepts = type === ReadingType.ELECTRICITY ? DEPARTMENTS_ELECTRICITY : DEPARTMENTS_WATER;

  const [customDepartments, setCustomDepartments] = useState<string[]>(() => {
    if (initialReading) {
      const initialCustom = Array.from(new Set(initialReading.photos
        .map(p => p.department)
        .filter(dept => !standardDepts.includes(dept))));
      return initialCustom;
    }
    return [];
  });

  const allDepartments = [...standardDepts, ...customDepartments];

  const [photos, setPhotos] = useState<Record<string, string[]>>(() => {
    if (initialReading) {
      const p: Record<string, string[]> = {};
      initialReading.photos.forEach(entry => {
        if (!p[entry.department]) p[entry.department] = [];
        p[entry.department].push(entry.dataUrl);
      });
      return p;
    }
    return {};
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeDept, setActiveDept] = useState<string | null>(null);

  const colors = type ? THEME_COLORS[type] : null;

  useEffect(() => {
    if (type && Object.keys(photos).length > 0) {
      const draft = getReadingData();
      if (draft) storageService.saveDraft(draft);
    }
  }, [type, date, photos, customDepartments]);

  const compressImage = (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 1280;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_DIM) { height *= MAX_DIM / width; width = MAX_DIM; }
        } else {
          if (height > MAX_DIM) { width *= MAX_DIM / height; height = MAX_DIM; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    });
  };

  const handleCapture = (dept: string, mode: 'camera' | 'gallery') => {
    setActiveDept(dept);
    if (fileInputRef.current) {
      if (mode === 'camera') fileInputRef.current.setAttribute('capture', 'environment');
      else fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
    }
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeDept) {
      setIsProcessing(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        const rawData = event.target?.result as string;
        const compressedData = await compressImage(rawData);
        setPhotos(prev => {
          const list = prev[activeDept] || [];
          return { ...prev, [activeDept]: [...list, compressedData] };
        });
        setIsProcessing(false);
        setActiveDept(null);
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  const handleSaveEditedImage = (newDataUrl: string) => {
    if (editingImage) {
      setPhotos(prev => {
        const list = [...prev[editingImage.dept]];
        list[editingImage.index] = newDataUrl;
        return { ...prev, [editingImage.dept]: list };
      });
      setEditingImage(null);
    }
  };

  const getReadingData = (): Reading | null => {
    if (!type || Object.keys(photos).length === 0) return null;
    const flatPhotos: PhotoEntry[] = [];
    Object.keys(photos).forEach(dept => {
      photos[dept].forEach(url => {
        flatPhotos.push({ department: dept, dataUrl: url, timestamp: Date.now() });
      });
    });
    return {
      id: initialReading?.id || crypto.randomUUID(),
      date,
      type,
      photos: flatPhotos,
      createdAt: initialReading?.createdAt || Date.now()
    };
  };

  const saveReading = () => {
    const data = getReadingData();
    if (!data) return;
    if (initialReading) storageService.updateReading(data);
    else storageService.saveReading(data);
    storageService.clearDraft();
    onSaved();
  };

  const confirmDeleteReading = () => {
    if (initialReading) {
      storageService.deleteReading(initialReading.id);
      storageService.clearDraft();
      onGoHistory();
    }
  };

  const exportDirectPdf = async () => {
    if (isExporting) return;
    const data = getReadingData();
    if (!data) return;
    
    setIsExporting(true);
    try {
      await pdfService.generateReport(data);
    } catch (error) {
      console.error("Erreur PDF:", error);
      alert("Erreur lors de la génération. Vérifiez que l'appareil dispose d'assez de mémoire.");
    } finally {
      setIsExporting(false);
    }
  };

  if (!type) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 max-w-lg mx-auto">
        <button onClick={onBack} className="mb-6 flex items-center text-gray-400 font-black uppercase text-xs tracking-widest"><X className="w-5 h-5 mr-2" /> Annuler</button>
        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-10 text-center uppercase tracking-tighter">Nouveau Relevé</h2>
        <div className="grid grid-cols-1 gap-6">
          <button onClick={() => setType(ReadingType.ELECTRICITY)} className="h-44 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border-b-8 border-blue-600 flex flex-col items-center justify-center active:scale-95 transition-all">
            <Zap className="w-16 h-16 text-blue-600 mb-2" />
            <span className="text-2xl font-black uppercase dark:text-white">Électricité</span>
          </button>
          <button onClick={() => setType(ReadingType.WATER)} className="h-44 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border-b-8 border-emerald-600 flex flex-col items-center justify-center active:scale-95 transition-all">
            <Droplets className="w-16 h-16 text-emerald-600 mb-2" />
            <span className="text-2xl font-black uppercase dark:text-white">Eau</span>
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="pb-12 bg-gray-50 dark:bg-slate-950 min-h-screen">
      {/* Studio d'Édition d'Image */}
      <AnimatePresence>
        {editingImage && (
          <ImageEditor 
            dataUrl={editingImage.dataUrl} 
            onSave={handleSaveEditedImage} 
            onClose={() => setEditingImage(null)} 
          />
        )}
      </AnimatePresence>

      <header className={`sticky top-0 z-30 bg-${colors?.primary} text-white p-3 shadow-2xl`}>
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex space-x-1">
            <button onClick={onGoHome} title="Accueil" className="p-2.5 hover:bg-white/20 rounded-xl transition-colors"><Home className="w-5 h-5" /></button>
            <button onClick={onGoHistory} title="Historique" className="p-2.5 hover:bg-white/20 rounded-xl transition-colors"><History className="w-5 h-5" /></button>
          </div>

          <div className="flex items-center space-x-1.5">
            <button 
              onClick={() => setShowPreview(!showPreview)}
              className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 transition-all active:scale-90"
              title="Aperçu rapide"
            >
              {showPreview ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
            
            {initialReading && (
              <button 
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2.5 bg-red-600/20 hover:bg-red-600 rounded-xl border border-red-500/20 transition-all active:scale-90"
                title="Supprimer ce relevé"
              >
                <Trash2 className="w-5 h-5 text-red-200" />
              </button>
            )}

            <button 
              disabled={Object.keys(photos).length === 0 || isExporting}
              onClick={exportDirectPdf}
              className="flex items-center px-3 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-30"
            >
              {isExporting ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <FileText className="w-4 h-4 mr-1.5" />} PDF
            </button>
            
            <button 
              disabled={Object.keys(photos).length === 0 || isProcessing}
              onClick={saveReading}
              className="flex items-center px-4 py-2.5 bg-white text-blue-700 hover:bg-gray-100 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-lg transition-all active:scale-95 disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              SAVE
            </button>
            <button onClick={onQuit} title="Quitter" className="p-2.5 bg-black/20 hover:bg-red-600 rounded-xl transition-colors"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
      </header>

      {(isProcessing || isExporting) && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40">
          <div className="bg-black/90 text-white px-6 py-3 rounded-2xl flex items-center space-x-3 shadow-2xl backdrop-blur-md border border-white/10">
            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              {isExporting ? 'Génération PDF...' : 'Traitement...'}
            </span>
          </div>
        </div>
      )}

      {/* --- QUICK PREVIEW MODAL --- */}
      <AnimatePresence>
        {showPreview && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 pt-20 pb-6 px-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
            onClick={() => setShowPreview(false)}
          >
            <div 
              className="max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-black uppercase tracking-widest dark:text-white">Aperçu du travail</h3>
                <button onClick={() => setShowPreview(false)} className="p-2 bg-gray-100 dark:bg-slate-800 rounded-full dark:text-white"><X className="w-5 h-5" /></button>
              </div>
              
              <div className="space-y-6">
                {allDepartments.filter(dept => (photos[dept]?.length || 0) > 0).length === 0 ? (
                  <p className="text-center text-gray-400 font-bold uppercase py-10">Aucune photo prise pour le moment</p>
                ) : (
                  allDepartments.filter(dept => (photos[dept]?.length || 0) > 0).map(dept => (
                    <div key={dept} className="border-b border-gray-100 dark:border-slate-800 pb-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-black text-xs text-blue-500 uppercase">{dept}</span>
                        <span className="text-[10px] bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded-lg font-bold dark:text-gray-300">{photos[dept].length} photo(s)</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {photos[dept].map((url, idx) => (
                          <div key={idx} className="relative group cursor-pointer" onClick={() => setEditingImage({ dept, index: idx, dataUrl: url })}>
                            <img src={url} className="aspect-square object-cover rounded-xl shadow-sm border border-gray-50 dark:border-slate-700" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                               <Edit3 className="text-white w-6 h-6" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <button 
                onClick={() => setShowPreview(false)}
                className="w-full mt-6 py-4 bg-gray-900 text-white dark:bg-white dark:text-gray-900 rounded-2xl font-black uppercase text-xs tracking-widest"
              >
                Continuer le travail
              </button>
            </div>
          </motion.div>
        )}

        {/* Modal de suppression pour ReadingForm */}
        {showDeleteConfirm && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl text-center"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-20 h-20 bg-red-50 dark:bg-red-950/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-red-600" />
              </div>
              <h3 className="text-xl font-black uppercase mb-2 tracking-tight dark:text-white">Supprimer ce relevé ?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 font-medium">Cette opération est irréversible. Voulez-vous vraiment le retirer du stockage ?</p>
              
              <div className="space-y-3">
                <button 
                  onClick={confirmDeleteReading}
                  className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-lg shadow-red-600/20 active:scale-95 transition-all"
                >
                  Oui, Supprimer
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="w-full py-4 bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 rounded-2xl font-black uppercase text-xs tracking-[0.2em] active:scale-95 transition-all"
                >
                  Annuler
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="p-4 max-w-4xl mx-auto space-y-6 pt-6">
        <section className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-lg p-6 flex items-center justify-between border border-gray-100 dark:border-slate-800">
          <div>
            <label className="block text-[9px] font-black text-gray-400 mb-1 uppercase tracking-widest">Inspection</label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-slate-800 rounded-xl border-none font-black text-gray-700 dark:text-gray-200 outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-xs" />
            </div>
          </div>
          <div className="text-right">
            <label className="block text-[9px] font-black text-gray-400 mb-1 uppercase tracking-widest">Type / Photos</label>
            <p className={`text-lg font-black text-${colors?.primary} uppercase`}>{type} ({Object.values(photos).flat().length})</p>
          </div>
        </section>

        <div className="space-y-4">
          {allDepartments.map((dept) => {
            const deptPhotos = photos[dept] || [];
            return (
              <div key={dept} className={`bg-white dark:bg-slate-900 rounded-[2rem] shadow-md border ${deptPhotos.length > 0 ? `border-${colors?.primary} ring-1 ring-${colors?.primary}/20` : 'border-gray-100 dark:border-slate-800'} p-5 transition-all`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${deptPhotos.length > 0 ? `bg-${colors?.primary} text-white` : 'border-2 border-dashed border-gray-300 dark:border-slate-700'}`}>
                      {deptPhotos.length > 0 && <CheckCircle2 className="w-4 h-4" />}
                    </div>
                    <span className={`font-black uppercase text-[11px] tracking-tight ${deptPhotos.length > 0 ? `text-${colors?.text} dark:text-white` : 'text-gray-400'}`}>{dept}</span>
                  </div>
                </div>

                {deptPhotos.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                    {deptPhotos.map((url, pIdx) => (
                      <div 
                        key={pIdx} 
                        className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 dark:border-slate-800 group cursor-pointer"
                        onClick={() => setEditingImage({ dept, index: pIdx, dataUrl: url })}
                      >
                        <img src={url} alt={dept} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <Edit3 className="text-white w-5 h-5" />
                        </div>
                        <button onClick={(e) => {
                          e.stopPropagation();
                          setPhotos(prev => {
                            const list = [...prev[dept]]; list.splice(pIdx, 1);
                            const n = { ...prev }; if (list.length === 0) delete n[dept]; else n[dept] = list;
                            return n;
                          });
                        }} className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                      </div>
                    ))}
                    <div className="grid grid-cols-2 gap-1 aspect-square">
                      <button onClick={() => handleCapture(dept, 'camera')} className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center"><Camera className="w-4 h-4" /></button>
                      <button onClick={() => handleCapture(dept, 'gallery')} className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center"><Images className="w-4 h-4" /></button>
                    </div>
                  </div>
                )}

                {deptPhotos.length === 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => handleCapture(dept, 'camera')} className={`flex items-center justify-center py-3 rounded-xl bg-${colors?.secondary} dark:bg-${colors?.primary}/20 text-${colors?.primary} font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all`}>
                      <Camera className="w-4 h-4 mr-2" /> Appareil
                    </button>
                    <button onClick={() => handleCapture(dept, 'gallery')} className="flex items-center justify-center py-3 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-500 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">
                      <Images className="w-4 h-4 mr-2" /> Galerie
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {!showAddDept ? (
            <button onClick={() => setShowAddDept(true)} className="w-full py-10 border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-[2.5rem] flex items-center justify-center text-gray-400 font-black uppercase tracking-widest hover:text-blue-500 hover:border-blue-200 transition-all bg-white/50 dark:bg-slate-900/50">
              <Plus className="w-5 h-5 mr-2" /> Insérer un Département
            </button>
          ) : (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border-2 border-blue-100 dark:border-blue-900 shadow-2xl">
              <input autoFocus type="text" value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)} placeholder="NOM DU DÉPARTEMENT" className="w-full px-5 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border-none font-black text-gray-800 dark:text-white outline-none uppercase text-sm mb-3" />
              <div className="flex space-x-2">
                <button onClick={() => {
                  const t = newDeptName.trim().toUpperCase();
                  if (t && !allDepartments.includes(t)) { setCustomDepartments(p => [...p, t]); setNewDeptName(''); setShowAddDept(false); }
                }} className={`flex-1 py-3 bg-${colors?.primary} text-white rounded-xl font-black uppercase text-[10px] tracking-widest`}>Confirmer</button>
                <button onClick={() => setShowAddDept(false)} className="px-5 py-3 bg-gray-100 dark:bg-slate-800 text-gray-500 rounded-xl font-black uppercase text-[10px]">X</button>
              </div>
            </div>
          )}
        </div>
      </main>

      <input type="file" ref={fileInputRef} onChange={onFileChange} accept="image/*" className="hidden" />
    </div>
  );
};
