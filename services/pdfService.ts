
import { jsPDF } from 'jspdf';
import { Reading, ReadingType } from '../types';

export const pdfService = {
  generateReport: async (reading: Reading) => {
    const doc = new jsPDF();
    const isElec = reading.type === ReadingType.ELECTRICITY;
    const primary = isElec ? [37, 99, 235] : [16, 185, 129];
    const dark = [15, 23, 42];
    
    // --- PAGE 1: PAGE DE GARDE ULTRA-PRO & IMPOSANTE ---
    // Fond sombre intégral
    doc.setFillColor(dark[0], dark[1], dark[2]);
    doc.rect(0, 0, 210, 297, 'F');
    
    // Triangle graphique en haut à gauche
    doc.setFillColor(primary[0], primary[1], primary[2]);
    doc.triangle(0, 0, 140, 0, 0, 170, 'F');
    
    // Bloc central blanc
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(10, 90, 190, 185, 8, 8, 'F');

    const lx = 105;
    const ly = 60;
    
    // Logo / Icône centrale stylisée
    doc.setFillColor(0, 0, 0, 0.3);
    doc.circle(lx + 2, ly + 2, 25, 'F');
    
    doc.setFillColor(255, 255, 255);
    doc.circle(lx, ly, 25, 'F');
    doc.setDrawColor(primary[0], primary[1], primary[2]);
    doc.setLineWidth(2);
    doc.circle(lx, ly, 22, 'D');

    // Graphique interne de l'icône
    doc.setLineWidth(2.5);
    doc.line(lx - 10, ly - 10, lx + 10, ly + 10);
    doc.circle(lx - 10, ly - 10, 3, 'D');
    
    doc.setLineWidth(1.2);
    for(let i=0; i<12; i++) {
        const a = (i * 30) * (Math.PI/180);
        doc.line(lx + Math.cos(a)*8, ly + Math.sin(a)*8, lx + Math.cos(a)*12, ly + Math.sin(a)*12);
    }
    doc.circle(lx, ly, 6, 'D');

    // TITRE PRINCIPAL (AGRANDI)
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(44); // Augmenté de 32 à 44
    doc.text('RAPPORT DE', lx, 125, { align: 'center' });
    doc.text('RELEVÉ', lx, 142, { align: 'center' });
    
    // Sous-titre Département (AGRANDI)
    doc.setTextColor(primary[0], primary[1], primary[2]);
    doc.setFontSize(20); // Augmenté de 14 à 20
    doc.text('DÉPARTEMENT TECHNIQUE JIRAMA', lx, 155, { align: 'center' });
    
    // Ligne de séparation
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(1);
    doc.line(30, 165, 180, 165);

    // TYPE DE RELEVÉ (TRÈS GRAND)
    doc.setTextColor(dark[0], dark[1], dark[2]);
    doc.setFontSize(32); // Augmenté de 22 à 32
    doc.text(reading.type.toUpperCase(), lx, 185, { align: 'center' });
    
    // Date d'inspection (PLUS GRANDE ET STYLISÉE)
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text('DATE D\'INSPECTION CERTIFIÉE', lx, 205, { align: 'center' });
    
    doc.setTextColor(dark[0], dark[1], dark[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20); // Augmenté de 16 à 20
    const formattedDate = new Date(reading.date).toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    }).toUpperCase();
    doc.text(formattedDate, lx, 218, { align: 'center' });

    // ID de Référence
    doc.setTextColor(140, 140, 140);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('RÉFÉRENCE UNIQUE DE L\'INTERVENTION', lx, 238, { align: 'center' });
    doc.setTextColor(primary[0], primary[1], primary[2]);
    doc.setFont('helvetica', 'bold');
    doc.text(reading.id.toUpperCase(), lx, 246, { align: 'center' });

    // Zone des signatures
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(35, 265, 95, 265);
    doc.line(115, 265, 175, 265);
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('VISA TECHNICIEN RESPONSABLE', 65, 272, { align: 'center' });
    doc.text('VISA DIRECTION EXÉCUTIVE', 145, 272, { align: 'center' });

    // Footer copyright
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('SYSTÈME JIRAMA RELEVÉS APP v3.1 PRO | DOCUMENT OFFICIEL', 105, 288, { align: 'center' });

    // --- PAGES PHOTOS ---
    const grouped: Record<string, string[]> = {};
    reading.photos.forEach(p => {
      if (!grouped[p.department]) grouped[p.department] = [];
      grouped[p.department].push(p.dataUrl);
    });

    for (const [dept, urls] of Object.entries(grouped)) {
      urls.forEach((url, idx) => {
        doc.addPage();
        
        // Header de département coloré
        doc.setFillColor(primary[0], primary[1], primary[2]);
        doc.rect(0, 0, 210, 50, 'F');
        
        // Fond blanc semi-transparent pour le texte du département
        doc.setFillColor(255, 255, 255, 0.2);
        doc.roundedRect(10, 10, 190, 30, 4, 4, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(36); 
        doc.setFont('helvetica', 'bold');
        doc.text(dept.toUpperCase(), 105, 32, { align: 'center' });
        
        try {
          const margin = 12;
          const topSpace = 55;
          const bottomSpace = 25;
          const availableW = 210 - (margin * 2);
          const availableH = 297 - topSpace - bottomSpace;
          
          doc.addImage(url, 'JPEG', margin, topSpace, availableW, availableH, undefined, 'MEDIUM', 0);
          
          // Cadre léger autour de l'image
          doc.setDrawColor(220, 220, 220);
          doc.setLineWidth(0.2);
          doc.rect(margin, topSpace, availableW, availableH, 'D');
        } catch (e) {
          doc.setTextColor(150, 150, 150);
          doc.setFontSize(12);
          doc.text("ERREUR : Impossible de charger l'image haute résolution.", 105, 150, { align: 'center' });
        }

        // Footer de page avec informations de pièce jointe
        doc.setFillColor(dark[0], dark[1], dark[2]);
        doc.rect(0, 287, 210, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(`PAGE ${doc.getNumberOfPages()} | PIÈCE JOINTE N°${idx + 1}/${urls.length} - ${reading.type.toUpperCase()} | JIRAMA INSPECTION TECHNIQUE`, 105, 293.5, { align: 'center' });
      });
    }

    doc.save(`RAPPORT_OFFICIEL_JIRAMA_${reading.type.toUpperCase()}_${reading.date}.pdf`);
  }
};
