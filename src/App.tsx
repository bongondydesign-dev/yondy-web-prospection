import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { extractDataFromText, generateMessage } from './gemini';
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

export interface Prospect {
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
      <div className="bg-white p-2.5 border border-gray-200 rounded-lg shadow-md font-sans">
        <p className="text-[10px] font-bold text-gray-400">{label}</p>
        <p className="text-xs font-bold text-[#0B3D2E] mt-0.5">
          {payload[0].value} prospect{payload[0].value > 1 ? 's' : ''} contacté{payload[0].value > 1 ? 's' : ''}
        </p>
      </div>
    );
  }
  return null;
};

const getFollowUpStatus = (p: any) => {
  if (!p.dateContact) return null;
  if (p.statut === 'Client' || p.statut === 'Pas intéressé') return null;

  const contactDate = new Date(p.dateContact);
  const today = new Date();

  // Clear time parts for clean date reference
  contactDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - contactDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays >= 7) {
    return { type: 'overdue-7', days: diffDays, label: '🚨 Relancer J+7' };
  } else if (diffDays >= 3) {
    return { type: 'overdue-3', days: diffDays, label: '⏳ Relancer J+3' };
  }
  return null;
};

// Validateur de numéro haïtien en temps réel avec détection intelligente de réseau
export const getHaitianPhoneValidation = (phoneStr: string) => {
  const digits = phoneStr.replace(/[^\d]/g, '');
  if (!digits || digits === '509' || phoneStr.trim() === '') {
    return { isValid: false, errorMsg: "Le numéro de téléphone est obligatoire.", network: null };
  }

  let localPart = '';
  if (digits.length === 11 && digits.startsWith('509')) {
    localPart = digits.substring(3);
  } else if (digits.length === 8) {
    localPart = digits;
  } else if (digits.length === 13 && digits.startsWith('00509')) {
    localPart = digits.substring(5);
  } else {
    return {
      isValid: false,
      errorMsg: "Un numéro haïtien valide doit comporter exactement 8 chiffres locaux après le préfixe.",
      network: null
    };
  }

  const first = localPart.charAt(0);
  const validPrefixes = ['2', '3', '4', '5'];
  if (!validPrefixes.includes(first)) {
    return {
      isValid: false,
      errorMsg: `Préfixe de région/mobile "${first}" invalide. Les numéros en Haïti débutent par 2, 3, 4 ou 5.`,
      network: null
    };
  }

  // Carrier Mapping
  let network: 'Digicel' | 'Natcom' | 'Ligne Fixe (Natcom/Teleco)' | 'Inconnu' = 'Inconnu';
  const prefix2 = localPart.substring(0, 2);
  if (first === '2') {
    network = 'Ligne Fixe (Natcom/Teleco)';
  } else if (first === '3') {
    if (prefix2 === '30') {
      network = 'Natcom';
    } else {
      network = 'Digicel';
    }
  } else if (first === '4') {
    if (['40', '41', '42', '43', '46', '49'].includes(prefix2)) {
      network = 'Digicel';
    } else if (['44', '45', '47', '48'].includes(prefix2)) {
      network = 'Natcom';
    } else {
      network = 'Digicel';
    }
  } else if (first === '5') {
    if (prefix2 === '55') {
      network = 'Natcom';
    }
  }

  return { isValid: true, errorMsg: null, network };
};

