
import React from 'react';
import { motion } from 'framer-motion';
import { Camera, FolderOpen, ShieldCheck, CheckCircle } from 'lucide-react';

interface PermissionsScreenProps {
  onGranted: () => void;
}

export const PermissionsScreen: React.FC<PermissionsScreenProps> = ({ onGranted }) => {
  const [cameraGranted, setCameraGranted] = React.useState(false);
  const [filesGranted, setFilesGranted] = React.useState(false);

  const requestCamera = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
      setCameraGranted(true);
    } catch (e) {
      alert("L'accès à la caméra est nécessaire pour prendre les relevés.");
    }
  };

  const requestFiles = () => {
    // On web we can't truly "request" persistent file access like Android, 
    // but we simulate the confirmation for the user experience.
    setFilesGranted(true);
  };

  const handleFinish = () => {
    if (cameraGranted && filesGranted) {
      localStorage.setItem('jirama_permissions_v1', 'true');
      onGranted();
    } else {
      alert("Veuillez autoriser tous les accès pour continuer.");
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-[60] flex flex-col p-8">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
        <header className="py-12 text-center">
          <div className="bg-blue-100 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Autorisations Requises</h1>
          <p className="text-gray-500">Pour fonctionner correctement, JIRAMA Relevés a besoin des accès suivants :</p>
        </header>

        <div className="space-y-6 flex-1">
          <div 
            onClick={requestCamera}
            className={`p-6 rounded-3xl border-2 transition-all cursor-pointer ${cameraGranted ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 bg-gray-50 hover:border-blue-200'}`}
          >
            <div className="flex items-center">
              <div className={`p-4 rounded-2xl mr-4 ${cameraGranted ? 'bg-emerald-500 text-white' : 'bg-white text-blue-600 shadow-sm'}`}>
                <Camera className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-800">Appareil Photo</h3>
                <p className="text-sm text-gray-500">Pour prendre les photos des compteurs en usine.</p>
              </div>
              {cameraGranted && <CheckCircle className="w-6 h-6 text-emerald-500" />}
            </div>
          </div>

          <div 
            onClick={requestFiles}
            className={`p-6 rounded-3xl border-2 transition-all cursor-pointer ${filesGranted ? 'border-emerald-500 bg-emerald-50' : 'border-gray-100 bg-gray-50 hover:border-blue-200'}`}
          >
            <div className="flex items-center">
              <div className={`p-4 rounded-2xl mr-4 ${filesGranted ? 'bg-emerald-500 text-white' : 'bg-white text-blue-600 shadow-sm'}`}>
                <FolderOpen className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-800">Fichiers & Galerie</h3>
                <p className="text-sm text-gray-500">Pour enregistrer les PDF et importer des photos existantes.</p>
              </div>
              {filesGranted && <CheckCircle className="w-6 h-6 text-emerald-500" />}
            </div>
          </div>
        </div>

        <button 
          onClick={handleFinish}
          className={`w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-xl active:scale-95 mb-8 ${cameraGranted && filesGranted ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'}`}
        >
          Commencer l'utilisation
        </button>
      </div>
    </div>
  );
};
