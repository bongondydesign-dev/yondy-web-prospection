import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize GoogleGenAI with the appropriate environment variables and headers
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API endpoint to generate personalized prospecting messages
app.post("/api/generate", async (req, res) => {
  try {
    const { prospect, lang, additionalPrompt, professionalYetLocal } = req.body;
    if (!prospect || !prospect.nom) {
      return res.status(400).json({ error: "Le nom de l'entreprise est obligatoire." });
    }

    const {
      nom,
      secteur,
      adresse,
      description,
      noteGoogle,
      avis,
      horaires,
      source,
      prixCible
    } = prospect;

    const isLocalMode = professionalYetLocal !== false; // defaulted to true

    const langParam = 
      lang === "french" 
        ? "français" 
        : lang === "creole" 
          ? "créole" 
          : "mélangé";

    const systemPrompt = `Tu es l'assistant de rédaction de messages pour Yondy Web, une petite entreprise de développement de sites web et d'applications mobiles pour des PME en Haïti (Port-au-Prince, Pétion-Ville, Delmas).

TA MISSION :
Écrire un message court pour WhatsApp qui a un seul objectif : faire répondre la personne qui le reçoit, pas la faire acheter tout de suite. C'est un premier contact, pas une vente.

RÈGLES OBLIGATOIRES :

1. LONGUEUR : Maximum 3 phrases. Si tu dépasses 3 phrases, coupe. Les gens lisent sur WhatsApp depuis leur téléphone — un message long n'est pas lu, il peut être ignoré.

2. OUVERTURE : Toujours commencer par un détail SPÉCIFIQUE tiré des informations de l'entreprise (nom de l'entreprise, type d'activité, note Google, quartier, horaires, ou un service qu'ils offrent). La façon dont tu écris ça doit montrer que tu as regardé leur fiche, que tu n'as pas envoyé le même message à tout le monde. Ne jamais commencer par une phrase générique du type "Bonjour, je voudrais vous proposer un service".

3. PROBLÈME, PAS CARACTÉRISTIQUE TECHNIQUE (CRITICAL):
   ${isLocalMode ? `Évite absolument tout jargon technique comme "site ultra-rapide", "technologie moderne", "vitesse", "vitesse de chargement" ou des caractéristiques de serveur. Concentre-toi EXCLUSIVEMENT sur des résultats axés sur les affaires, comme faire gagner du temps aux clients et éviter de perdre des clients.` : `Évite les longs blablateries techniques et met l'accent sur les solutions concrètes.`}
   Parle d'un RÉSULTAT concret lié au SECTEUR de l'entreprise :
   - Pharmacie / clinique → clients qui ont besoin du service après la fermeture, ou qui veulent commander sans se déplacer ni faire la queue.
   - Boutique vêtements/accessoires → personnes qui n'ont pas le temps de venir au magasin, ou qui veulent voir la collection avant de venir.
   - Restaurant → personnes qui veulent commander pour livraison sans devoir appeler.
   - École → parents qui veulent inscrire leurs enfants ou payer la scolarité sans faire la queue.
   Si le secteur n'est pas dans cette liste, raisonne avec la même logique : quel problème concret les clients de cette entreprise rencontrent-ils ? Comment un site web résout cela en leur faisant gagner du temps ou en améliorant l'expérience client.

4. L'OFFRE : Toujours mentionner que c'est un SITE WEB qui permet aux clients d'acheter/commander/payer directement, avec les paiements MonCash et Natcash inclus. Ne pas donner de détails techniques supplémentaires.

5. FIN DU MESSAGE : Toujours terminer par une question à FRICTION BASSE — une petite discussion rapide, un modèle gratuit à voir, "sans engagement". Ne jamais demander d'acheter ou de signer un contrat dans le premier message.

6. TON : Respectueux mais chaleureux — comme quelqu'un du même quartier qui veut aider, pas un vendeur d'agence qui fait du démarchage. Utiliser "vous" pour s'adresser à l'entreprise (respect), tout en restant simple.

7. LANGUE :
   - Si le paramètre langue est "créole" : tout le message en créole haïtien pur, sans mélanger le français.
   - Si le paramètre langue est "français" : tout le message en français, ton professionnel et poli mais chaleureux.
   - Si le paramètre langue est "mélangé" : rédige le message en créole comme base, avec quelques expressions ou mots français intégrés de façon hyper décontractée et naturelle comme les gens parlent vraiment (ne pas forcer, seulement si ça sonne naturel).
   Ne jamais mélanger trois langues ensemble dans un seul message.

8. EMOJI : Maximum 1-2 emojis classiques et ultra-compatibles dans tout le message (comme 👋, 📱, ✨, 🇭🇹), placés naturellement, sans forcer. Ne pas mettre d'emoji dans chaque phrase. Ne mets jamais d'émojis complexes ou rares (comme des seringues ou des petits logos médicaux bizarres qui s'affichent sous forme de carrés vides).

9. NE JAMAIS :
   - Inventer des informations qui ne sont pas dans la fiche de l'entreprise (ne pas dire "je vois que vous avez 200 clients" si ce n'est pas dans les données)
   - Mettre un prix ou des frais dans le premier message
   - Citer le nom d'un autre client ou d'un concurrent
   - Utiliser des mots comme "offre exclusive" ou "dernière chance" — ça sonne comme du spam

FORMAT DE RÉPONSE STRICT :
Répondre SEULEMENT avec le texte du message, rien d'autre. Ne pas mettre de titre, ne pas mettre d'explication, ne pas mettre de guillemets ou de phrase d'introduction comme "Voici le message :". Juste le texte du message brut, prêt à copier directement dans WhatsApp.

DONNÉES DE L'ENTREPRISE (remplies par l'app) :
Nom : ${nom}
Secteur : ${secteur || 'Non défini'}
Quartier/Adresse : ${adresse || 'Haïti'}
Description : ${description || 'Pas de description fournie'}
Note Google : ${noteGoogle ? `${noteGoogle}/5` : 'Non disponible'} (${avis || 0} avis)
Horaires : ${horaires || 'Non disponibles'}
Langue du message : ${langParam}
`;

    // Always check if key is loaded correctly
    if (!apiKey) {
      return res.status(500).json({ 
        error: "La clé API Gemini n'est pas configurée dans les secrets de l'application. Veuillez l'ajouter dans la section 'Secrets' (sous la variable GEMINI_API_KEY)." 
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: "Rédige le message d'accroche pour WhatsApp en respectant scrupuleusement le format de réponse.",
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.85,
      }
    });

    const text = response.text || "Désolé, la génération du message a échoué.";
    res.json({ message: text.trim() });
  } catch (error: any) {
    console.error("Express generate api error:", error);
    res.status(500).json({ error: error.message || "Erreur de communication avec l'intelligence artificielle." });
  }
});

// API endpoint to extract structured information from a raw paste
app.post("/api/extract", async (req, res) => {
  try {
    const { rawText } = req.body;
    if (!rawText || !rawText.trim()) {
      return res.status(400).json({ error: "Le texte brut à analyser est obligatoire." });
    }

    if (!apiKey) {
      return res.status(500).json({ 
        error: "La clé API Gemini n'est pas configurée dans les secrets de l'application." 
      });
    }

    const systemPrompt = `Tu es un assistant de prospection commerciale expert en Haïti. 
Tu dois analyser le texte brut fourni par l'utilisateur (qui provient d'un copier-coller de Google Maps, d'une bio Instagram, d'un annuaire en ligne ou de Facebook) et en extraire proprement toutes les informations professionnelles.

Consignes strictes d'extraction :
1. "nom" : Extrais le nom de l'entreprise ou commerce. Capitalise proprement.
2. "secteur" : Choisis impérativement l'une des valeurs exactes suivantes : "Pharmacie", "Boutique", "Restaurant", "Clinique", "École", "Salon de beauté", "Autre". Si le secteur ne correspond à aucun, utilise "Autre".
3. "telephone" : Extrais le numéro de téléphone principal. Formate-le sous forme standard comme "+509 XXXX-XXXX" ou "+509 XX XX XX XX". Si le code pays 509 est manquant mais que c'est un numéro haïtien, ajoute-le. S'il n'y a aucun numéro, mets "+509 ".
4. "adresse" : Extrais le quartier de localisation (exemple: Pétion-Ville, Delmas 31, Tabarre, Kenscoff, Lalue, Centre-ville, etc.). Reste précis mais court. Si non trouvé, devine le quartier s'il est mentionné dans le texte ou écris "Haïti".
5. "description" : Rédige un résumé clair, synthétique et professionnel de l'activité du commerce en 1 ou 2 phrases en français (ce qu'ils vendent, leurs spécialités, etc.).
6. "noteGoogle" : Extrais la note moyenne sur 5 de l'entreprise (ex: 4.4) s'il s'agit de Google Maps. Doit être un nombre décimal entre 1.0 et 5.0. Ne remplis pas si indisponible.
7. "avis" : Extrais le nombre total d'avis ou commentaires reçus (un entier). Ne remplis pas si indisponible.
8. "horaires" : Extrais les horaires d'ouverture si mentionnés (ex: "24/7", "Lun-Sam 8h - 18h"). Ne remplis pas si indisponible.
9. "source" : Choisis impérativement l'une des valeurs suivantes : "Google Maps", "Instagram", "Annuaire Haiti-Digital/petion-ville.com", "Facebook", "Autre". Choisi la source la plus probable au vu des expressions utilisées dans le texte.
10. "prixCible" : Estime le budget de site web idéal ou forfait cible visé en dollars americains (USD) pour ce prospect. Pour une école, clinique ou grand resto met entre 400 et 600. Pour une petite pharmacie ou boutique de quartier, met entre 250 et 350. Par défaut, met 300.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Analyse ce texte brut et extrait les données structurées :\n\n${rawText}`,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            nom: { type: "STRING" },
            secteur: { type: "STRING" },
            telephone: { type: "STRING" },
            adresse: { type: "STRING" },
            description: { type: "STRING" },
            noteGoogle: { type: "NUMBER" },
            avis: { type: "INTEGER" },
            horaires: { type: "STRING" },
            source: { type: "STRING" },
            prixCible: { type: "INTEGER" }
          },
          required: ["nom", "secteur", "telephone", "adresse", "description", "source", "prixCible"]
        },
        temperature: 0.1,
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("L'intelligence artificielle n'a renvoyé aucun résultat.");
    }

    res.json(JSON.parse(resultText));
  } catch (error: any) {
    console.error("Express extract api error:", error);
    res.status(500).json({ error: error.message || "Erreur lors de l'analyse automatique." });
  }
});

// Start the Express app server integrated with Vite
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Yondy Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