export default function App() {
  // --- STATE MANAGEMENT ---
  const [activeTab, setActiveTab] = useState<'prospection' | 'suivi' | 'dashboard'>('prospection');
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [winningMessages, setWinningMessages] = useState<WinningMessage[]>([]);

  // Active state for selected prospect (for message generation or details)
  const [selectedProspectId, setSelectedProspectId] = useState<string | null>(null);

  // New Prospect Form State
  const [entryMode, setEntryMode] = useState<'smart' | 'manual'>('smart');
  const [rawPasteText, setRawPasteText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const [nom, setNom] = useState('');
  const [secteur, setSecteur] = useState('Pharmacie');
  const [autreSecteur, setAutreSecteur] = useState('');
  const [telephone, setTelephone] = useState('+509 ');

  // Compute reactive phone validations
  const phoneValidation = useMemo(() => {
    return getHaitianPhoneValidation(telephone);
  }, [telephone]);
  const [adresse, setAdresse] = useState('');
  const [description, setDescription] = useState('');
  const [noteGoogle, setNoteGoogle] = useState<string>('');
  const [avis, setAvis] = useState<string>('');
  const [horaires, setHoraires] = useState('');
  const [source, setSource] = useState('Google Maps');
  const [autreSource, setAutreSource] = useState('');
  const [prixCible, setPrixCible] = useState<number>(300);

  // Search & Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatut, setFilterStatut] = useState('Tous');
  const [filterSecteur, setFilterSecteur] = useState('Tous');

  // Generator parameters
  const [chosenLanguage, setChosenLanguage] = useState<'bilingual' | 'creole' | 'french'>('bilingual');
  const [professionalYetLocal, setProfessionalYetLocal] = useState<boolean>(true);
  const [tempGeneratedMessage, setTempGeneratedMessage] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [successAnimation, setSuccessAnimation] = useState(false);
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');

  // Drawer / View Detailed Modal State
  const [viewingProspectId, setViewingProspectId] = useState<string | null>(null);
  const [editModeInModal, setEditModeInModal] = useState(false);
  const [editedNote, setEditedNote] = useState('');
  const [editedStatus, setEditedStatus] = useState<Prospect['statut']>('À contacter');
  const [editedPhone, setEditedPhone] = useState('');
  const [editedPrice, setEditedPrice] = useState<number>(300);
  const [editedMontantFacture, setEditedMontantFacture] = useState<number>(300);

  const editedPhoneValidation = useMemo(() => {
    return getHaitianPhoneValidation(editedPhone);
  }, [editedPhone]);

  // Sync from Firebase
  useEffect(() => {
    const q = query(collection(db, 'prospects'), orderBy('dateAjout', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Prospect));
      setProspects(data);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'winningMessages'), orderBy('dateSauvegarde', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WinningMessage));
      setWinningMessages(data);
    });
    return () => unsubscribe();
  }, []);

  // Set the first outstanding "À contacter" prospect as active on initial load if none set
  useEffect(() => {
    if (!selectedProspectId && prospects.length > 0) {
      const activeOne = prospects.find(p => p.statut === 'À contacter') || prospects[0];
      if (activeOne) {
        setSelectedProspectId(activeOne.id);
        setTempGeneratedMessage(activeOne.messageEnvoye || '');
      }
    }
  }, [prospects, selectedProspectId]);

  // Sync temp generated message when selected prospect changes
  const activeSelectedProspect = useMemo(() => {
    return prospects.find(p => p.id === selectedProspectId) || null;
  }, [prospects, selectedProspectId]);

  useEffect(() => {
    if (activeSelectedProspect) {
      setTempGeneratedMessage(activeSelectedProspect.messageEnvoye || '');
    }
  }, [selectedProspectId, activeSelectedProspect]);

  // --- STATS CALCULATIONS ---
  const stats = useMemo(() => {
    const total = prospects.length;

    // Objective tracking: items where status altered or contacted today
    const todayStr = new Date().toISOString().split('T')[0];
    const sentToday = prospects.filter(p => p.dateContact === todayStr).length;

    const contactedCount = prospects.filter(p =>
      ['Contacté', 'Répondu', 'Rendez-vous pris', 'Client', 'Pas intéressé'].includes(p.statut)
    ).length;

    const positiveCount = prospects.filter(p =>
      ['Répondu', 'Rendez-vous pris', 'Client'].includes(p.statut)
    ).length;

    const conversionCount = prospects.filter(p => p.statut === 'Client').length;

    const isSignificant = contactedCount > 20;
    const rawResponseRate = contactedCount > 0
      ? Math.round((positiveCount / contactedCount) * 1000) / 10
      : 0.0;

    // Only return response rate if sample is significant (> 20 prospects contacted)
    const responseRate = isSignificant ? rawResponseRate : null;

    // --- REVENUE CALCULATIONS ---
    // Total revenue generated
    const totalRevenue = prospects
      .filter(p => p.statut === 'Client')
      .reduce((sum, p) => sum + (p.montantFacture !== undefined ? p.montantFacture : p.prixCible), 0);

    // Valeur moyenne par client (revenu total ÷ nombre de clients)
    const averageClientValue = conversionCount > 0 ? Math.round(totalRevenue / conversionCount) : 0;

    // Total target budget value (prixCible) for all contacted prospects
    const totalCibleContacted = prospects
      .filter(p => ['Contacté', 'Répondu', 'Rendez-vous pris', 'Client', 'Pas intéressé'].includes(p.statut))
      .reduce((sum, p) => sum + p.prixCible, 0);

    // Taux de conversion en valeur:
    const conversionValueRate = totalCibleContacted > 0
      ? Math.round((totalRevenue / totalCibleContacted) * 1000) / 10
      : 0;

    // Revenu par source (Google Maps / Instagram / Annuaire / Facebook)
    const revenueBySource: Record<string, number> = {};
    const countBySourceStatusClient: Record<string, number> = {};

    SOURCES.forEach(s => {
      revenueBySource[s] = 0;
      countBySourceStatusClient[s] = 0;
    });

    prospects.forEach(p => {
      const rawSrc = p.source ? p.source.trim() : 'Autre';
      const src = SOURCES.find(s => s.toLowerCase() === rawSrc.toLowerCase()) || rawSrc;

      if (!(src in revenueBySource)) {
        revenueBySource[src] = 0;
        countBySourceStatusClient[src] = 0;
      }
      if (p.statut === 'Client') {
        const val = p.montantFacture !== undefined ? p.montantFacture : p.prixCible;
        revenueBySource[src] += val;
        countBySourceStatusClient[src]++;
      }
    });

    // Revenu par secteur (Pharmacie / Boutique / Restaurant / École...)
    const revenueBySecteur: Record<string, number> = {};
    const countBySecteurStatusClient: Record<string, number> = {};

    SECTEURS.forEach(s => {
      revenueBySecteur[s] = 0;
      countBySecteurStatusClient[s] = 0;
    });

    prospects.forEach(p => {
      const rawSec = p.secteur ? p.secteur.trim() : 'Autre';
      const sec = SECTEURS.find(s => s.toLowerCase() === rawSec.toLowerCase()) || rawSec;

      if (!(sec in revenueBySecteur)) {
        revenueBySecteur[sec] = 0;
        countBySecteurStatusClient[sec] = 0;
      }
      if (p.statut === 'Client') {
        const val = p.montantFacture !== undefined ? p.montantFacture : p.prixCible;
        revenueBySecteur[sec] += val;
        countBySecteurStatusClient[sec]++;
      }
    });

    return {
      total,
      sentToday,
      responseRate,
      rawResponseRate,
      contactedCount,
      isSignificant,
      conversionCount,
      totalRevenue,
      averageClientValue,
      totalCibleContacted,
      conversionValueRate,
      revenueBySource,
      revenueBySecteur,
      countBySourceStatusClient,
      countBySecteurStatusClient
    };
  }, [prospects]);

  const displayedSources = useMemo(() => {
    const customs = Object.keys(stats.revenueBySource).filter(
      src => !SOURCES.includes(src) && (stats.revenueBySource[src] > 0 || (stats.countBySourceStatusClient[src] || 0) > 0)
    );
    return [...SOURCES, ...customs];
  }, [stats.revenueBySource]);

  const displayedSecteurs = useMemo(() => {
    const customs = Object.keys(stats.revenueBySecteur).filter(
      sec => !SECTEURS.includes(sec) && (stats.revenueBySecteur[sec] > 0 || (stats.countBySecteurStatusClient[sec] || 0) > 0)
    );
    return [...SECTEURS, ...customs];
  }, [stats.revenueBySecteur]);

  // --- LAST 7 DAYS CONTACTS EVOLUTION ---
  const last7DaysData = useMemo(() => {
    const dataPoints = [];
    const today = new Date();
    const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jui", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      // Count prospects that have a dateContact equal to dateStr
      const count = prospects.filter(p => p.dateContact === dateStr).length;

      const label = `${d.getDate()} ${months[d.getMonth()]}`;
      dataPoints.push({
        date: dateStr,
        name: label,
        "Prospects": count
      });
    }
    return dataPoints;
  }, [prospects]);

  // --- HANDLERS ---
  const handleExtractRawText = async () => {
    if (!rawPasteText.trim()) return;
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const data = await extractDataFromText(rawPasteText);

      // Pre-populate manual form inputs so user can double-check
      setNom(data.nom || '');
      setSecteur(SECTEURS.includes(data.secteur) ? data.secteur : 'Autre');
      if (!SECTEURS.includes(data.secteur)) {
        setAutreSecteur(data.secteur || '');
      }
      setTelephone(data.telephone || '+509 ');
      setAdresse(data.adresse || '');
      setDescription(data.description || '');
      setNoteGoogle(data.noteGoogle ? String(data.noteGoogle) : '');
      setAvis(data.avis ? String(data.avis) : '');
      setHoraires(data.horaires || '');
      setSource(SOURCES.includes(data.source) ? data.source : 'Google Maps');
      if (data.prixCible) {
        setPrixCible(Number(data.prixCible));
      }

      // Auto-toggle tab so the user can see & adjust extracted fields and save it
      setEntryMode('manual');
    } catch (err: any) {
      console.error("Extraction error:", err);
      setAnalysisError(err.message || "Erreur lors de l'analyse automatique. Vous pouvez toujours saisir manuellement.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateProspect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) return;

    if (!phoneValidation.isValid) {
      alert(`Format de téléphone invalide : ${phoneValidation.errorMsg}`);
      return;
    }

    const computedSecteur = secteur === 'Autre' ? (autreSecteur || 'Autre') : secteur;
    const computedSource = source === 'Autre' ? (autreSource || 'Autre') : source;

    const newProspectData = {
      nom: nom.trim(),
      secteur: computedSecteur,
      telephone: telephone.trim() || "+509 ",
      adresse: adresse.trim(),
      description: description.trim(),
      noteGoogle: noteGoogle ? parseFloat(noteGoogle) : null,
      avis: avis ? parseInt(avis) : null,
      horaires: horaires.trim() || null,
      source: computedSource,
      prixCible: prixCible || 300,
      statut: 'À contacter',
      dateAjout: new Date().toISOString().split('T')[0],
      messagesHistorique: []
    };

    try {
      const docRef = await addDoc(collection(db, "prospects"), newProspectData);
      setSelectedProspectId(docRef.id);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'ajout à Firebase");
      return;
    }

    // Reset Form fields
    setNom('');
    setSecteur('Pharmacie');
    setAutreSecteur('');
    setTelephone('+509 ');
    setAdresse('');
    setDescription('');
    setNoteGoogle('');
    setAvis('');
    setHoraires('');
    setSource('Google Maps');
    setAutreSource('');
    setPrixCible(300);

    // Dynamic UI feedback animation
    setSuccessAnimation(true);
    setTimeout(() => setSuccessAnimation(false), 2000);
  };

  const deleteProspect = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Voulez-vous vraiment supprimer ce prospect? Cette action est irréversible.")) {
      try {
        await deleteDoc(doc(db, "prospects", id));
        if (selectedProspectId === id) {
          setSelectedProspectId(null);
          setTempGeneratedMessage('');
        }
        if (viewingProspectId === id) {
          setViewingProspectId(null);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Run proxy generation call via Express API
  const handleGenerateMessage = async () => {
    if (!activeSelectedProspect) return;

    setIsGenerating(true);
    setGenerationError(null);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prospect: activeSelectedProspect,
          lang: chosenLanguage,
          professionalYetLocal
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Erreur de serveur de génération.");
      }

      const data = await response.json();
      setTempGeneratedMessage(data.message);

      // Save to Firebase history
      const currentHist = activeSelectedProspect.messagesHistorique || [];
      await updateDoc(doc(db, "prospects", activeSelectedProspect.id), {
        messageEnvoye: data.message,
        messagesHistorique: [data.message, ...currentHist]
      });
    } catch (err: any) {
      console.error(err);
      setGenerationError(err.message || "Impossible de joindre le service d'intelligence artificielle. Veuillez confirmer les secrets.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Text message clean and WhatsApp action trigger
  const handleSendWhatsApp = () => {
    if (!activeSelectedProspect || !tempGeneratedMessage) return;

    // Clean phone number: keep only numbers
    let rawPhone = activeSelectedProspect.telephone;
    // Strip everything that is not digital
    let cleanNum = rawPhone.replace(/[^\d]/g, '');

    // Haitian number defaults: if user didn't enter the country code 509 but it is an 8-digit number, prepend 509
    if (cleanNum.length === 8) {
      cleanNum = '509' + cleanNum;
    } else if (cleanNum.startsWith('00509')) {
      cleanNum = cleanNum.substring(2);
    } else if (cleanNum.length > 8 && !cleanNum.startsWith('509')) {
      // If it's a longer number without 509 (some other layout), we can try to prepend if it starts with 3 o 4 (Haiti main ranges)
      if (cleanNum.match(/^[34]\d{7}$/)) {
        cleanNum = '509' + cleanNum;
      }
    }

    // URL Encode the custom message text
    const encodedText = encodeURIComponent(tempGeneratedMessage);
    const whatsappUrl = `https://wa.me/${cleanNum}?text=${encodedText}`;

    // Target status update: automatically transition to 'Contacté' and log date
    const todayStr = new Date().toISOString().split('T')[0];

    updateDoc(doc(db, "prospects", activeSelectedProspect.id), {
      statut: activeSelectedProspect.statut === 'À contacter' ? 'Contacté' : activeSelectedProspect.statut,
      dateContact: todayStr,
      messageEnvoye: tempGeneratedMessage
    }).catch(err => console.error(err));

    // Trigger open
    window.open(whatsappUrl, '_blank');
  };

  // Change status of a prospect easily
  const updateProspectStatus = async (id: string, newStatut: Prospect['statut']) => {
    const prospect = prospects.find(p => p.id === id);
    if (!prospect) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const isNowContacted = ['Contacté', 'Répondu', 'Rendez-vous pris', 'Client', 'Pas intéressé'].includes(newStatut);

    try {
      await updateDoc(doc(db, "prospects", id), {
        statut: newStatut,
        dateContact: (isNowContacted && !prospect.dateContact) ? todayStr : prospect.dateContact,
        montantFacture: newStatut === 'Client' ? (prospect.montantFacture !== undefined ? prospect.montantFacture : prospect.prixCible) : (prospect.montantFacture || null)
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Bookmark current text message as a successful script templates library
  const handleSaveToWinningMessages = async () => {
    if (!activeSelectedProspect || !tempGeneratedMessage.trim()) return;

    try {
      await addDoc(collection(db, "winningMessages"), {
        titre: `Sondaj ${activeSelectedProspect.secteur} - ${activeSelectedProspect.nom.substring(0, 15)}`,
        prospectNom: activeSelectedProspect.nom,
        message: tempGeneratedMessage,
        dateSauvegarde: new Date().toISOString().split('T')[0]
      });
      alert("Message enregistré avec succès dans les 'Messages Gagnants' !");
    } catch (err) {
      console.error(err);
    }
  };

  // Remove bookmark from winners
  const handleDeleteWinningMessage = async (id: string) => {
    try {
      await deleteDoc(doc(db, "winningMessages", id));
    } catch (err) {
      console.error(err);
    }
  };

  // Duplicates detection (by phone number or name, case insensitive)
  const duplicatesInfo = useMemo(() => {
    const phoneGroups: Record<string, Prospect[]> = {};
    const nameGroups: Record<string, Prospect[]> = {};

    prospects.forEach(p => {
      // Normalize phone number (digits only, match last 8 digits)
      const cleanPhone = p.telephone ? p.telephone.replace(/\D/g, "") : "";
      if (cleanPhone && cleanPhone.length >= 8) {
        const key = cleanPhone.slice(-8);
        if (!phoneGroups[key]) phoneGroups[key] = [];
        phoneGroups[key].push(p);
      }

      // Track by common name patterns (trimmed & lower-cased)
      const cleanName = p.nom ? p.nom.trim().toLowerCase() : "";
      if (cleanName && cleanName.length > 2) {
        if (!nameGroups[cleanName]) nameGroups[cleanName] = [];
        nameGroups[cleanName].push(p);
      }
    });

    const duplicateGroupsList: { ids: string[]; name: string; telephone: string }[] = [];
    const addedIds = new Set<string>();

    const checkAndAddGroup = (group: Prospect[]) => {
      if (group.length > 1) {
        const ids = group.map(g => g.id);
        const groupHasAlreadyAdded = ids.some(id => addedIds.has(id));
        if (!groupHasAlreadyAdded) {
          ids.forEach(id => addedIds.add(id));
          duplicateGroupsList.push({
            ids,
            name: group[0].nom,
            telephone: group[0].telephone
          });
        }
      }
    };

    Object.values(phoneGroups).forEach(checkAndAddGroup);
    Object.values(nameGroups).forEach(checkAndAddGroup);

    return duplicateGroupsList;
  }, [prospects]);

  const handleMergeDuplicates = () => {
    if (duplicatesInfo.length === 0) return;

    setProspects(prev => {
      let currentList = [...prev];

      duplicatesInfo.forEach(dup => {
        const matchingProspects = currentList.filter(p => dup.ids.includes(p.id));
        if (matchingProspects.length <= 1) return;

        const statusPriority: Record<string, number> = {
          'Client': 5,
          'Rendez-vous pris': 4,
          'Répondu': 3,
          'Contacté': 2,
          'À contacter': 1,
          'Pas intéressé': 0
        };

        const primary = matchingProspects.reduce((best, curr) => {
          const scoreBest = statusPriority[best.statut] ?? 0;
          const scoreCurr = statusPriority[curr.statut] ?? 0;
          if (scoreCurr > scoreBest) return curr;
          if (scoreCurr === scoreBest) {
            const lenBest = (best.messagesHistorique || []).length;
            const lenCurr = (curr.messagesHistorique || []).length;
            if (lenCurr > lenBest) return curr;
          }
          return best;
        });

        // Merge attributes
        const mergedMessages = Array.from(new Set([
          ...(primary.messagesHistorique || []),
          ...matchingProspects.flatMap(m => m.messagesHistorique || [])
        ]));

        const mergedDescription = matchingProspects
          .map(m => m.description)
          .filter(Boolean)
          .reduce((longest, curr) => curr.length > longest.length ? curr : longest, primary.description || "");

        const mergedProspect: Prospect = {
          ...primary,
          messagesHistorique: mergedMessages,
          description: mergedDescription,
          montantFacture: matchingProspects.map(m => m.montantFacture).find(val => val !== undefined) || primary.montantFacture,
          noteGoogle: matchingProspects.map(m => m.noteGoogle).find(val => val !== undefined) || primary.noteGoogle,
          avis: matchingProspects.map(m => m.avis).find(val => val !== undefined) || primary.avis,
        };

        currentList = currentList.filter(p => !dup.ids.includes(p.id));
        currentList.push(mergedProspect);
      });

      return currentList;
    });

    alert("Fusion des doublons effectuée avec succès ! Les fiches ont été consolidées.");
  };

  // Filtering & Search
  const filteredProspects = useMemo(() => {
    return prospects.filter(p => {
      const matchSearch = p.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.adresse.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.secteur.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatut = filterStatut === 'Tous' || p.statut === filterStatut;
      const matchSecteur = filterSecteur === 'Tous' || p.secteur === filterSecteur;

      return matchSearch && matchStatut && matchSecteur;
    });
  }, [prospects, searchTerm, filterStatut, filterSecteur]);

  // CSV Exporter
  const handleExportCSV = () => {
    if (prospects.length === 0) {
      alert("Aucun prospect à exporter.");
      return;
    }

    // Header definition
    const headers = ["Nom", "Secteur", "Telephone", "Adresse", "Google Note", "Nb Avis", "Horaires", "Source", "Forfait USD", "Statut", "Date Ajout", "Date Contact", "Dernier Message"];

    const rows = prospects.map(p => [
      p.nom.replace(/"/g, '""'),
      p.secteur,
      p.telephone,
      p.adresse.replace(/"/g, '""'),
      p.noteGoogle || "",
      p.avis || "",
      (p.horaires || "").replace(/"/g, '""'),
      p.source,
      p.prixCible,
      p.statut,
      p.dateAjout,
      p.dateContact || "",
      (p.messageEnvoye || "").replace(/\n/g, " ").replace(/"/g, '""')
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" // Add BOM for Excel UTF-8 compliance
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `yondy_web_prospects_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Set detailed viewing and load temp fields
  const handleOpenDetailedModal = (p: Prospect) => {
    setViewingProspectId(p.id);
    setEditedNote(p.description);
    setEditedStatus(p.statut);
    setEditedPhone(p.telephone);
    setEditedPrice(p.prixCible);
    setEditedMontantFacture(p.montantFacture !== undefined ? p.montantFacture : p.prixCible);
    setEditModeInModal(false);
  };

  const handleSaveModalEdits = () => {
    if (!viewingProspectId) return;

    if (!editedPhoneValidation.isValid) {
      alert(`Format de téléphone invalide : ${editedPhoneValidation.errorMsg}`);
      return;
    }

    setProspects(prev => prev.map(p => {
      if (p.id === viewingProspectId) {
        return {
          ...p,
          description: editedNote,
          statut: editedStatus,
          telephone: editedPhone,
          prixCible: editedPrice,
          montantFacture: editedStatus === 'Client' ? editedMontantFacture : p.montantFacture
        };
      }
      return p;
    }));
    setEditModeInModal(false);
    // update current selected as well
    if (selectedProspectId === viewingProspectId) {
      const match = prospects.find(pr => pr.id === viewingProspectId);
      if (match) {
        setTempGeneratedMessage(match.messageEnvoye || '');
      }
    }
  };

  return (
    <div id="yondy-container" className="min-h-screen bg-[#F7F4EE] font-sans text-[#1A1A18] flex flex-col antialiased">

      {/* HEADER SECTION WITH OBJECTIVE BAR AND CORE METRICS */}
      <header className="bg-[#0B3D2E] text-white py-3 px-4 md:px-6 shadow-md z-30 sticky top-0">
        <div className="max-w-7xl mx-auto flex flex-row items-center justify-between gap-3">

          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 bg-[#E0633B] text-white rounded-lg flex items-center justify-center shadow-md shrink-0">
              <span className="font-serif font-extrabold text-xl tracking-tighter">Y</span>
            </div>
            <div className="min-w-0">
              <h1 className="font-serif text-base sm:text-xl font-bold tracking-tight text-white flex items-center gap-1.5 truncate">
                Yondy Web <span className="hidden sm:inline text-[9px] px-1.5 py-0.5 bg-white/10 rounded font-sans tracking-widest uppercase font-medium">Prospection</span>
              </h1>
              <p className="hidden sm:block text-[9px] text-white/60 uppercase tracking-widest font-mono truncate">
                Port-au-Prince · Haïti 🇭🇹
              </p>
            </div>
          </div>

          {/* Compact stats + progress — desktop shows more detail */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Progress bar — hidden on very small screens */}
            <div className="hidden sm:flex flex-col w-36">
              <div className="flex items-center justify-between text-[10px] mb-1 font-semibold text-white/80">
                <span>🎯 Objectif</span>
                <span className="font-mono bg-[#E0633B]/30 px-1 py-0.5 rounded">{stats.sentToday}/20</span>
              </div>
              <div className="w-full h-2 bg-black/30 rounded-full overflow-hidden">
                <div className="bg-[#E0633B] h-full transition-all duration-500 rounded-full" style={{ width: `${Math.min((stats.sentToday / 20) * 100, 100)}%` }}></div>
              </div>
            </div>

            {/* KPI grid — 2x2 on mobile, inline on desktop */}
            <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 sm:gap-5">
              {/* Mobile: objectif pill */}
              <div className="sm:hidden col-span-2 flex items-center justify-between bg-black/20 rounded-lg px-2.5 py-1.5">
                <span className="text-[10px] font-bold text-white/80">🎯 {stats.sentToday}/20</span>
                <div className="w-20 h-1.5 bg-black/30 rounded-full overflow-hidden ml-2">
                  <div className="bg-[#E0633B] h-full rounded-full" style={{ width: `${Math.min((stats.sentToday / 20) * 100, 100)}%` }}></div>
                </div>
              </div>
              <div className="text-left">
                <p className="text-[9px] uppercase text-white/50 font-bold tracking-wider">Prospects</p>
                <p className="text-base sm:text-lg font-bold leading-none font-serif text-[#E0633B]">{stats.total}</p>
              </div>
              <div className="text-left">
                <p className="text-[9px] uppercase text-white/50 font-bold tracking-wider">Réponse</p>
                {stats.isSignificant ? (
                  <p className="text-base sm:text-lg font-bold leading-none font-serif text-emerald-400">{stats.responseRate}%</p>
                ) : (
                  <p className="text-base sm:text-lg font-bold leading-none font-serif text-amber-400">N/A</p>
                )}
              </div>
              <div className="text-left">
                <p className="text-[9px] uppercase text-white/50 font-bold tracking-wider">Clients</p>
                <p className="text-base sm:text-lg font-bold leading-none font-serif text-emerald-300">{stats.conversionCount}</p>
              </div>
              <div className="text-left">
                <p className="text-[9px] uppercase text-white/50 font-bold tracking-wider">Revenu</p>
                <p className="text-base sm:text-lg font-bold leading-none font-serif text-amber-300">${stats.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </div>

          </div>

          {/* 3 TABS NAVIGATION */}
          <nav className="flex items-center bg-black/20 p-1 rounded-lg w-full mt-3">
            <button 
              onClick={() => setActiveTab('prospection')}
              className={`flex-1 py-2 px-1 text-[11px] sm:text-sm font-bold rounded-md transition-all text-center ${activeTab === 'prospection' ? 'bg-[#E0633B] text-white shadow-md' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
            >
              🚀 <span className="hidden xs:inline">Prospection</span><span className="xs:hidden">Prosp.</span>
            </button>
            <button 
              onClick={() => setActiveTab('suivi')}
              className={`flex-1 py-2 px-1 text-[11px] sm:text-sm font-bold rounded-md transition-all text-center ${activeTab === 'suivi' ? 'bg-[#E0633B] text-white shadow-md' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
            >
              📋 Suivi
            </button>
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`flex-1 py-2 px-1 text-[11px] sm:text-sm font-bold rounded-md transition-all text-center ${activeTab === 'dashboard' ? 'bg-[#E0633B] text-white shadow-md' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
            >
              📊 <span className="hidden xs:inline">Tableau de bord</span><span className="xs:hidden">Bord</span>
            </button>
          </nav>

        </header>

      {activeTab === 'prospection' && (<>
        {/* MOTIVATIONAL BANNER BASED ON DAILY OBJECTIVES & STATISTICAL SIGNIFICANCE WARNING */}
      <div className="w-full max-w-7xl mx-auto px-4 lg:px-6 pt-5 flex flex-col gap-4">
        {!stats.isSignificant && (
          <div className="bg-amber-50 border-l-4 border-amber-500 rounded-r-xl p-3.5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0">📊</span>
              <div>
                <h4 className="font-bold text-xs text-amber-900 flex items-center gap-1.5">
                  Échantillon de suivi réduit ({stats.contactedCount} / 21 prospects contactés)
                </h4>
                <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed font-medium">
                  Le <strong>Taux de réponse</strong> officiel n'est pas affiché car le volume de test est trop faible pour être statistiquement significatif. Vous devez contacter encore au moins <strong>{Math.max(1, 21 - stats.contactedCount)} prospect(s)</strong> pour stabiliser cet indicateur clé.
                </p>
              </div>
            </div>
            <div className="text-[10px] bg-amber-100 font-bold text-amber-800 px-2 py-1 rounded shrink-0 self-start sm:self-auto border border-amber-200">
              Taux estimé brut : {stats.rawResponseRate}%
            </div>
          </div>
        )}

        {stats.sentToday >= 20 ? (
          <div className="bg-gradient-to-r from-emerald-800 to-teal-950 text-white rounded-xl shadow-lg p-4 border border-emerald-600/30 flex flex-col md:flex-row items-center justify-between gap-3 animate-pulse">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏆</span>
              <div>
                <h4 className="font-serif font-bold text-sm">Objectif ultime du jour atteint (20/20) !</h4>
                <p className="text-[11px] text-emerald-200 mt-0.5">Magnifique travail aujourd'hui, champion ! Es-tu prêt à passer aux relance-clients ou deviner de nouveaux sommets en Pétion-Ville ?</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-white/10 hover:bg-white/20 text-xs font-bold rounded-lg cursor-pointer select-none">
              Passer aux relances
            </span>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200/80 shadow-xs p-3.5 flex items-center gap-3">
            <span className="text-lg">🎯</span>
            <div className="flex-1">
              <p className="text-xs font-semibold text-gray-800">
                {stats.sentToday === 0 && "🚀 Journée fraîche ! Prêt à propulser Yondy Web ? Trouve tes cibles sur Maps ou Instagram et commence à générer des approches personnalisées !"}
                {stats.sentToday > 0 && stats.sentToday < 10 && `👍 Bon départ ! Continue sur cette lancée, chaque message personnalisé te rapproche d'un nouveau contrat ! (${stats.sentToday}/20)`}
                {stats.sentToday >= 10 && stats.sentToday < 20 && `⚡ Tu as fait plus de la moitié du chemin ! Encore quelques envois pour valider ton quota du jour ! (${stats.sentToday}/20)`}
              </p>
              <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                <div
                  className="bg-emerald-600 h-full transition-all duration-300"
                  style={{ width: `${(stats.sentToday / 20) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>
      </>)}

      {/* DETAILED CONTENT AREA */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 lg:p-6 items-start flex flex-col gap-6">

        {/* LEFT COLUMN: 5 Columns width - NEW PROSPECT & IA GENERATION */}
        {activeTab === 'prospection' && (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-7xl mx-auto">

          {/* SECTION 1: FORMULAIRE NOUVEAU PROSPECT */}
          <div className="bg-white rounded-xl border border-gray-200/80 shadow-md p-5 relative overflow-hidden transition-all">

            {successAnimation && (
              <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-xs flex items-center justify-center z-20 animate-fade-in">
                <div className="bg-white p-4 rounded-lg shadow-xl text-center border-2 border-emerald-500 max-w-xs">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Check className="w-6 h-6 stroke-[3px]" />
                  </div>
                  <h3 className="font-bold text-[#0B3D2E]">Enregistré !</h3>
                  <p className="text-xs text-gray-600 mt-1">Nouveau prospect ajouté avec succès dans l'annuaire de suivi Yondy Web.</p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <h2 className="font-serif text-lg font-bold text-[#0B3D2E] flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-[#E0633B]" />
                Nouveau Prospect
              </h2>
              {entryMode === 'smart' ? (
                <span className="text-[10px] uppercase font-mono tracking-wider font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md animate-pulse">
                  🤖 Mode intelligent
                </span>
              ) : (
                <span className="text-[10px] uppercase font-mono tracking-wider font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md">
                  ✍️ Saisie de revue
                </span>
              )}
            </div>

            {/* Smart Dual Tabs */}
            <div className="flex border-b border-gray-100 mb-4 bg-[#F7F4EE] p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setEntryMode('smart')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${entryMode === 'smart' ? 'bg-[#0B3D2E] text-white shadow-sm' : 'text-gray-500 hover:text-gray-950'}`}
              >
                ⚡ Collage Automatique IA
              </button>
              <button
                type="button"
                onClick={() => setEntryMode('manual')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${entryMode === 'manual' ? 'bg-[#0B3D2E] text-white shadow-sm' : 'text-gray-500 hover:text-gray-950'}`}
              >
                ✍️ Saisie Manuelle / Revue
              </button>
            </div>

            {entryMode === 'smart' ? (
              <div className="space-y-4">
                <div className="p-3 bg-[#F7F4EE]/65 rounded-lg border border-[#0B3D2E]/10">
                  <p className="text-xs text-gray-700 leading-relaxed">
                    💡 **Pas besoin de taper !** Copiez et collez simplement les infos brutes de l'entreprise (trouvées sur Google Maps, de sa bio Instagram, ou d'un annuaire) dans la case ci-dessous. Notre intelligence artificielle va automatiquement extraire toutes les données en 2 secondes.
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Coller le texte brut récolté pour l'entreprise
                  </label>
                  <textarea
                    rows={8}
                    placeholder="Exemple : 
Pharmacie du Centre
Note Google : 4.5 * (67 commentaires)
Pharmacie de référence ouverte 24/7 au carrefour Delmas 32.
Téléphone : +509 3744-2233
Lun-Dim : 08:00 AM - 10:00 PM"
                    value={rawPasteText}
                    onChange={(e) => setRawPasteText(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-[#1A1A18] font-sans focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20 focus:border-[#0B3D2E] transition-all resize-none h-[220px]"
                  />
                </div>

                {analysisError && (
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200 text-xs text-red-700">
                    <p className="font-bold">⚠️ Erreur d'analyse :</p>
                    <p className="mt-1">{analysisError}</p>
                  </div>
                )}

                <button
                  type="button"
                  disabled={isAnalyzing || !rawPasteText.trim()}
                  onClick={handleExtractRawText}
                  className="w-full py-3 bg-[#E0633B] text-white font-serif font-bold text-sm tracking-wide rounded-lg hover:bg-amber-700 transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-4.5 h-4.5 text-emerald-400 animate-spin" />
                      <span>Analyse et extraction magique en cours...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4.5 h-4.5 text-amber-200 fill-amber-200" />
                      <span>Analyser & Extraire les données</span>
                    </>
                  )}
                </button>

                <p className="text-[10px] text-gray-400 text-center leading-relaxed font-mono">
                  Gemini détectera : Nom, Secteur, Téléphone, Quartier, Note Google, Avis, Horaires, Forfait cible.
                </p>
              </div>
            ) : (
              <form onSubmit={handleCreateProspect} className="space-y-4">

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                    Nom de l'entreprise <span className="text-[#E0633B] font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Pharmacie de Pétion-Ville, Clinique Saint-Damien..."
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20 focus:border-[#0B3D2E] transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                      Secteur d'activité
                    </label>
                    <select
                      value={secteur}
                      onChange={(e) => setSecteur(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20 focus:border-[#0B3D2E] transition-all"
                    >
                      {SECTEURS.map((sec, idx) => (
                        <option key={idx} value={sec}>{sec}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                      Téléphone <span className="text-[#E0633B] font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: +509 3744-2233"
                      value={telephone}
                      onChange={(e) => setTelephone(e.target.value)}
                      className={`w-full px-3 py-2 bg-gray-50 border rounded-lg font-mono text-sm focus:outline-none focus:ring-2 transition-all ${telephone === '+509 ' || telephone.trim() === ''
                        ? 'border-gray-200 focus:ring-[#0B3D2E]/20 focus:border-[#0B3D2E]'
                        : phoneValidation.isValid
                          ? 'border-emerald-500 focus:ring-emerald-500/20 focus:border-emerald-500'
                          : 'border-red-400 focus:ring-red-500/20 focus:border-red-500'
                        }`}
                    />
                    {telephone.trim() !== '' && telephone !== '+509 ' && (
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-left">
                        {phoneValidation.isValid ? (
                          <>
                            <span className="text-emerald-700 bg-emerald-50 font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 border border-emerald-100">
                              ✓ Format Haïtien Valide
                            </span>
                            {phoneValidation.network && (
                              <span className="text-sky-800 bg-sky-50 font-bold px-1.5 py-0.5 rounded border border-sky-100">
                                Réseau: {phoneValidation.network}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-red-600 bg-red-50 font-medium px-1.5 py-0.5 rounded border border-red-100">
                            ⚠️ {phoneValidation.errorMsg}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                </div>

                {/* Conditional sector details */}
                {secteur === 'Autre' && (
                  <div className="animate-fade-in">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                      Spécifier le secteur
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Agence de voyage, Garage..."
                      value={autreSecteur}
                      onChange={(e) => setAutreSecteur(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20 focus:border-[#0B3D2E] transition-all"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                      Adresse ou quartier
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Pétion-Ville, Delmas 41, etc."
                      value={adresse}
                      onChange={(e) => setAdresse(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                      Forfait cible visé (USD)
                    </label>
                    <input
                      type="number"
                      min={100}
                      step={50}
                      placeholder="300"
                      value={prixCible}
                      onChange={(e) => setPrixCible(parseInt(e.target.value) || 300)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Description context block */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                    Description / Infos copiées (Google Maps / Instagram bio)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Collez ici les infos brutes : horaires, types de plats, commentaires, produits vendus..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20 focus:border-[#0B3D2E] transition-all resize-y"
                  ></textarea>
                </div>

                {/* Optional metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-tight text-gray-400 mb-0.5">
                      Note Google Map
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      step={0.1}
                      placeholder="Ex: 4.5"
                      value={noteGoogle}
                      onChange={(e) => setNoteGoogle(e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-gray-200 rounded text-xs text-center font-mono focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase tracking-tight text-gray-400 mb-0.5">
                      Nombre d'avis
                    </label>
                    <input
                      type="number"
                      placeholder="Ex: 12"
                      value={avis}
                      onChange={(e) => setAvis(e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-gray-200 rounded text-xs text-center font-mono focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[9px] font-bold uppercase tracking-tight text-gray-400 mb-0.5">
                      Horaires d'ouverture
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Lun-Ven 8h-18h"
                      value={horaires}
                      onChange={(e) => setHoraires(e.target.value)}
                      className="w-full px-2 py-1 bg-white border border-gray-200 rounded text-xs text-center focus:outline-none"
                    />
                  </div>
                </div>

                {/* Source & dynamic autocomplete values */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                      Source de découverte
                    </label>
                    <select
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none"
                    >
                      {SOURCES.map((src, idx) => (
                        <option key={idx} value={src}>{src}</option>
                      ))}
                    </select>
                  </div>
                  {source === 'Autre' ? (
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                        Préciser la source
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Recommandation..."
                        value={autreSource}
                        onChange={(e) => setAutreSource(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                        Action requise
                      </label>
                      <button
                        type="submit"
                        className="w-full py-2 bg-[#0B3D2E] text-white font-serif font-bold text-sm tracking-wide rounded-lg hover:bg-emerald-950 transition-colors shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4 text-emerald-400" />
                        Ajouter au Tableau
                      </button>
                    </div>
                  )}
                </div>

                {source === 'Autre' && (
                  <button
                    type="submit"
                    className="w-full mt-2 py-2 bg-[#0B3D2E] text-white font-serif font-bold text-sm tracking-wide rounded-lg hover:bg-emerald-950 transition-colors shadow-sm font-serif"
                  >
                    Ajouter au Tableau
                  </button>
                )}

              </form>
            )}
          </div>

          {/* SECTION 2 & 3: GENERATION PAR IA ET ENVOI WHATSAPP */}
          <div className="bg-white rounded-xl border border-gray-200/80 shadow-md p-5 flex flex-col">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3 mb-3">
              <div className="flex flex-col text-left">
                <h2 className="font-serif text-lg font-bold text-[#0B3D2E] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  Génération du Message
                </h2>
                {activeSelectedProspect ? (
                  <p className="text-xs text-[#E0633B] mt-0.5 font-bold">
                    Cible : {activeSelectedProspect.nom}
                  </p>
                ) : (
                  <p className="text-xs text-gray-400">Sélectionnez un prospect dans le tableau</p>
                )}
              </div>

              {/* Option langue */}
              <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg border w-full sm:w-auto justify-between sm:justify-start shrink-0">
                <button
                  onClick={() => setChosenLanguage('bilingual')}
                  className={`flex-1 sm:flex-none text-[9px] font-bold px-2 py-1.5 rounded transition-all cursor-pointer whitespace-nowrap ${chosenLanguage === 'bilingual' ? 'bg-[#0B3D2E] text-white shadow-xs' : 'text-gray-500 hover:text-gray-900'}`}
                  title="Créole d'abord puis Français mélangé"
                >
                  Mélangé 🇭🇹+🇫🇷
                </button>
                <button
                  onClick={() => setChosenLanguage('creole')}
                  className={`flex-1 sm:flex-none text-[9px] font-bold px-2 py-1.5 rounded transition-all cursor-pointer whitespace-nowrap ${chosenLanguage === 'creole' ? 'bg-[#0B3D2E] text-white shadow-xs' : 'text-gray-500 hover:text-gray-900'}`}
                  title="Créole haïtien uniquement"
                >
                  Kreyòl 🇭🇹
                </button>
                <button
                  onClick={() => setChosenLanguage('french')}
                  className={`flex-1 sm:flex-none text-[9px] font-bold px-2 py-1.5 rounded transition-all cursor-pointer whitespace-nowrap ${chosenLanguage === 'french' ? 'bg-[#0B3D2E] text-white shadow-xs' : 'text-gray-500 hover:text-gray-900'}`}
                  title="Français uniquement"
                >
                  Français 🇫🇷
                </button>
              </div>
            </div>

            {/* Error box */}
            {generationError && (
              <div className="mb-3 p-3 bg-red-50 rounded-lg border border-red-200 text-xs text-red-700">
                <p className="font-bold">⚠️ Échec de la génération :</p>
                <p className="mt-1">{generationError}</p>
              </div>
            )}

            {/* Professional-Yet-Local Toggle Selector */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-left">
              <div>
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="text-emerald-600">🎯</span> Mode « Pro & Local »
                </h4>
                <p className="text-[10px] text-slate-500 mt-1 leading-normal max-w-sm">
                  Active des arguments axés sur le business (ex: éviter de perdre des clients) et évite le jargon informatique comme <em>"ultra-rapide"</em>.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none shrink-0 self-start sm:self-center">
                <input
                  type="checkbox"
                  checked={professionalYetLocal}
                  onChange={(e) => setProfessionalYetLocal(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0B3D2E]"></div>
                <span className="ml-2 text-xs font-bold text-slate-700">
                  {professionalYetLocal ? "Actif" : "Inactif"}
                </span>
              </label>
            </div>

            {/* Generator Action */}
            <div className="mb-4">
              <button
                type="button"
                disabled={isGenerating || !activeSelectedProspect}
                onClick={handleGenerateMessage}
                className="w-full py-2.5 bg-emerald-50 text-[#0B3D2E] border-2 border-[#0B3D2E]/20 hover:border-[#0B3D2E] font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-emerald-100/50 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 text-[#0B3D2E] animate-spin" />
                    <span>Calcul de l'approche personnalisée par l'IA...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-700" />
                    <span>Générer le message pour {activeSelectedProspect ? activeSelectedProspect.nom : "..."}</span>
                  </>
                )}
              </button>
            </div>

            {/* MESSAGE ZONE TEXTAREA (EDITABLE) */}
            <div className="flex-1 min-h-[180px] flex flex-col">
              <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
                <span>Message rédigé (Éditable) :</span>
                {tempGeneratedMessage && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase">
                    Prêt pour WhatsApp
                  </span>
                )}
              </div>

              <textarea
                disabled={!activeSelectedProspect}
                placeholder="Rédigez ou générez un message avec l'IA. Vous pouvez éditer librement le texte généré ci-dessous avant de l'envoyer sur WhatsApp."
                value={tempGeneratedMessage}
                onChange={(e) => {
                  setTempGeneratedMessage(e.target.value);
                  // sync message in current state
                  if (activeSelectedProspect) {
                    setProspects(prev => prev.map(p => {
                      if (p.id === activeSelectedProspect.id) {
                        return { ...p, messageEnvoye: e.target.value };
                      }
                      return p;
                    }));
                  }
                }}
                className="w-full flex-1 p-3 bg-[#F7F4EE] border border-gray-200 rounded-lg text-sm leading-relaxed text-[#1A1A18] font-sans focus:outline-none focus:ring-1 focus:ring-[#0B3D2E] resize-none h-[200px]"
              />
            </div>

            {/* ACTION DIRECTIVES: WHATSAPP TRIGGER & SAVE MESSAGE */}
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleSaveToWinningMessages}
                disabled={!tempGeneratedMessage.trim()}
                title="Sauvegarder ce message performant dans la bibliothèque"
                className="py-2.5 px-3 bg-gray-100 hover:bg-gray-200/80 text-gray-700 text-xs font-bold rounded-lg border border-gray-300 transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Bookmark className="w-4 h-4 text-gray-600" />
                Sauver comme Gagnant
              </button>

              <button
                type="button"
                onClick={handleSendWhatsApp}
                disabled={!activeSelectedProspect || !tempGeneratedMessage}
                style={{ backgroundColor: '#E0633B' }}
                className="py-2.5 px-3 text-white text-xs font-bold rounded-lg hover:brightness-110 active:scale-95 shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4 text-white" />
                ENVOYER SUR WHATSAPP
              </button>
            </div>

            <p className="text-[10px] text-gray-400 mt-2.5 text-center">
              L'envoi WhatsApp nettoie automatiquement le numéro (ajoute +509) et marque le prospect comme "Contacté" dans l'historique de suivi.
            </p>

          </div>

        </section>
        )}

        {/* RIGHT COLUMN: 7 Columns width - TRACKING TABLE, STATISTICS, WINNING TEMPLATES LIBRARY */}
        <section className="flex flex-col gap-6 w-full">

          {activeTab === 'dashboard' && (<>
          {/* CHART: EVOLUTION DES PROSPECTS CONTACTES */}
          <div className="bg-white rounded-xl border border-gray-200/80 shadow-md p-4 flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-3 mb-4 gap-2">
              <div>
                <h3 className="font-serif text-sm font-bold text-[#0B3D2E] flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-[#E0633B]" />
                  Activité de Prospection (7 derniers jours)
                </h3>
                <p className="text-[10px] text-gray-500 mt-0.5 font-medium">
                  Évolution du nombre de prospects contactés par jour
                </p>
              </div>
              <div className="flex items-center gap-1 self-start sm:self-auto bg-[#F7F4EE] p-0.5 rounded-lg border border-gray-200/50">
                <button
                  type="button"
                  onClick={() => setChartType('area')}
                  className={`px-2.5 py-1 text-[9px] font-bold rounded-md transition-all cursor-pointer ${chartType === 'area' ? 'bg-[#0B3D2E] text-white shadow-xs' : 'text-gray-500 hover:text-gray-800'}`}
                >
                  Courbe
                </button>
                <button
                  type="button"
                  onClick={() => setChartType('bar')}
                  className={`px-2.5 py-1 text-[9px] font-bold rounded-md transition-all cursor-pointer ${chartType === 'bar' ? 'bg-[#0B3D2E] text-white shadow-xs' : 'text-gray-500 hover:text-gray-800'}`}
                >
                  Histogramme
                </button>
              </div>
            </div>

            <div className="w-full h-[160px] text-[10px]">
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'area' ? (
                  <AreaChart data={last7DaysData} margin={{ top: 5, right: 10, left: -32, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorProspects" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0B3D2E" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#0B3D2E" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 9, fill: '#64748B', fontWeight: 500 }}
                      tickLine={false}
                      axisLine={{ stroke: '#E2E8F0' }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 9, fill: '#64748B', fontWeight: 500 }}
                      tickLine={false}
                      axisLine={{ stroke: '#E2E8F0' }}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                    />
                    <Area
                      type="monotone"
                      dataKey="Prospects"
                      stroke="#0B3D2E"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorProspects)"
                      activeDot={{ r: 4.5, fill: '#E0633B', stroke: '#FFF', strokeWidth: 1.5 }}
                    />
                  </AreaChart>
                ) : (
                  <BarChart data={last7DaysData} margin={{ top: 5, right: 10, left: -32, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 9, fill: '#64748B', fontWeight: 500 }}
                      tickLine={false}
                      axisLine={{ stroke: '#E2E8F0' }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 9, fill: '#64748B', fontWeight: 500 }}
                      tickLine={false}
                      axisLine={{ stroke: '#E2E8F0' }}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                    />
                    <Bar
                      dataKey="Prospects"
                      fill="#0B3D2E"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={32}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* FINANCIAL PERFORMANCE & PROFITABILITY DASHBOARD */}
          <div className="bg-white rounded-xl border border-gray-200/80 shadow-md p-5 flex flex-col gap-5 text-left">
            <div className="border-b border-gray-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-left">
              <div className="text-left">
                <h3 className="font-serif text-sm font-bold text-[#0B3D2E] flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600 bg-emerald-50 p-1 rounded-full border border-emerald-100" />
                  Performances Financières & Rentabilité
                </h3>
                <p className="text-[10px] text-gray-500 mt-0.5">
                  Analyse de la valeur générée par rapport aux actions de démarchage et canaux d'accroche.
                </p>
              </div>
              <div className="bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-lg text-left self-start sm:self-auto shrink-0">
                <span className="text-[9px] text-emerald-800 uppercase font-black tracking-wider block">Chiffre d'Affaires</span>
                <span className="text-sm font-bold text-emerald-950 font-serif">${stats.totalRevenue.toLocaleString()} USD</span>
              </div>
            </div>

            {/* KEY METRICS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-left">

              {/* Valeur Moyenne par Client */}
              <div className="bg-[#F7F4EE] p-4 rounded-xl border border-gray-200/50 text-left flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block">Panier Moyen Client</span>
                  <p className="text-xl font-serif font-bold text-[#E0633B] mt-1">
                    ${stats.averageClientValue.toLocaleString()} <span className="text-xs font-sans text-gray-500 font-medium">USD</span>
                  </p>
                </div>
                <p className="text-[10px] text-gray-500 mt-2.5 leading-relaxed font-semibold">
                  Valeur contractuelle moyenne générée sur les {stats.conversionCount} clients convertis à ce jour.
                </p>
              </div>

              {/* Taux de Conversion en Valeur */}
              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 text-left flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-emerald-800 uppercase font-bold tracking-wider block">Conv. en Valeur</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-serif font-bold text-emerald-700">
                      {stats.conversionValueRate}%
                    </span>
                    <span className="text-[10px] text-gray-400 font-semibold font-mono">
                      (en valeur $)
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-emerald-100 rounded-full overflow-hidden mt-1.5">
                    <div className="bg-emerald-600 h-full transition-all duration-500" style={{ width: `${Math.min(stats.conversionValueRate, 100)}%` }}></div>
                  </div>
                </div>
                <p className="text-[10px] text-emerald-850 mt-2 font-medium">
                  <span className="font-bold text-emerald-950">${stats.totalRevenue.toLocaleString()} USD</span> facturés sur <span className="font-bold text-emerald-950">${stats.totalCibleContacted.toLocaleString()} USD</span> de potentiel identifié (contacté).
                </p>
              </div>

              {/* Taux en Nombre vs Valeur Comparatif */}
              <div className="bg-slate-50 p-4 rounded-xl border border-gray-100 text-left flex flex-col justify-between sm:col-span-2 lg:col-span-1">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block">Efficacité Relative</span>
                  <div className="grid grid-cols-2 gap-2 mt-1.5">
                    <div className="bg-white p-2 rounded-lg border border-gray-100 text-left flex flex-col justify-between">
                      <div>
                        <span className="text-[8px] text-gray-400 font-bold block uppercase">En Nombre</span>
                        <span className="text-xs font-bold text-gray-700 font-serif">
                          {stats.contactedCount > 0 ? Math.round((stats.conversionCount / stats.contactedCount) * 1000) / 10 : 0}%
                        </span>
                        <span className="block text-[8px] text-gray-400 font-mono mt-0.5">{stats.conversionCount} / {stats.contactedCount} cont.</span>
                      </div>
                      <span className="block text-[7.5px] text-gray-400 font-medium leading-none mt-1.5">(part des prospects convertis)</span>
                    </div>
                    <div className="bg-white p-2 text-left rounded-lg border border-gray-100 flex flex-col justify-between">
                      <div>
                        <span className="text-[8px] text-emerald-600 font-bold block uppercase">En Valeur</span>
                        <span className="text-xs font-bold text-emerald-700 font-serif">
                          {stats.conversionValueRate}%
                        </span>
                        <span className="block text-[8px] text-gray-400 font-mono mt-0.5">${stats.totalRevenue} / ${stats.totalCibleContacted}</span>
                      </div>
                      <span className="block text-[7.5px] text-emerald-600/80 font-medium leading-none mt-1.5">(part de la valeur capturée)</span>
                    </div>
                  </div>
                </div>
                <p className="text-[9.5px] text-gray-500 mt-2.5 leading-tight font-sans">
                  💡 {stats.conversionValueRate > (stats.contactedCount > 0 ? (stats.conversionCount / stats.contactedCount) * 100 : 0)
                    ? "Optimal ! Vos contrats hauts de gamme convertissent mieux."
                    : "Améliorez vos prix d'accroche pour faire monter le taux en valeur."}
                </p>
              </div>

            </div>

            {/* REVENUE BREAKDOWN GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-1 text-left">

              {/* Revenu par Source */}
              <div className="border border-gray-100 bg-slate-50/50 p-4 rounded-xl flex flex-col text-left">
                <div className="border-b border-gray-200 pb-1.5 mb-2.5">
                  <h4 className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center justify-between">
                    <span>📍 Revenu réel par Source</span>
                    <span className="text-[9px] text-gray-400 lowercase font-medium">Revenu cumulé</span>
                  </h4>
                </div>
                <div className="space-y-3 flex-1 flex flex-col justify-start">
                  {displayedSources.map((src) => {
                    const revenue = stats.revenueBySource[src] || 0;
                    const clientsCount = stats.countBySourceStatusClient[src] || 0;
                    const pct = stats.totalRevenue > 0 ? (revenue / stats.totalRevenue) * 100 : 0;

                    return (
                      <div key={src} className="text-left">
                        <div className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-1">
                          <span className="truncate max-w-[170px]" title={src}>{src}</span>
                          <div className="flex items-center gap-1.5 shrink-0 font-mono">
                            <span className="text-emerald-700 font-extrabold">${revenue}</span>
                            <span className="text-[9px] text-gray-400 font-normal">({clientsCount} client{clientsCount > 1 ? 's' : ''})</span>
                          </div>
                        </div>
                        {/* Progress custom bar */}
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden relative">
                          <div
                            className="bg-emerald-600 h-full transition-all duration-500 rounded-full"
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Revenu par Secteur */}
              <div className="border border-gray-100 bg-slate-50/50 p-4 rounded-xl flex flex-col text-left">
                <div className="border-b border-gray-200 pb-1.5 mb-2.5">
                  <h4 className="text-[11px] font-bold text-gray-700 uppercase tracking-wider flex items-center justify-between">
                    <span>🏢 Revenu réel par Secteur d'activité</span>
                    <span className="text-[9px] text-gray-400 lowercase font-medium">Ciblage industriel</span>
                  </h4>
                </div>
                <div className="space-y-3 flex-1 flex flex-col justify-start">
                  {displayedSecteurs.map((sec) => {
                    const revenue = stats.revenueBySecteur[sec] || 0;
                    const clientsCount = stats.countBySecteurStatusClient[sec] || 0;
                    const pct = stats.totalRevenue > 0 ? (revenue / stats.totalRevenue) * 100 : 0;

                    return (
                      <div key={sec} className="text-left">
                        <div className="flex items-center justify-between text-xs font-semibold text-[#1a1a18] mb-1">
                          <span>{sec}</span>
                          <div className="flex items-center gap-1.5 shrink-0 font-mono">
                            <span className="text-[#E0633B] font-extrabold">${revenue}</span>
                            <span className="text-[9px] text-gray-400 font-normal">({clientsCount} client{clientsCount > 1 ? 's' : ''})</span>
                          </div>
                        </div>
                        {/* Progress custom bar */}
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden relative">
                          <div
                            className="bg-[#E0633B] h-full transition-all duration-500 rounded-full"
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>

          </>)}

          {activeTab === 'suivi' && (<>
          {/* SECTION 4: TABLEAU DE SUIVI DES PROSPECTS */}
          <div className="bg-white rounded-xl border border-gray-200/80 shadow-md flex-1 flex flex-col overflow-hidden min-h-[480px]">

            {/* Table layout header and controls */}
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col gap-3">

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="font-serif text-lg font-bold text-[#0B3D2E] flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#0B3D2E]" />
                  Suivi des Prospects Yondy Web
                </h2>

                <button
                  onClick={handleExportCSV}
                  className="text-xs font-bold border border-gray-300 px-3 py-1.5 rounded-lg bg-white hover:bg-gray-50 transition-colors flex items-center gap-1.5 shadow-xs align-self-start sm:align-self-auto"
                >
                  <Download className="w-3.5 h-3.5 text-gray-600" />
                  Exporter CSV
                </button>
              </div>

              {/* Filtering bar section */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">

                {/* Search input */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
                    <Search className="h-3.5 w-3.5 text-gray-400" />
                  </span>
                  <input
                    type="text"
                    placeholder="Chercher une entreprise..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#0B3D2E] transition-all"
                  />
                </div>

                {/* Filter status dropdown */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold shrink-0">Statut:</span>
                  <select
                    value={filterStatut}
                    onChange={(e) => setFilterStatut(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-700 font-semibold focus:outline-none focus:ring-1 focus:ring-[#0B3D2E]"
                  >
                    <option value="Tous">Tous les statuts</option>
                    <option value="À contacter">À contacter</option>
                    <option value="Contacté">Contacté</option>
                    <option value="Répondu">Répondu</option>
                    <option value="Rendez-vous pris">Rendez-vous pris</option>
                    <option value="Client">Client (Converti)</option>
                    <option value="Pas intéressé">Pas intéressé</option>
                  </select>
                </div>

                {/* Filter sector dropdown */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold shrink-0">Secteur:</span>
                  <select
                    value={filterSecteur}
                    onChange={(e) => setFilterSecteur(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-gray-700 font-semibold focus:outline-none focus:ring-1 focus:ring-[#0B3D2E]"
                  >
                    <option value="Tous">Tous les secteurs</option>
                    {SECTEURS.map((sec, idx) => (
                      <option key={idx} value={sec}>{sec}</option>
                    ))}
                  </select>
                </div>

              </div>

            </div>

            {/* Prospects grid/table content list */}
            {filteredProspects.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 bg-dashed text-center">
                <SlidersHorizontal className="w-12 h-12 text-gray-300 stroke-[1.5] mb-2" />
                <p className="text-sm font-semibold text-gray-600">Aucun prospect ne correspond à vos filtres.</p>
                <p className="text-xs text-gray-400 mt-1">Essayez de modifier votre recherche ou ajoutez un nouveau prospect.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-x-auto">
                {/* DESKTOP/TABLET TABLE VIEW */}
                <table className="hidden md:table w-full text-left border-collapse">
                  <thead className="bg-gray-100 text-[10px] uppercase font-bold tracking-wider text-gray-500 border-b sticky top-0 z-5">
                    <tr>
                      <th className="px-4 py-3">Entreprise</th>
                      <th className="px-4 py-3">Secteur</th>
                      <th className="px-4 py-3 text-center">Source</th>
                      <th className="px-4 py-3">Statut</th>
                      <th className="px-4 py-3">Dernier Contact</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {filteredProspects.map((p) => {
                      const isActive = p.id === selectedProspectId;
                      const followUp = getFollowUpStatus(p);

                      // Statut badge helper
                      const getStatutBadge = (status: Prospect['statut']) => {
                        const styleMap = {
                          "À contacter": "bg-orange-50 text-orange-700 border-orange-200",
                          "Contacté": "bg-blue-50 text-blue-700 border-blue-200",
                          "Répondu": "bg-purple-50 text-purple-700 border-purple-200",
                          "Rendez-vous pris": "bg-indigo-50 text-indigo-700 border-indigo-200",
                          "Client": "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold ring-2 ring-emerald-500/20",
                          "Pas intéressé": "bg-gray-100 text-gray-500 border-gray-200"
                        };
                        return (
                          <span className={`${styleMap[status]} px-2 py-1 text-[10px] font-bold rounded-md border uppercase tracking-wider`}>
                            {status}
                          </span>
                        );
                      };

                      // Source badge helper
                      const getSourceBadge = (src: string) => {
                        if (src === 'Google Maps') return <span className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded text-[10px] font-semibold">Maps</span>;
                        if (src === 'Instagram') return <span className="bg-pink-50 text-pink-600 px-1.5 py-0.5 rounded text-[10px] font-semibold">Insta</span>;
                        if (src.includes('Annuaire')) return <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-semibold">Annuaire</span>;
                        return <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] font-semibold">Autre</span>;
                      };

                      return (
                        <tr
                          key={p.id}
                          onClick={() => {
                            setSelectedProspectId(p.id);
                          }}
                          className={`hover:bg-slate-50 border-l-4 transition-all cursor-pointer ${isActive ? 'bg-[#0B3D2E]/5 border-l-[#0B3D2E]' : 'border-l-transparent'}`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex flex-col">
                              <span className="font-bold text-[#1A1A18] text-sm flex items-center gap-1.5">
                                {p.nom}
                                {p.noteGoogle && (
                                  <span className="text-amber-500 font-mono text-[10px] bg-amber-50 px-1.5 py-0.2 rounded flex items-center">
                                    ★ {p.noteGoogle}
                                  </span>
                                )}
                              </span>
                              <span className="text-[10px] text-gray-500 flex flex-wrap items-center gap-1 mt-0.5">
                                <span className={p.statut === 'Client' ? 'text-emerald-700 bg-emerald-50 border border-emerald-100 font-bold px-1.5 py-0.2 rounded font-mono' : 'text-[#E0633B] bg-orange-50/50 border border-orange-100 px-1.5 py-0.2 rounded font-mono'}>
                                  {p.statut === 'Client' ? `Facturé : $${(p.montantFacture !== undefined ? p.montantFacture : p.prixCible).toLocaleString()}` : `Forfait : $${p.prixCible}`} USD
                                </span>
                                <span className="text-gray-300">|</span>
                                <MapPin className="w-3 h-3 shrink-0" />
                                {p.adresse || "Non spécifié"}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-gray-600 bg-gray-100/80 px-2 py-0.5 rounded text-[11px] font-medium">{p.secteur}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {getSourceBadge(p.source)}
                          </td>
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <div className="relative inline-block">
                              <select
                                value={p.statut}
                                onChange={(e) => updateProspectStatus(p.id, e.target.value as Prospect['statut'])}
                                className="bg-transparent border-0 font-bold p-0 text-xs focus:ring-0 cursor-pointer hover:underline text-[#0B3D2E]"
                              >
                                <option value="À contacter">À contacter</option>
                                <option value="Contacté">Contacté</option>
                                <option value="Répondu">Répondu</option>
                                <option value="Rendez-vous pris">Rendez-vous pris</option>
                                <option value="Client">Client</option>
                                <option value="Pas intéressé">Pas intéressé</option>
                              </select>
                              <div className="mt-1">
                                {getStatutBadge(p.statut)}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono text-gray-500 text-[11px]">
                            {p.dateContact ? (
                              <div className="flex flex-col">
                                <span className="font-semibold text-emerald-800">{p.dateContact}</span>
                                <span className="text-[9px] text-gray-400">Ajout: {p.dateAjout}</span>
                                {followUp && (
                                  <span className={`mt-1.5 self-start px-1.5 py-0.5 rounded text-[8px] font-bold text-white uppercase tracking-wider ${followUp.type === 'overdue-7' ? 'bg-red-500 animate-pulse' : 'bg-[#E0633B]'}`}>
                                    {followUp.label}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">Jamais contacté</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenDetailedModal(p)}
                                className="px-2 py-1 text-[11px] bg-slate-100 text-gray-700 rounded-md font-semibold hover:bg-slate-200 transition-colors cursor-pointer"
                              >
                                Détails
                              </button>
                              <button
                                onClick={(e) => deleteProspect(p.id, e)}
                                title="Supprimer ce prospect"
                                className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* MOBILE ONE-HANDED INTERACTIVE CARD VIEW */}
                <div className="block md:hidden divide-y divide-gray-100 bg-white">
                  {filteredProspects.map((p) => {
                    const isActive = p.id === selectedProspectId;
                    const followUp = getFollowUpStatus(p);

                    // Statut style map
                    const getStatutColorClass = (status: Prospect['statut']) => {
                      const styleMap = {
                        "À contacter": "bg-orange-50 text-orange-700 border-orange-200",
                        "Contacté": "bg-blue-50 text-blue-700 border-blue-200",
                        "Répondu": "bg-purple-50 text-purple-700 border-purple-200",
                        "Rendez-vous pris": "bg-indigo-50 text-indigo-700 border-indigo-200",
                        "Client": "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold ring-2 ring-emerald-500/20",
                        "Pas intéressé": "bg-gray-100 text-gray-500 border-gray-200"
                      };
                      return styleMap[status] || "bg-gray-100 text-gray-500 border-gray-200";
                    };

                    // Source badge helper
                    const getSourceBadge = (src: string) => {
                      if (src === 'Google Maps') return <span className="bg-red-50 text-red-600 px-1.5 py-0.5 rounded text-[10px] font-semibold">Maps</span>;
                      if (src === 'Instagram') return <span className="bg-pink-50 text-pink-600 px-1.5 py-0.5 rounded text-[10px] font-semibold">Insta</span>;
                      if (src.includes('Annuaire')) return <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-semibold">Annuaire</span>;
                      return <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[10px] font-semibold">Autre</span>;
                    };

                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedProspectId(p.id)}
                        className={`p-4 transition-all cursor-pointer border-l-4 ${isActive ? 'bg-[#0B3D2E]/5 border-l-[#0B3D2E]' : 'border-l-transparent bg-white'}`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1">
                            <h4 className="font-bold text-[#1A1A18] text-sm flex flex-wrap items-center gap-1.5">
                              {p.nom}
                              {p.noteGoogle && (
                                <span className="text-amber-500 font-mono text-[10px] bg-amber-50 px-1.5 py-0.2 rounded flex items-center shrink-0">
                                  ★ {p.noteGoogle}
                                </span>
                              )}
                            </h4>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              <span className="text-[10px] text-gray-600 font-semibold bg-gray-100 px-1.5 py-0.5 rounded">{p.secteur}</span>
                              {getSourceBadge(p.source)}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            {p.statut === 'Client' ? (
                              <>
                                <span className="text-xs font-mono font-bold text-emerald-600">${(p.montantFacture !== undefined ? p.montantFacture : p.prixCible).toLocaleString()} USD</span>
                                <span className="block text-[8px] text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded font-black uppercase tracking-widest text-center mt-0.5">Payé</span>
                              </>
                            ) : (
                              <>
                                <span className="text-xs font-mono font-bold text-[#E0633B]">${p.prixCible || 300} USD</span>
                                <span className="block text-[8px] text-gray-400 uppercase tracking-widest font-bold">Forfait</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Location details */}
                        <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-2 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          {p.adresse || "Haïti"}
                        </p>

                        {/* Quick Interactive Toggles (Friendly Touch Targets) */}
                        <div className="mt-3 bg-gray-50 p-2 border border-gray-100 rounded-lg flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                          <div className="flex flex-col">
                            <span className="text-[8px] text-gray-400 uppercase tracking-widest font-bold">Changer Statut</span>
                            <select
                              value={p.statut}
                              onChange={(e) => updateProspectStatus(p.id, e.target.value as Prospect['statut'])}
                              className="bg-transparent border-0 font-bold p-0 text-xs focus:ring-0 text-[#0B3D2E] focus:outline-none cursor-pointer hover:underline"
                            >
                              <option value="À contacter">À contacter</option>
                              <option value="Contacté">Contacté</option>
                              <option value="Répondu">Répondu</option>
                              <option value="Rendez-vous pris">Rendez-vous pris</option>
                              <option value="Client">Client</option>
                              <option value="Pas intéressé">Pas intéressé</option>
                            </select>
                          </div>
                          <span className={`${getStatutColorClass(p.statut)} px-2 py-0.5 text-[9px] font-bold rounded-md border uppercase tracking-wider`}>
                            {p.statut}
                          </span>
                        </div>

                        {/* Date contact details and reminders */}
                        <div className="mt-3 flex items-center justify-between text-[11px]">
                          <div>
                            <span className="text-gray-400 text-[10px]">Dernier contact : </span>
                            {p.dateContact ? (
                              <span className="font-mono font-bold text-gray-700">{p.dateContact}</span>
                            ) : (
                              <span className="text-gray-400 italic">Jamais contacté</span>
                            )}
                          </div>

                          {/* Follow up alert badge */}
                          {followUp && (
                            <span className={`px-2 py-0.5 rounded text-[8px] font-bold text-white uppercase tracking-wider ${followUp.type === 'overdue-7' ? 'bg-red-500 animate-pulse' : 'bg-[#E0633B]'}`}>
                              {followUp.label}
                            </span>
                          )}
                        </div>

                        {/* Details Modal + Delete actions inside mobile wrapper */}
                        <div className="mt-3 flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleOpenDetailedModal(p)}
                            className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-gray-700 rounded-lg font-bold transition-all cursor-pointer"
                          >
                            Détails & Notes
                          </button>
                          <button
                            onClick={(e) => deleteProspect(p.id, e)}
                            className="p-1.5 text-red-500 border border-red-100 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                            title="Supprimer ce prospect"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Total count footer */}
            <div className="p-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500 flex justify-between items-center font-semibold">
              <span>Affichage de {filteredProspects.length} sur {prospects.length} prospects enregistrés</span>
              <span className="text-emerald-800 font-mono">Yondy Web Local Prospecting Database v1.2</span>
            </div>

          </div>

          {/* TWO DECORATIVE BENTO BOXES: WINNING MESSAGES LIBRARY & QUICK RELANCES TEMPLATES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">

            {/* COMPONENT 5: LIBRARY OF "MESSAGES GAGNANTS" */}
            <div className="bg-white rounded-xl border border-gray-200/80 shadow-md p-4 flex flex-col">
              <div className="flex items-center justify-between border-b pb-2 mb-3">
                <h3 className="font-serif text-sm font-bold text-[#0B3D2E] flex items-center gap-1.5">
                  <Bookmark className="w-4 h-4 text-[#E0633B]" />
                  Bibliothèque de Messages Gagnants
                </h3>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold font-mono">
                  {winningMessages.length} scripts
                </span>
              </div>

              {winningMessages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center py-6 text-center text-xs text-gray-400 italic">
                  Aucun message marqué comme "gagnant" pour l'instant. Utilisez le bouton d'enregistrement sur le formulaire de gauche !
                </div>
              ) : (
                <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
                  {winningMessages.map((w) => (
                    <div key={w.id} className="p-2.5 bg-[#F7F4EE]/60 rounded-lg border border-gray-200/60 relative group">
                      <button
                        onClick={() => handleDeleteWinningMessage(w.id)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-0.5 rounded transition-colors"
                        title="Retirer cette sauvegarde"
                      >
                        <X className="w-3 h-3" />
                      </button>

                      <div className="flex flex-col">
                        <span className="font-bold text-xs text-[#0B3D2E] pr-5">{w.titre}</span>
                        <span className="text-[9px] text-gray-400 inline-block mt-0.5">Pour : {w.prospectNom} · {w.dateSauvegarde}</span>
                      </div>

                      <p className="text-[11px] text-gray-600 mt-1.5 italic leading-relaxed line-clamp-3">
                        "{w.message}"
                      </p>

                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => {
                            setTempGeneratedMessage(w.message);
                            // Set alert simulation 
                            alert("Message chargé dans l'éditeur de prospection de gauche ! Vous pouvez l'envoyer ou le modifier.");
                          }}
                          className="text-[9px] font-bold text-[#0B3D2E] bg-white border px-2 py-0.5 rounded hover:bg-[#0B3D2E] hover:text-white transition-all flex items-center gap-1"
                        >
                          <Copy className="w-2.5 h-2.5" />
                          Utiliser ce script
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(w.message);
                            alert("Message copié dans le presse-papiers!");
                          }}
                          className="text-[9px] font-bold text-gray-500 hover:text-gray-900 flex items-center gap-0.5"
                        >
                          Copier presse-papier
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* QUICK RELANCES TEMPLATES */}
            <div className="bg-white rounded-xl border border-gray-200/80 shadow-md p-4 flex flex-col">
              <div className="flex items-center justify-between border-b pb-2 mb-3">
                <h3 className="font-serif text-sm font-bold text-[#0B3D2E] flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-[#0B3D2E]" />
                  Modèles de Relance Automatique
                </h3>
                <span className="text-[9px] uppercase font-bold text-[#E0633B]">Yondy Standard</span>
              </div>

              <div className="space-y-3 flex-1 flex flex-col justify-between">

                {/* Seed 2 relance scripts */}
                <div className="p-2.5 bg-sky-50/50 rounded-lg border border-sky-100 text-xs text-left">
                  <div className="flex justify-between items-center mb-1 bg-white/50 p-1 rounded">
                    <span className="font-bold text-sky-800 text-[11px]">Relance J+3 (Pas de réponse)</span>
                    <span className="text-[9px] bg-sky-100 text-sky-800 font-mono px-1 rounded font-bold">Urgence/Scarcity</span>
                  </div>
                  <p className="text-[11px] text-gray-600 italic leading-relaxed font-medium">
                    "Onè dezas direktè! 👋 Mwen te ekri nou sou pwopozisyon sit entènèt pou *[Entreprise]* la pou evite kliyan kòmande sou telefòn bò kote konkiran yo. Mwen gen sèlman *2 plas ki rete* pou mwa sa a nan kalandriye m. Nou ta gade sa?"
                  </p>
                  <button
                    onClick={() => {
                      if (!activeSelectedProspect) {
                        alert("Veuillez d'abord sélectionner un prospect dans le tableau pour injecter son nom.");
                        return;
                      }
                      const interpolated = `Onè dezas direktè! 👋 Mwen te ekri nou de sa twa jou sou pwopozisyon sit entènèt pou *${activeSelectedProspect.nom}* la pou evite kliyan kòmande bò kote konkiran yo. Mwen gen sèlman *2 plas ki rete* pou mwa sa a pou m lanse nouvo pwojè. Èske nou ta vle nou gade sa ansanm amikalman? Respè.`;
                      setTempGeneratedMessage(interpolated);
                    }}
                    className="mt-2 text-[10px] font-bold text-sky-800 hover:underline flex items-center gap-0.5 bg-sky-100/50 px-2 py-1 rounded cursor-pointer border border-sky-200"
                  >
                    Injecter pour {activeSelectedProspect ? activeSelectedProspect.nom : "..."}
                  </button>
                </div>

                <div className="p-2.5 bg-indigo-50/50 rounded-lg border border-indigo-100 text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-indigo-800 text-[11px]">Relance J+7 (Proposition Maquette)</span>
                    <span className="text-[9px] bg-indigo-100 text-indigo-800 font-mono px-1 rounded font-bold">Maquette</span>
                  </div>
                  <p className="text-[11px] text-gray-600 italic leading-relaxed">
                    "Respè lidè! Mwen kòmanse travay sou yon ti lide makèt sit pou *[Nom de l'entreprise]* a pou montre nou kijan l'ap parèt sou telefòn. Mwen ka voye imaj pou nou gade?"
                  </p>
                  <button
                    onClick={() => {
                      if (!activeSelectedProspect) {
                        alert("Veuillez d'abord sélectionner un prospect.");
                        return;
                      }
                      const interpolated = `Respè lidè! Mwen kòmanse prepare yon ti lide makèt sit entènèt pou *${activeSelectedProspect.nom}* a pou m montre nou kijan l'ap parèt ak fonksyone sou telefòn. Mwen ka voye premye imaj yo pou nou gade amikalman? Mèsi.`;
                      setTempGeneratedMessage(interpolated);
                    }}
                    className="mt-1.5 text-[9px] font-bold text-indigo-800 hover:underline flex items-center gap-0.5"
                  >
                    Injecter pour {activeSelectedProspect ? activeSelectedProspect.nom : "..."}
                  </button>
                </div>

                <p className="text-[10px] text-gray-400 text-center italic mt-1 bg-gray-50 py-1 rounded">
                  Cliquez sur "Injecter" pour remplacer l'éditeur de gauche par la relance ciblée.
                </p>

              </div>
            </div>

          </div>

          </>)}
        </section>

      </main>

      {/* --- DETAILED / VIEW MODAL POPUP --- */}
      {viewingProspectId && (() => {
        const p = prospects.find(x => x.id === viewingProspectId);
        if (!p) return null;

        return (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in">
            <div className="bg-white rounded-xl border-t-8 border-t-[#0B3D2E] shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden">

              {/* Modal header */}
              <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-slate-50">
                <div className="flex flex-col text-left">
                  <h3 className="font-serif text-lg font-bold text-[#0B3D2E]">{p.nom}</h3>
                  <p className="text-xs text-gray-500">Ajouté le {p.dateAjout}</p>
                </div>
                <button
                  onClick={() => setViewingProspectId(null)}
                  className="p-1 rounded-full hover:bg-gray-200 text-gray-500 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal body */}
              <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">

                {editModeInModal ? (
                  /* Edit form */
                  <div className="space-y-3 bg-slate-50 p-3 rounded-lg border">
                    <p className="text-xs font-bold text-gray-700 uppercase tracking-widest border-b pb-1 mb-2">Modifier les informations de base</p>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Téléphone Direct</label>
                      <input
                        type="text"
                        value={editedPhone}
                        onChange={(e) => setEditedPhone(e.target.value)}
                        className={`w-full px-3 py-1.5 bg-white border rounded text-xs focus:outline-none transition-all ${editedPhone.trim() === ''
                          ? 'border-gray-200'
                          : editedPhoneValidation.isValid
                            ? 'border-emerald-500'
                            : 'border-red-400'
                          }`}
                      />
                      {editedPhone.trim() !== '' && (
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-left">
                          {editedPhoneValidation.isValid ? (
                            <>
                              <span className="text-emerald-700 bg-emerald-50 font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 border border-emerald-100">
                                ✓ Format Valide
                              </span>
                              {editedPhoneValidation.network && (
                                <span className="text-sky-800 bg-sky-50 font-bold px-1.5 py-0.5 rounded border border-sky-100">
                                  {editedPhoneValidation.network}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-red-500 bg-red-50 font-medium px-1.5 py-0.5 rounded border border-red-100 block w-full whitespace-normal">
                              ⚠️ {editedPhoneValidation.errorMsg}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-500 mb-0.5">Budget Cible Visé ($ USD)</label>
                      <input
                        type="number"
                        value={editedPrice}
                        onChange={(e) => setEditedPrice(parseInt(e.target.value) || 300)}
                        className="w-full px-3 py-1.5 bg-white border rounded text-xs focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Modifier le Statut</label>
                      <select
                        value={editedStatus}
                        onChange={(e) => setEditedStatus(e.target.value as Prospect['statut'])}
                        className="w-full px-3 py-1.5 bg-white border rounded text-xs focus:outline-none"
                      >
                        <option value="À contacter">À contacter</option>
                        <option value="Contacté">Contacté</option>
                        <option value="Répondu">Répondu</option>
                        <option value="Rendez-vous pris">Rendez-vous pris</option>
                        <option value="Client">Client</option>
                        <option value="Pas intéressé">Pas intéressé</option>
                      </select>

                      {editedStatus === 'Client' && (
                        <div className="bg-emerald-50 rounded-lg p-2.5 border border-emerald-200 mt-2 text-left">
                          <label className="block text-[10px] font-bold uppercase text-emerald-800 mb-1">
                            💰 Montant facturé final ($ USD)
                          </label>
                          <input
                            type="number"
                            value={editedMontantFacture}
                            onChange={(e) => setEditedMontantFacture(parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-1.5 bg-white border border-emerald-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 font-bold text-emerald-950"
                            placeholder={`${editedPrice}`}
                          />
                          <p className="text-[9px] text-emerald-700/80 mt-1 font-sans">
                            Entrez le montant final facturé à ce client. Ce montant alimente en temps réel le revenu total et les classements de rentabilité.
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1">Description / Contexte (Google Maps & Instagram)</label>
                      <textarea
                        rows={4}
                        value={editedNote}
                        onChange={(e) => setEditedNote(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border rounded text-xs focus:outline-none"
                      />
                    </div>

                    <div className="flex gap-2 pt-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setEditModeInModal(false)}
                        className="text-xs font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg"
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveModalEdits}
                        className="text-xs font-bold text-white bg-[#0B3D2E] hover:bg-emerald-900 px-4 py-1.5 rounded-lg"
                      >
                        Enregistrer
                      </button>
                    </div>

                  </div>
                ) : (
                  /* Stats Display & view details */
                  <div className="space-y-3.5 text-left">

                    {p.statut === 'Client' && (
                      <div className="bg-emerald-600 text-white rounded-xl p-4 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
                        <div className="text-left">
                          <p className="text-[10px] uppercase font-extrabold tracking-wider text-emerald-100 flex items-center gap-1">
                            🏆 CLIENT CONVERTI !
                          </p>
                          <h4 className="font-serif text-sm font-bold mt-1">
                            Forfait validé pour {p.nom}
                          </h4>
                          <p className="text-[10px] text-emerald-100/90 mt-1 font-sans">
                            Le forfait initialement ciblé était de <span className="font-bold font-mono">${p.prixCible} USD</span>.
                          </p>
                        </div>
                        <div className="bg-white/10 px-3 py-1.5 rounded-lg border border-white/20 select-none text-right shrink-0">
                          <span className="text-[8px] uppercase font-bold text-emerald-200 block">Montant Facturé</span>
                          <span className="text-base font-extrabold text-white font-serif">
                            ${(p.montantFacture !== undefined ? p.montantFacture : p.prixCible).toLocaleString()} USD
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 bg-[#F7F4EE] p-3 rounded-lg border">
                      <div>
                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block">Secteur :</span>
                        <span className="text-sm font-bold text-[#0B3D2E]">{p.secteur}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block">Statut Actuel :</span>
                        <span className="inline-block mt-0.5 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] uppercase font-bold rounded">
                          {p.statut}
                        </span>
                      </div>
                      <div className="mt-2">
                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block">Téléphone direct :</span>
                        <span className="text-xs font-mono font-bold text-[#1A1A18] flex items-center gap-1">
                          <Phone className="w-3 h-3 text-emerald-700 inline" /> {p.telephone}
                        </span>
                      </div>
                      <div className="mt-2">
                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block">Budget Forfait Ciblé :</span>
                        <span className="text-sm font-bold text-[#E0633B]">${p.prixCible || 300} USD</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-lg border border-gray-100 space-y-1.5">
                      <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block">Renseignements de la fiche collectée :</span>
                      {p.noteGoogle && (
                        <p className="text-xs text-amber-700 font-bold flex items-center gap-1">
                          Note Google Map : ★ {p.noteGoogle}/5 ({p.avis || 0} avis clients)
                        </p>
                      )}
                      {p.horaires && (
                        <p className="text-xs text-slate-700 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span className="font-semibold">Horaires d'ouverture :</span> {p.horaires}
                        </p>
                      )}

                      <p className="text-xs text-gray-700 leading-relaxed font-sans mt-2 whitespace-pre-wrap">
                        {p.description || "Aucune description ou note de contexte ajoutée."}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block">Historique du message envoyé :</span>
                      {p.messageEnvoye ? (
                        <div className="p-3 bg-[#0B3D2E]/5 rounded-lg border border-[#0B3D2E]/10 flex flex-col justify-between">
                          <p className="text-xs text-[#1A1A18] leading-relaxed italic whitespace-pre-line">
                            "{p.messageEnvoye}"
                          </p>
                          <div className="mt-3 flex items-center justify-between border-t pt-2 border-gray-200">
                            <span className="text-[9px] text-gray-400">Date d'accroche : {p.dateContact}</span>
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedProspectId(p.id);
                                  setTempGeneratedMessage(p.messageEnvoye || '');
                                  setViewingProspectId(null);
                                  alert("Le message original a été rechargé de façon active dans l'éditeur à gauche.");
                                }}
                                className="text-[9px] font-bold text-emerald-800 bg-white hover:bg-emerald-50 px-2 py-0.5 rounded border"
                              >
                                Éditer ce message
                              </button>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(p.messageEnvoye || '');
                                  alert("Message copié !");
                                }}
                                className="text-[9px] font-bold text-gray-500 hover:text-gray-900 border px-1.5 py-0.5 rounded"
                              >
                                Copier
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs italic text-gray-400 bg-gray-50 p-2.5 rounded text-center">
                          Aucun message n'a encore été envoyé ou généré pour ce prospect.
                        </p>
                      )}
                    </div>

                    {/* Historique secondaire si présent */}
                    {p.messagesHistorique && p.messagesHistorique.length > 1 && (
                      <div className="space-y-1 mt-2">
                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">Anciennes versions d'essais :</span>
                        <div className="space-y-2 max-h-[100px] overflow-y-auto pr-1">
                          {p.messagesHistorique.slice(1).map((h, i) => (
                            <div key={i} className="p-2 bg-gray-50 rounded text-[10px] text-gray-500 italic border border-gray-100">
                              "{h.substring(0, 80)}..."
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                )}

              </div>

              {/* Modal footer */}
              <div className="p-4 sm:p-5 border-t border-gray-100 bg-slate-50 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                {!editModeInModal && (
                  <button
                    onClick={() => {
                      setEditModeInModal(true);
                    }}
                    className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    Corriger la fiche prospect
                  </button>
                )}

                <div className="flex gap-2 w-full sm:w-auto justify-end ml-auto">

                  <button
                    onClick={() => setViewingProspectId(null)}
                    className="w-full sm:w-auto px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold rounded-lg transition-colors cursor-pointer text-center"
                  >
                    Fermer
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* FOOTER ACCENTS */}
      <footer className="bg-[#1A1A18] text-white/50 text-[11px] py-4 px-6 border-t border-gray-800 text-center mt-12">
        <p className="max-w-7xl mx-auto">
          Yondy Web Prospection © 2026. Tous droits réservés. Développé pour la prospection commerciale de premier plan en Haïti.
          Pour toute assistance technique, contactez l'équipe Yondy Web à Port-au-Prince.
        </p>
      </footer>

    </div>
  );
}
