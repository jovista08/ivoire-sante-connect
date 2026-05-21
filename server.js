/**
 * IVOIRE SANTÉ CONNECT — server.js
 * Serveur Node.js / Express pour l'API backend
 *
 * Installation : npm install express cors
 * Lancement    : node server.js
 * URL          : http://localhost:3000
 */

const express = require('express');
const cors    = require('cors');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

/* ---- Middleware ---- */
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));  // sert index.html, style.css, script.js

/* ================================================
   BASE DE DONNÉES IN-MEMORY (remplacer par MongoDB / PostgreSQL en prod)
   ================================================ */
const db = {
  consultations: [
    {
      id: 1,
      patientId: 'KJ-00847',
      date: '2025-04-28',
      motif: 'Suivi diabète & tension',
      ta: '130/85',
      glycemie: 6.8,
      notes: 'Patient stable. HBA1c dans les normes.',
      traitement: 'Continuer Metformine 850mg × 2/j',
      rdv: '2025-05-20',
      status: 'done'
    },
    {
      id: 2,
      patientId: 'KJ-00847',
      date: '2025-03-15',
      motif: 'Contrôle glycémie',
      ta: null,
      glycemie: 7.9,
      notes: 'Glycémie trop élevée. Ajustement posologie.',
      traitement: 'Metformine 500mg → 850mg × 2/j',
      rdv: '2025-04-28',
      status: 'done'
    }
  ],

  aiReplies: [
    "Bonne question ! Pensez à mesurer votre glycémie avant le dîner.",
    "Je recommande de consulter Dr. Koné si votre tension dépasse 140/90.",
    "La Metformine doit toujours être prise avec un repas pour éviter les nausées.",
    "Votre prochain bilan sanguin est prévu lors de la consultation du 20 Mai.",
    "Restez bien hydraté. Buvez 1,5 à 2L d'eau par jour."
  ],

  aiIdx: 0
};

/* ================================================
   ROUTES API
   ================================================ */

/* --- Auth (POST /api/login) --- */
app.post('/api/login', (req, res) => {
  const { identifiant, motDePasse, role } = req.body;

  if (!identifiant || !motDePasse || !role) {
    return res.status(400).json({ error: 'Champs manquants' });
  }

  /* Simulation d'authentification — remplacer par JWT + bcrypt en prod */
  const token = Buffer.from(`${role}:${identifiant}:${Date.now()}`).toString('base64');

  res.json({
    success: true,
    token,
    user: {
      role,
      nom: role === 'medecin' ? 'Dr. Amara Koné' : 'Koffi Julien',
      initiales: role === 'medecin' ? 'AK' : 'KJ'
    }
  });
});

/* --- Consultations (GET /api/consultations) --- */
app.get('/api/consultations', (req, res) => {
  const { patientId } = req.query;
  const data = patientId
    ? db.consultations.filter(c => c.patientId === patientId)
    : db.consultations;
  res.json(data);
});

/* --- Ajouter consultation (POST /api/consultations) --- */
app.post('/api/consultations', (req, res) => {
  const consult = {
    id: db.consultations.length + 1,
    ...req.body,
    createdAt: new Date().toISOString()
  };
  db.consultations.unshift(consult);
  res.status(201).json(consult);
});

/* --- Assistant IA (POST /api/chat) --- */
app.post('/api/chat', (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message vide' });
  }

  /* En prod : intégrer l'API Claude / OpenAI ici */
  const reply = db.aiReplies[db.aiIdx % db.aiReplies.length];
  db.aiIdx++;

  /* Délai simulé pour imiter une vraie IA */
  setTimeout(() => {
    res.json({ reply, timestamp: new Date().toISOString() });
  }, 400);
});

/* --- Health check (GET /api/health) --- */
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.0.0', uptime: process.uptime() });
});

/* ================================================
   DÉMARRAGE DU SERVEUR
   ================================================ */
app.listen(PORT, () => {
  console.log(`\n✅ Ivoire Santé Connect — serveur démarré`);
  console.log(`   → http://localhost:${PORT}\n`);
});

module.exports = app;
