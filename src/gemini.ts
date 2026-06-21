import { Prospect } from "./App";

// Clé API OpenRouter - Injectée via GitHub Secrets
const OPENROUTER_API_KEY = (import.meta as any).env.VITE_AI_API_KEY || "";

// Modèle choisi : Llama 3.3 70B (Excellent pour la conversation, gratuit sur OpenRouter)
const OPENROUTER_MODEL = "meta-llama/llama-3.3-70b-instruct:free"; 

async function callOpenRouter(systemPrompt: string, userMessage: string, jsonMode = false): Promise<string> {
  const body: any = {
    model: OPENROUTER_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage }
    ],
    temperature: jsonMode ? 0.1 : 0.85,
  };

  if (jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://bongondydesign-dev.github.io", // Requis par OpenRouter
      "X-Title": "Yondy Web Prospection", // Requis par OpenRouter
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Erreur OpenRouter (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export async function generateMessage(
  prospect: Prospect,
  lang: string,
  professionalYetLocal: boolean
): Promise<string> {
  const { nom, secteur, adresse, description, noteGoogle, avis, horaires } = prospect;
  const isLocalMode = professionalYetLocal !== false;
  const langParam = lang === "french" ? "français" : lang === "creole" ? "créole" : "mélangé";

  const systemPrompt = `Tu es l'assistant de rédaction de messages pour Yondy Web, une petite entreprise de développement de sites web et d'applications mobiles pour des PME en Haïti (Port-au-Prince, Pétion-Ville, Delmas).

TA MISSION :
Écrire un message court pour WhatsApp qui a un seul objectif : faire répondre la personne qui le reçoit. Premier contact, pas une vente.

RÈGLES OBLIGATOIRES :
1. LONGUEUR : Maximum 3 phrases.
2. OUVERTURE : Toujours commencer par un détail SPÉCIFIQUE tiré des informations de l'entreprise. Ne jamais commencer par "Bonjour, je voudrais vous proposer un service".
3. PROBLÈME, PAS CARACTÉRISTIQUE TECHNIQUE (CRITICAL):
   ${isLocalMode ? `Évite absolument tout jargon technique. Concentre-toi EXCLUSIVEMENT sur des résultats axés sur les affaires.` : `Évite les longs blablateries techniques.`}
   Parle d'un RÉSULTAT concret lié au SECTEUR :
   - Pharmacie / clinique → clients qui ont besoin du service après la fermeture, ou commander sans se déplacer.
   - Boutique vêtements → personnes qui veulent voir la collection avant de venir.
   - Restaurant → personnes qui veulent commander pour livraison sans appeler.
   - École → parents qui veulent payer sans faire la queue.
4. L'OFFRE : Un SITE WEB qui permet d'acheter/commander/payer directement (MonCash, Natcash).
5. FIN : Une question à FRICTION BASSE (petite discussion rapide, "sans engagement").
6. TON : Respectueux mais chaleureux (comme un voisin). Utiliser "vous".
7. LANGUE : ${langParam}. Si créole: pur créole. Si français: pur français. Si mélangé: créole avec quelques mots français naturels.
8. EMOJI : Maximum 1-2 emojis classiques (👋, 📱, ✨).
9. NE JAMAIS : Inventer des infos, mettre un prix, citer un concurrent, utiliser "offre exclusive".

FORMAT DE RÉPONSE STRICT :
Répondre SEULEMENT avec le texte du message, rien d'autre.`;

  const userMessage = `DONNÉES DE L'ENTREPRISE :
Nom : ${nom}
Secteur : ${secteur || 'Non défini'}
Quartier/Adresse : ${adresse || 'Haïti'}
Description : ${description || 'Pas de description fournie'}
Note Google : ${noteGoogle ? `${noteGoogle}/5` : 'Non disponible'} (${avis || 0} avis)
Horaires : ${horaires || 'Non disponibles'}`;

  try {
    const text = await callOpenRouter(systemPrompt, userMessage, false);
    return text.trim();
  } catch (error: any) {
    console.error("OpenRouter generate error:", error);
    throw new Error(error.message || "Erreur de communication avec OpenRouter.");
  }
}

export async function extractDataFromText(rawText: string) {
  if (!rawText || !rawText.trim()) throw new Error("Texte brut obligatoire.");

  const systemPrompt = `Tu es un assistant expert en Haïti. 
Tu dois extraire les infos professionnelles au format JSON UNIQUEMENT.
1. "nom" (string)
2. "secteur" (string) : "Pharmacie", "Boutique", "Restaurant", "Clinique", "École", "Salon de beauté", "Autre".
3. "telephone" (string) : "+509 XXXX-XXXX"
4. "adresse" (string) : Quartier en Haïti
5. "description" (string) : Résumé 1-2 phrases
6. "noteGoogle" (number) : sur 5 (ex: 4.4)
7. "avis" (integer)
8. "horaires" (string)
9. "source" (string) : "Google Maps", "Instagram", "Annuaire", "Facebook", "Autre"
10. "prixCible" (integer) : Budget site web estimé en USD (250-600)

RÉPONDS UNIQUEMENT AVEC LE JSON VALIDE.`;

  try {
    const jsonString = await callOpenRouter(systemPrompt, `Texte brut:\n${rawText}`, true);
    
    // Nettoyer si l'IA a ajouté des marqueurs markdown
    let cleanJson = jsonString;
    if (cleanJson.includes("\`\`\`json")) {
      cleanJson = cleanJson.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();
    }
    
    return JSON.parse(cleanJson);
  } catch (error: any) {
    console.error("OpenRouter extract error:", error);
    throw new Error(error.message || "Erreur lors de l'analyse JSON.");
  }
}
