import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';

export default function Auth() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential') {
        setErrorMsg('Email ou mot de passe incorrect.');
      } else if (err.code === 'auth/email-already-in-use') {
        setErrorMsg('Cet email est déjà utilisé.');
      } else if (err.code === 'auth/weak-password') {
        setErrorMsg('Le mot de passe doit faire au moins 6 caractères.');
      } else {
        setErrorMsg(`Erreur : ${err.message || 'Une erreur est survenue'}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F4EE] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-100">
        
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#E0633B] text-white rounded-xl flex items-center justify-center shadow-md mx-auto mb-4">
            <span className="font-serif font-extrabold text-2xl tracking-tighter">Y</span>
          </div>
          <h1 className="font-serif text-2xl font-bold text-[#0B3D2E]">Yondy Web</h1>
          <p className="text-sm text-gray-500 mt-1 uppercase tracking-widest font-mono">Accès Sécurisé</p>
        </div>

        {errorMsg && (
          <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 text-center font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#0B3D2E] focus:ring-1 focus:ring-[#0B3D2E] transition-colors"
              placeholder="votre@email.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-[#0B3D2E] focus:ring-1 focus:ring-[#0B3D2E] transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#0B3D2E] text-white font-bold py-2.5 rounded-lg hover:bg-emerald-900 transition-colors shadow-md mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? "Veuillez patienter..." : (isRegistering ? "S'inscrire" : "Se connecter")}
          </button>
        </form>

        <div className="mt-6 text-center border-t border-gray-100 pt-6">
          <p className="text-sm text-gray-600">
            {isRegistering ? "Vous avez déjà un compte ?" : "Nouveau sur l'application ?"}
          </p>
          <button
            onClick={() => {
              setIsRegistering(!isRegistering);
              setErrorMsg('');
            }}
            className="mt-2 text-[#E0633B] font-bold hover:underline text-sm focus:outline-none"
          >
            {isRegistering ? "Se connecter" : "Créer un compte"}
          </button>
        </div>

      </div>
    </div>
  );
}
