import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// ⚠️ APAGUE ESTE BLOCO ABAIXO E COLE O SEU PRÓPRIO firebaseConfig INTEIRO AQUI:
const firebaseConfig = {
  apiKey: "AIzaSyAQLSb2Gux6E7dV-E_k-KzbLytBiLINFvQ",
  authDomain: "waze-do-sertao.firebaseapp.com",
  projectId: "waze-do-sertao",
  storageBucket: "waze-do-sertao.firebasestorage.app",
  messagingSenderId: "580213455503",
  appId: "1:580213455503:web:b7128a9a79ece23efc4efa"
};
// ---------------------------------------------------------------------------

// 1. Liga o aplicativo ao Firebase usando as suas chaves
const app = initializeApp(firebaseConfig);

// 2. Abre a conexão específica com o Banco de Dados (Firestore) e exporta para o mapa usar
export const db = getFirestore(app);