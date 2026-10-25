// ─────────────────────────────────────────────────────────────
//  PASO OBLIGATORIO: pega aquí los datos de tu proyecto Firebase
//  (Firebase Console → Configuración del proyecto → Tus apps → Web).
//  Ver README.md, paso 4.
// ─────────────────────────────────────────────────────────────
export const firebaseConfig = {
  apiKey: 'PEGA_AQUI_TU_API_KEY',
  authDomain: 'PEGA_AQUI.firebaseapp.com',
  projectId: 'PEGA_AQUI',
  storageBucket: 'PEGA_AQUI.appspot.com',
  messagingSenderId: 'PEGA_AQUI',
  appId: 'PEGA_AQUI'
};

// El usuario que escribes en el login ("manu") se convierte internamente en
// manu@cuestionario.app. Debe coincidir con el usuario que crees en
// Firebase → Authentication (README, paso 2).
export const ADMIN_EMAIL_DOMAIN = 'cuestionario.app';
