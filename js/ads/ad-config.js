/* ================= REGLAGES DES PUBLICITES =================
   Tout ce qui se regle pour les pubs est ici. Le fonctionnement est dans ad-gate.js
   (message + validation) et le blocage des redirections dans redirect-blocking.js. */

// Lien de monetisation (Smartlink Adsterra). Colle ton lien entre les guillemets.
const AD_LINK='https://directyp.org/4/4b66e28a51cca569f4ae5bc1bb0e00b6';

// Temps minimum (en millisecondes) a passer sur l'onglet de la pub pour la valider.
const AD_MIN_STAY_MS=3000;

// Series : une pub tous les N episodes (1er episode, puis 4e, 7e... avec N=3).
const AD_EVERY_N_EPISODES=3;
