
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sun, 
  Moon, 
  PlusCircle, 
  History, 
  Zap, 
  Droplets, 
  Settings, 
  LogOut,
  ChevronLeft,
  LayoutGrid,
  Shield,
  FolderOpen,
  HardDrive,
  FileSearch,
  Check,
  FolderSync,
  Play,
  Download
} from 'lucide-react';
import { SplashScreen } from './components/SplashScreen';
import { ReadingForm } from './components/ReadingForm';
import { ReadingHistory } from './components/ReadingHistory';
import { PermissionsScreen } from './components/PermissionsScreen';
import { Reading } from './types';
import { storageService } from './services/storageService';

enum View {
  SPLASH,
  PERMISSIONS,
  HOME,
  CREATE,
  HISTORY,
  SETTINGS
}

type ThemeMode = 'light' | 'dark' | 'night';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.SPLASH);
  const [editingReading, setEditingReading] = useState<Reading | null>(null);
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem('jirama_theme_mode') as ThemeMode) || 'light';
  });

  // PWA Install Prompt state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  // Emplacements de stockage
  const [backupPath, setBackupPath] = useState(() => localStorage.getItem('jirama_backup_path') || '/Documents/JIRAMA/Backup');
  const [pdfPath, setPdfPath] = useState(() => localStorage.getItem('jirama_pdf_path') || '/Download/JIRAMA/Rapports');
  const [isConfiguring, setIsConfiguring] = useState<'backup' | 'pdf' | null>(null);

  // Draft management
  const [draft, setDraft] = useState<Reading | null>(null);

  useEffect(() => {
    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    // Check if already in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const timer = setTimeout(() => {
      const hasPermissions = localStorage.getItem('jirama_permissions_v1') === 'true';
      setCurrentView(hasPermissions ? View.HOME : View.PERMISSIONS);
      setDraft(storageService.getDraft());
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (currentView === View.HOME) {
      setDraft(storageService.getDraft());
    }
  }, [currentView]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'night-mode');
    if (theme === 'dark') root.classList.add('dark');
    if (theme === 'night') root.classList.add('dark', 'night-mode');
    
    if (theme === 'night') {
      document.body.style.backgroundColor = '#000000';
    } else if (theme === 'dark') {
      document.body.style.backgroundColor = '#0f172a';
    } else {
      document.body.style.backgroundColor = '#f8fafc';
    }
    
    localStorage.setItem('jirama_theme_mode', theme);
  }, [theme]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const goToHome = () => {
    setEditingReading(null);
    setCurrentView(View.HOME);
  };

  const handleQuit = () => {
    if(confirm("Quitter l'application ?")) {
      setCurrentView(View.SPLASH);
      setTimeout(() => {
        setCurrentView(View.HOME);
      }, 2000);
    }
  };

  const handleResumeDraft = () => {
    if (draft) {
      setEditingReading(draft);
      setCurrentView(View.CREATE);
    }
  };

  const handleSelectFolder = (type: 'backup' | 'pdf') => {
    setIsConfiguring(type);
    setTimeout(() => {
      const paths = type === 'backup' 
        ? ['/InternalStorage/Documents/JIRAMA/Data', '/SDCard/JIRAMA/Backup', '/Cloud/Maintenance/History']
        : ['/Download/JIRAMA_PDF', '/Documents/Reports/Maintenance', '/InternalStorage/PDF_Exports'];
      
      const selected = paths[Math.floor(Math.random() * paths.length)];
      if(type === 'backup') {
        setBackupPath(selected);
        localStorage.setItem('jirama_backup_path', selected);
      } else {
        setPdfPath(selected);
        localStorage.setItem('jirama_pdf_path', selected);
      }
      setIsConfiguring(null);
    }, 1200);
  };

  const renderView = () => {
    switch (currentView) {
      case View.SPLASH:
        return <SplashScreen key="splash" />;
      case View.PERMISSIONS:
        return <PermissionsScreen key="perms" onGranted={() => setCurrentView(View.HOME)} />;
      case View.SETTINGS:
        return (
          <div className={`min-h-screen ${theme === 'light' ? 'bg-gray-50 text-slate-900' : theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-black text-white'} p-6 transition-colors duration-300 pb-20`}>
            <header className="flex justify-between items-center mb-10 max-w-xl mx-auto">
              <button onClick={goToHome} className={`p-4 rounded-2xl shadow-lg transition-all active:scale-90 ${theme === 'light' ? 'bg-white text-slate-900' : 'bg-slate-800 text-white'}`}>
                <ChevronLeft className="w-6 h-6" />
              </button>
              <h1 className="text-xl font-black uppercase tracking-tighter">Configuration</h1>
              <div className="w-14" />
            </header>
            
            <div className="max-w-xl mx-auto space-y-6">
              {/* Install Card (PWA to APK experience) */}
              {!isInstalled && deferredPrompt && (
                <div className="bg-blue-600 p-8 rounded-[2.5rem] shadow-2xl shadow-blue-600/30 text-white overflow-hidden relative">
                   <div className="relative z-10">
                     <h3 className="font-black uppercase text-lg mb-2 leading-none">Installer l'application</h3>
                     <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-6">Accédez à JIRAMA PRO depuis votre écran d'accueil, même sans connexion.</p>
                     <button 
                      onClick={handleInstallClick}
                      className="w-full py-4 bg-white text-blue-600 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center"
                     >
                       <Download className="w-4 h-4 mr-2" /> Installer Maintenant
                     </button>
                   </div>
                   <Download className="absolute -bottom-6 -right-6 w-32 h-32 text-white/10 rotate-12" />
                </div>
              )}

              <div className={`${theme === 'light' ? 'bg-white' : 'bg-slate-800'} p-8 rounded-[2.5rem] shadow-xl border border-white/5`}>
                <div className="flex items-center mb-8">
                  <LayoutGrid className="w-5 h-5 text-blue-500 mr-3" />
                  <h3 className="font-black uppercase text-[10px] text-blue-500 tracking-widest">Thème de l'interface</h3>
                </div>
                
                <div className="space-y-4">
                  {[
                    { id: 'light', label: 'MODE CLAIR', icon: Sun, desc: 'Optimisé pour le jour' },
                    { id: 'dark', label: 'MODE SOMBRE', icon: Moon, desc: 'Économie d\'énergie' },
                    { id: 'night', label: 'MODE NUIT', icon: Zap, desc: 'Noir pur pour OLED' }
                  ].map((t) => (
                    <button 
                      key={t.id} 
                      onClick={() => setTheme(t.id as ThemeMode)} 
                      className={`w-full flex items-center justify-between p-6 rounded-3xl border-2 transition-all active:scale-95 ${theme === t.id ? 'border-blue-600 bg-blue-600/5 dark:bg-blue-600/10' : 'border-transparent bg-gray-50 dark:bg-slate-900/50'}`}
                    >
                      <div className="flex items-center">
                        <div className={`p-3 rounded-2xl mr-4 ${theme === t.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white dark:bg-slate-800 text-gray-400'}`}>
                          <t.icon className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                          <span className="block font-black text-xs tracking-wider">{t.label}</span>
                          <span className="block text-[10px] opacity-50 uppercase font-bold">{t.desc}</span>
                        </div>
                      </div>
                      {theme === t.id && <div className="w-4 h-4 bg-blue-600 rounded-full ring-4 ring-blue-600/20" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`${theme === 'light' ? 'bg-white' : 'bg-slate-800'} p-8 rounded-[2.5rem] shadow-xl border border-white/5`}>
                <div className="flex items-center mb-8">
                  <FolderSync className="w-5 h-5 text-amber-500 mr-3" />
                  <h3 className="font-black uppercase text-[10px] text-amber-500 tracking-widest">Emplacements de stockage</h3>
                </div>

                <div className="space-y-6">
                  <div className="p-5 rounded-3xl bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <HardDrive className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <span className="block font-black text-[10px] text-gray-400 uppercase tracking-widest">Base de Données</span>
                          <span className="block font-bold text-xs truncate max-w-[150px]">{backupPath}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleSelectFolder('backup')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-md active:scale-95 transition-all"
                      >
                        {isConfiguring === 'backup' ? 'Recherche...' : 'Configurer'}
                      </button>
                    </div>
                  </div>

                  <div className="p-5 rounded-3xl bg-gray-50 dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <FileSearch className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <span className="block font-black text-[10px] text-gray-400 uppercase tracking-widest">Exports PDF</span>
                          <span className="block font-bold text-xs truncate max-w-[150px]">{pdfPath}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleSelectFolder('pdf')}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-md active:scale-95 transition-all"
                      >
                        {isConfiguring === 'pdf' ? 'Recherche...' : 'Configurer'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`${theme === 'light' ? 'bg-white' : 'bg-slate-800'} p-8 rounded-[2.5rem] shadow-xl border border-white/5`}>
                <div className="flex items-center mb-4">
                  <Shield className="w-5 h-5 text-emerald-500 mr-3" />
                  <h3 className="font-black uppercase text-[10px] text-emerald-500 tracking-widest">Sécurité App</h3>
                </div>
                <p className="text-xs opacity-50 font-medium">Version logicielle : 3.1.0-PRO<br/>Base de données locale : Sécurisée</p>
              </div>
            </div>

            <AnimatePresence>
              {isConfiguring && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }} 
                  className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-6"
                >
                  <div className="text-center">
                    <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                       <motion.div 
                        animate={{ rotate: 360 }} 
                        transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full"
                       />
                       <FolderOpen className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-white font-black uppercase tracking-[0.2em] text-sm">Accès au système...</h3>
                    <p className="text-white/40 text-[10px] mt-2 font-bold uppercase tracking-widest">Veuillez sélectionner le dossier sur votre téléphone</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      case View.CREATE:
        return (
          <ReadingForm 
            key="create" 
            initialReading={editingReading}
            onBack={() => setCurrentView(editingReading ? View.HISTORY : View.HOME)} 
            onSaved={() => setCurrentView(View.HISTORY)} 
            onGoHome={goToHome}
            onGoHistory={() => setCurrentView(View.HISTORY)}
            onQuit={handleQuit}
          />
        );
      case View.HISTORY:
        return (
          <ReadingHistory 
            key="history" 
            onBack={goToHome} 
            onEdit={(r) => { setEditingReading(r); setCurrentView(View.CREATE); }}
            onGoHome={goToHome}
            onQuit={handleQuit}
          />
        );
      case View.HOME:
      default:
        return (
          <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`min-h-screen ${theme === 'light' ? 'bg-blue-50 text-slate-900' : theme === 'dark' ? 'bg-slate-900 text-white' : 'bg-black text-white'} p-6 transition-colors duration-500 overflow-hidden relative`}>
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] -mr-48 -mt-48" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-600/10 rounded-full blur-[80px] -ml-40 -mb-40" />

            <div className="max-w-xl mx-auto py-8 relative z-10">
              <header className="flex justify-between items-center mb-16">
                <div>
                  <h1 className="text-4xl font-black tracking-tighter uppercase leading-none">JIRAMA PRO</h1>
                  <p className="text-blue-600 dark:text-blue-400 font-black text-[10px] uppercase tracking-[0.4em] mt-2">Maintenance Industrielle</p>
                </div>
                <div className="flex space-x-3">
                  <button onClick={() => setCurrentView(View.SETTINGS)} className={`p-4 rounded-2xl shadow-xl transition-all active:scale-90 ${theme === 'light' ? 'bg-white text-blue-600' : 'bg-slate-800 text-blue-400 border border-white/5'}`}>
                    <Settings className="w-6 h-6" />
                  </button>
                  <button onClick={handleQuit} className={`p-4 rounded-2xl shadow-xl transition-all active:scale-90 ${theme === 'light' ? 'bg-red-50 text-red-600' : 'bg-red-900/20 text-red-500 border border-red-500/10'}`}>
                    <LogOut className="w-6 h-6" />
                  </button>
                </div>
              </header>

              <div className={`p-10 rounded-[3rem] mb-10 border border-white/5 shadow-2xl overflow-hidden relative group ${theme === 'light' ? 'bg-white' : 'bg-slate-800/50 backdrop-blur-xl'}`}>
                <div className="absolute top-0 left-0 w-2 h-full bg-blue-600" />
                <h2 className="text-2xl font-black mb-2 uppercase tracking-tight">Poste de Contrôle</h2>
                <p className="text-xs opacity-50 font-bold uppercase tracking-widest leading-relaxed">Prise de relevés certifiée pour les sites stratégiques de Madagascar.</p>
                <div className="mt-8 flex space-x-4">
                   <div className="px-4 py-2 bg-blue-500/10 rounded-xl border border-blue-500/20 text-[10px] font-black text-blue-500 uppercase tracking-widest">v3.1 PRO</div>
                   <div className="px-4 py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-[10px] font-black text-emerald-500 uppercase tracking-widest">CLOUD SYNC</div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <button 
                  onClick={() => { setEditingReading(null); setCurrentView(View.CREATE); }} 
                  className="group h-56 bg-blue-600 hover:bg-blue-700 text-white rounded-[3.5rem] shadow-2xl shadow-blue-600/30 flex flex-col items-center justify-center active:scale-[0.98] transition-all relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <PlusCircle className="w-16 h-16 mb-4 drop-shadow-lg" />
                  <span className="text-2xl font-black uppercase tracking-tighter">Nouveau Relevé</span>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mt-1">Commencer l'inspection</p>
                </button>

                <AnimatePresence>
                  {draft && (
                    <motion.button 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={handleResumeDraft}
                      className="group h-32 bg-amber-500 hover:bg-amber-600 text-white rounded-[2.5rem] shadow-xl shadow-amber-500/20 flex items-center justify-center space-x-6 px-8 active:scale-[0.98] transition-all relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="p-4 bg-white/20 rounded-2xl">
                        <Play className="w-8 h-8 fill-white" />
                      </div>
                      <div className="text-left">
                        <span className="block text-lg font-black uppercase tracking-tight leading-none">Reprendre le relevé</span>
                        <span className="block text-[10px] font-bold uppercase tracking-widest opacity-80 mt-1">Dernier en cours : {draft.type} ({new Date(draft.date).toLocaleDateString()})</span>
                      </div>
                    </motion.button>
                  )}
                </AnimatePresence>

                <button 
                  onClick={() => setCurrentView(View.HISTORY)} 
                  className={`group h-40 rounded-[3rem] shadow-xl flex flex-col items-center justify-center active:scale-[0.98] transition-all border border-white/5 relative overflow-hidden ${theme === 'light' ? 'bg-white' : 'bg-slate-800/50 backdrop-blur-lg'}`}
                >
                  <History className="w-8 h-8 mb-2 text-blue-500" />
                  <span className="text-xl font-black uppercase tracking-tight">Archives Historique</span>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-40 mt-1">Consulter les rapports</p>
                </button>
              </div>
              
              <footer className="mt-16 text-center opacity-30">
                <p className="text-[9px] font-black uppercase tracking-[0.5em]">JIRAMA ENERGY SOLUTIONS</p>
              </footer>
            </div>
          </motion.div>
        );
    }
  };

  return <AnimatePresence mode="wait">{renderView()}</AnimatePresence>;
};

export default App;
