import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  BarChart,
  Bar
} from 'recharts';
import { 
  PlusCircle, 
  Sparkles, 
  Send, 
  Search, 
  SlidersHorizontal, 
  Download, 
  Trash2, 
  Phone, 
  MapPin, 
  Clock, 
  DollarSign, 
  Globe, 
  CheckCircle, 
  TrendingUp, 
  Users, 
  Bookmark, 
  ExternalLink,
  RefreshCw,
  Copy,
  FolderPlus,
  BookOpen,
  Check,
  ChevronRight,
  UserCheck,
  X,
  Plus
} from 'lucide-react';

interface Prospect {
  id: string;
  nom: string;
  secteur: string;
  telephone: string;
  adresse: string;
  description: string;
  noteGoogle?: number;
  avis?: number;
  horaires?: string;
  source: string;
  prixCible: number;
  statut: 'À contacter' | 'Contacté' | 'Répondu' | 'Rendez-vous pris' | 'Client' | 'Pas intéressé';
  dateAjout: string;
  dateContact?: string;
  messageEnvoye?: string;
  messagesHistorique: string[];
  montantFacture?: number;
}

interface WinningMessage {
  id: string;
  titre: string;
  prospectNom: string;
  message: string;
  dateSauvegarde: string;
}

const SECTEURS = [
  "Pharmacie", 
  "Boutique", 
  "Restaurant", 
  "Clinique", 
  "École", 
  "Salon de beauté", 
  "Autre"
];

const SOURCES = [
  "Google Maps", 
  "Instagram", 
  "Annuaire Haiti-Digital/petion-ville.com", 
  "Facebook", 
  "Autre"
];

// Seed initial data for a brilliant high-fidelity user experience
const INITIAL_PROSPECTS: Prospect[] = [
  {
    id: "prospect-1",
    nom: "Pharmacie du Centre Delmas",
    secteur: "Pharmacie",
    telephone: "+509 3744-2233",
    adresse: "Delmas 32, Port-au-Prince",
    description: "Ouvert 24/7. Spécialiste en produits pédiatriques et médicaments importés. Grand choix de produits hygiéniques.",
    noteGoogle: 4.4,
    avis: 28,
    horaires: "24/7",
    source: "Google Maps",
    prixCible: 350,
    statut: "À contacter",
    dateAjout: "2026-06-20",
    messagesHistorique: []
  },
  {
    id: "prospect-2",
    nom: "Rebèl Boutique",
    secteur: "Boutique",
    telephone: "+509 4812-3456",
    adresse: "Rue Panamericaine, Pétion-Ville",
    description: "Vente de vêtements de luxe, chaussures et accessoires tendance pour hommes et femmes en provenance de Miami. Boutique physique à Pétion-Ville et forte présence Instagram.",
    noteGoogle: 4.8,
    avis: 14,
    horaires: "Lun-Sam 9:00 AM - 6:00 PM",
    source: "Instagram",
    prixCible: 300,
    statut: "Contacté",
    dateAjout: "2026-06-19",
    dateContact: "2026-06-21",
    messageEnvoye: "Saluasyon ekip Rebèl Boutique la! 👋 Mwen remake bèl kolleksyon nou sou Instagram epi bèl nòt 4.8 zetwal nou genyen sou Google Maps pou bon sèvis nou bay nan Pétion-Ville. Mwen rele Yondy, mwen se devlopè nan Yondy Web. Nou ede boutik yo gen bèl sit internet ak aplikasyon mobil rapid kap pèmèt kliyan yo peye dirèkteman ak *MonCash* ak *Natcash* solid! Eske se ta yon bon lide nou mete sa sou pye pou kliyan yo pase lòd pi fasil?",
    messagesHistorique: ["Saluasyon ekip Rebèl Boutique la! 👋 Mwen remake bèl kolleksyon nou sou Instagram epi bèl nòt 4.8 zetwal nou genyen sou Google Maps pour bon sèvis nou bay nan Pétion-Ville. Mwen rele Yondy, mwen se devlopè nan Yondy Web. Nou ede boutik yo gen bèl sit internet ak aplikasyon mobil rapid kap pèmèt kliyan yo peye dirèkteman ak *MonCash* ak *Natcash* solid! Eske se ta yon bon lide nou mete sa sou pye pou kliyan yo pase lòd pi fasil?"]
  },
  {
    id: "prospect-3",
    nom: "Oasis Restaurant & Grill",
    secteur: "Restaurant",
    telephone: "+509 3121-5544",
    adresse: "Boulevard 15 Octobre, Tabarre",
    description: "Restaurant familial de spécialités locales (Griot, tase de kabrit, banan peze, diri kole) et grillades au charbon de bois.",
    noteGoogle: 4.2,
    avis: 75,
    horaires: "Mer-Dim 12h - 22h",
    source: "Annuaire Haiti-Digital/petion-ville.com",
    prixCible: 400,
    statut: "Client",
    montantFacture: 450,
    dateAjout: "2026-06-15",
    dateContact: "2026-06-16",
    messageEnvoye: "Ocho Oasis! 🍽️ Mwen wè nou se yon gwo referans nan Tabarre pou bèl griyo ak bèl kòmantè sou Google Maps! Nou espesyalize nan kreye meni nimerik entèaktif kote kliyan yo kapab kòmande dirèkteman sou telefòn yo epi peye ak MonCash/Natcash. Sa redui fil tann yo epi vann plis rasyon! Nou ta gen 10 minit pou nou diskite sou yon pwopo?",
    messagesHistorique: []
  },
  {
    id: "prospect-4",
    nom: "École Mixte Saint-Jean",
    secteur: "École",
    telephone: "+509 3662-7788",
    adresse: "Rue Métreaux, Delmas 75",
    description: "Institution privée d'enseignement primaire et secondaire. Fondée en 2012.",
    noteGoogle: 4.0,
    avis: 5,
    horaires: "Lun-Ven 7:30 AM - 1:30 PM",
    source: "Facebook",
    prixCible: 550,
    statut: "Rendez-vous pris",
    dateAjout: "2026-06-18",
    dateContact: "2026-06-20",
    messageEnvoye: "Bonjou Direksyon Lekòl Mixte Saint-Jean. 🎓 Mwen kontakte nou apre m wè lekòl la ap bay bon rezilta depi plizyè ane nan Delmas 75. Nou se *Yondy Web*, nou kapab bati yon sit wèb modèn pou lekòl la pou pèmèt paran yo swiv nòt elèv yo ak peye ekolaj la dirèkteman an liy ak MonCash ak Natcash san yo pa bezwen fè gwo liy nan bank lan. Eske nou ta dispoze pou nou prezante nou yon egzanp sit nou deja fè pou lòt lekòl?",
    messagesHistorique: []
  }
];

