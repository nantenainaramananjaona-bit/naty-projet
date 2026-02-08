
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Calendar, 
  FileText, 
  Trash2, 
  ChevronRight, 
  Zap, 
  Droplets,
  Edit2,
  Filter,
  X,
  Home,
  LogOut,
  AlertTriangle,
  Loader2,
  Info
} from 'lucide-react';
import { Reading, ReadingType } from '../types';
import { storageService } from '../services/storageService';
import { pdfService } from '../services/pdfService';
import { THEME_COLORS } from '../constants';

interface ReadingHistoryProps {
  onBack: () => void;
  onEdit: (reading: Reading) => void;
  onGoHome: () => void;
  onQuit: () => void;
}

export const ReadingHistory: React.FC<ReadingHistoryProps> = ({ onBack, onEdit, onGoHome, onQuit }) => {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [filterDate, setFilterDate] = useState<string>('');
  const [selectedReading, setSelectedReading] = useState<Reading | null>(null);
  const [readingToDelete, setReadingToDelete] = useState<string | null>(null);
  const [readingToEdit, setReadingToEdit] = useState<Reading | null>(null);
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const loadReadings = async () => {
    const data = await storageService.getAllReadings();
    setReadings(data);
  };

  useEffect(() => {
    loadReadings();
  }, []);

  const filteredReadings = filterDate 
    ? readings.filter(r => r.date === filterDate)
    : readings;

  const confirmDelete = async () => {
    if (readingToDelete) {
      await storageService.deleteReading(readingToDelete);
      await loadReadings();
      setReadingToDelete(null);
    }
  };

  const handleExport = async (reading: Reading, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isExporting) return;
    
    setIsExporting(reading.id);
    try {
      await pdfService.generateReport(reading);
    } catch (error) {
      console.error("Erreur export PDF:", error);
      alert("Une erreur est survenue lors de la génération du PDF.");
    } finally {
      setIsExporting(null);
    }
  };

  const handleConfirmEdit = () => {
    if (readingToEdit) {
      onEdit(readingToEdit);
      setReadingToEdit(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <header className="sticky top-0 z-30 bg-blue-600 text-white p-3 shadow-xl">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex space-x-1">
            <button onClick={onGoHome} className="p-2.5 hover:bg-white/20 rounded-xl transition-colors"><Home className="w-5 h-5" /></button>
            <button onClick={onBack} className="p-2.5 hover:bg-white/20 rounded-xl transition-colors"><ArrowLeft className="w-5 h-5" /></button>
          </div>
          <h1 className="text-sm font-black uppercase tracking-widest">Historique</h1>
          <button onClick={onQuit} className="p-2.5 hover:bg-red-600 rounded-xl transition-colors"><LogOut className="w-5 h-5" /></button>
        </div>
      </header>

      <main className="p-4 max-w-4xl mx-auto pt-6 pb-20">
        <section className="mb-6">
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 rounded-2xl border-none shadow-sm font-bold text-sm outline-none dark:text-white"
            />
          </div>
        </section>

        <div className="space-y-3">
          {filteredReadings.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-gray-100 dark:border-slate-800">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 font-bold uppercase text-xs">Aucune archive</p>
            </div>
          ) : (
            filteredReadings.map((reading) => (
              <motion.div
                key={reading.id}
                onClick={() => setSelectedReading(reading)}
                className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-gray-50 dark:border-slate-800 flex items-center justify-between group cursor-pointer active:scale-95 transition-all"
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-xl ${reading.type === ReadingType.ELECTRICITY ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {reading.type === ReadingType.ELECTRICITY ? <Zap className="w-5 h-5" /> : <Droplets className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-black text-gray-800 dark:text-white text-sm uppercase">{reading.type}</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">{new Date(reading.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setReadingToEdit(reading); }} 
                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    disabled={isExporting === reading.id}
                    onClick={(e) => handleExport(reading, e)} 
                    className="p-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg disabled:opacity-30"
                  >
                    {isExporting === reading.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setReadingToDelete(reading.id); }} 
                    className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ChevronRight className="w-4 h-4 text-gray-300 ml-2" />
                </div>
              </motion.div>
            ))
          )}
        </div>
      </main>

      <AnimatePresence>
        {/* Modal d'aperçu du relevé */}
        {selectedReading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4" onClick={() => setSelectedReading(null)}>
            <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className="bg-white dark:bg-slate-900 w-full max-w-xl max-h-[85vh] overflow-hidden rounded-[2.5rem] shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
              <div className={`p-6 bg-${THEME_COLORS[selectedReading.type].primary} text-white flex justify-between items-center`}>
                <h2 className="text-xl font-black uppercase tracking-widest">{selectedReading.type}</h2>
                <button onClick={() => setSelectedReading(null)} className="p-2 bg-white/20 rounded-full"><X className="w-5 h-5" /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {Object.entries(storageService.groupPhotosByDept(selectedReading)).map(([dept, urls]) => (
                  <div key={dept} className="space-y-3">
                    <h4 className="font-black text-[10px] text-blue-500 uppercase tracking-[0.2em]">{dept}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {urls.map((url, idx) => (
                        <div key={idx} className="rounded-xl overflow-hidden aspect-video shadow-lg"><img src={url} className="w-full h-full object-cover" /></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-6 border-t border-gray-100 dark:border-slate-800">
                <button 
                  disabled={isExporting === selectedReading.id}
                  onClick={() => handleExport(selectedReading)} 
                  className={`w-full py-4 rounded-xl bg-${THEME_COLORS[selectedReading.type].primary} text-white font-black uppercase tracking-widest flex items-center justify-center shadow-lg active:scale-95 transition-all disabled:opacity-50`}
                >
                  {isExporting === selectedReading.id ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <FileText className="w-5 h-5 mr-2" />}
                  Générer Rapport PDF
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        {/* Modal de confirmation de modification et suppression conservés à l'identique */}
        {readingToEdit && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setReadingToEdit(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }} 
              className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl text-center"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-20 h-20 bg-blue-50 dark:bg-blue-950/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <Info className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-black uppercase mb-2 tracking-tight">Modifier ce relevé ?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 font-medium">Voulez-vous ouvrir ce relevé pour y apporter des modifications ?</p>
              
              <div className="space-y-3">
                <button 
                  onClick={handleConfirmEdit}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
                >
                  Confirmer
                </button>
                <button 
                  onClick={() => setReadingToEdit(null)}
                  className="w-full py-4 bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 rounded-2xl font-black uppercase text-xs tracking-[0.2em] active:scale-95 transition-all"
                >
                  Annuler
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        {readingToDelete && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setReadingToDelete(null)}
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
              <h3 className="text-xl font-black uppercase mb-2 tracking-tight">Supprimer le relevé ?</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 font-medium">Cette action supprimera définitivement les données du stockage local.</p>
              
              <div className="space-y-3">
                <button 
                  onClick={confirmDelete}
                  className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-lg shadow-red-600/20 active:scale-95 transition-all"
                >
                  Oui, Supprimer
                </button>
                <button 
                  onClick={() => setReadingToDelete(null)}
                  className="w-full py-4 bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 rounded-2xl font-black uppercase text-xs tracking-[0.2em] active:scale-95 transition-all"
                >
                  Annuler
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