const INITIAL_WINNING_MESSAGES: WinningMessage[] = [
  {
    id: "win-1",
    titre: "Menm Kreyòl-Fransè ak MonCash",
    prospectNom: "Rebèl Boutique",
    message: "Saluasyon ekip Rebèl Boutique la! 👋 Mwen remake bèl kolleksyon nou sou Instagram epi bèl nòt 4.8 zetwal nou genyen sou Google Maps pou bon sèvis nou bay nan Pétion-Ville. Mwen rele Yondy, mwen se devlopè nan Yondy Web. Nou ede boutik yo gen bèl sit internet ak aplikasyon mobil rapid kap pèmèt kliyan yo peye dirèkteman ak *MonCash* ak *Natcash* solid! Eske se ta un bèl opòtinite pou nou elaji vant nou an liy?",
    dateSauvegarde: "2026-06-20"
  },
  {
    id: "win-2",
    titre: "Restaurant ak QR Code",
    prospectNom: "Epicerie & Grill lakay",
    message: "Bonjou direktè! Respè pou bèl travay n'ap fè ak bèl sèvis griyad nan zòn Delmas a. 🍗 Mwen se Yondy nan Yondy Web, nou espesyalize nan sit entènèt ak meni QR Code ak kòmand entegre MonCash/Natcash. Sa pèmèt kliyan yo peye epi kòmande depi sou tab yo oswa lakay yo san gwo tèt chaje! Nou ta renmen jwenn yon ti kout moman pou n montre w yon ti demonstrasyon gratis?",
    dateSauvegarde: "2026-06-18"
  }
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
  
  return (
    <div id="yondy-container" className="min-h-screen bg-[#F7F4EE] font-sans text-[#1A1A18] flex flex-col antialiased">
      
      {/* HEADER SECTION WITH NAVIGATION */}
      <header className="bg-[#0B3D2E] text-white py-3 md:py-4 px-4 md:px-6 shadow-md z-30 sticky top-0">
        <div className="max-w-7xl mx-auto flex flex-col gap-4">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#E0633B] text-white rounded-lg flex items-center justify-center shadow-md shrink-0">
                <span className="font-serif font-extrabold text-2xl tracking-tighter">Y</span>
              </div>
              <div>
                <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  Yondy Web <span className="text-[10px] px-2 py-0.5 bg-white/10 rounded font-sans tracking-widest uppercase font-medium">Prospection</span>
                </h1>
                <p className="text-[10px] sm:text-xs text-white/70 uppercase tracking-widest font-mono">
                  Port-au-Prince / Pétion-Ville / Delmas · Haïti 🇭🇹
                </p>
              </div>
            </div>
          </div>

          {/* 3 TABS NAVIGATION */}
          <nav className="flex items-center bg-black/20 p-1 rounded-lg w-full overflow-x-auto no-scrollbar">
            <button 
              onClick={() => setActiveTab('prospection')}
              className={`flex-1 px-4 py-2 text-xs sm:text-sm font-bold rounded-md transition-all whitespace-nowrap ${activeTab === 'prospection' ? 'bg-[#E0633B] text-white shadow-md' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
            >
              🚀 Prospection
            </button>
            <button 
              onClick={() => setActiveTab('suivi')}
              className={`flex-1 px-4 py-2 text-xs sm:text-sm font-bold rounded-md transition-all whitespace-nowrap ${activeTab === 'suivi' ? 'bg-[#E0633B] text-white shadow-md' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
            >
              📋 Suivi
            </button>
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`flex-1 px-4 py-2 text-xs sm:text-sm font-bold rounded-md transition-all whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-[#E0633B] text-white shadow-md' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
            >
              📊 Tableau de bord
            </button>
          </nav>

        </div>
      </header>

      {/* DETAILED CONTENT AREA */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 lg:p-6 items-start">
        
        {activeTab === 'prospection' && (
          <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto">
            {/* MOTIVATIONAL BANNER (Compacted for Prospection only) */}
            <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs p-3.5 flex items-center gap-3">
              <span className="text-lg">🎯</span>
              <div className="flex-1">
                <div className="flex justify-between items-center text-xs font-semibold text-gray-800 mb-1">
                  <span>Objectif d'envoi du jour</span>
                  <span className="font-bold text-[#E0633B]">{stats.sentToday}/20</span>
                </div>
                <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-600 h-full transition-all duration-300"
                    style={{ width: `${Math.min((stats.sentToday / 20) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {nouveau_prospect}
            {generation_message}
            {messages_gagnants}
            {new_quick_relances}
          </div>
        )}

        {activeTab === 'suivi' && (
          <div className="flex flex-col gap-6 w-full">
            {tableau_section}
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-6 w-full">
            {/* MOTIVATIONAL BANNER - Dashboard view */}
            {!stats.isSignificant && (
              <div className="bg-amber-50 border-l-4 border-amber-500 rounded-r-xl p-3.5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
                <div className="flex items-start gap-3">
                  <span className="text-xl shrink-0">📊</span>
                  <div>
                    <h4 className="font-bold text-xs text-amber-900 flex items-center gap-1.5">
                      Échantillon de suivi réduit ({stats.contactedCount} / 21 prospects contactés)
                    </h4>
                    <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed font-medium">
                      Le <strong>Taux de réponse</strong> officiel n'est pas affiché car le volume de test est trop faible.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Core Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border rounded-xl p-4 shadow-sm">
                <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Total Prospects</p>
                <p className="text-2xl font-bold font-serif text-[#E0633B]">{stats.total}</p>
              </div>
              <div className="bg-white border rounded-xl p-4 shadow-sm">
                <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Taux de réponse</p>
                <p className="text-2xl font-bold font-serif text-emerald-600">{stats.isSignificant ? `${stats.responseRate}%` : 'N/A'}</p>
              </div>
              <div className="bg-white border rounded-xl p-4 shadow-sm">
                <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Convertis</p>
                <p className="text-2xl font-bold font-serif text-emerald-600">{stats.conversionCount}</p>
              </div>
              <div className="bg-white border rounded-xl p-4 shadow-sm">
                <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Revenu Total</p>
                <p className="text-2xl font-bold font-serif text-amber-500">${stats.totalRevenue}</p>
              </div>
            </div>

            {chart_section}
            {financial_section}
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-[#0B3D2E] text-white py-6 text-center mt-auto border-t-4 border-[#E0633B]">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 bg-[#E0633B] text-white rounded flex items-center justify-center">
            <span className="font-serif font-bold text-xs">Y</span>
          </div>
          <span className="font-serif font-bold tracking-tight">Yondy Web</span>
        </div>
        <p className="text-white/60 text-xs font-mono">
          Outil interne de prospection et CRM · v1.2
        </p>
        <p className="text-white/40 text-[9px] mt-2 max-w-md mx-auto leading-relaxed px-4">
          Cette application centralise les données des commerçants haïtiens prospectés. L'intégration IA permet la personnalisation contextuelle locale.
        </p>
      </footer>

      {/* MODAL SECTION */}
      {modal_section}
    </div>
  );
