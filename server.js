/**
 * IVOIRE SANTÉ CONNECT — server.js
 * Serveur Node.js / Express + MongoDB Atlas
 */

const express   = require('express');
const cors      = require('cors');
const path      = require('path');
const mongoose  = require('mongoose');

const app  = express();
const PORT = process.env.PORT || 3000;

/* ================================================
   CONNEXION MONGODB ATLAS
   ================================================ */
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://admin:SanteConnect2026#@ivoire-sante.s3zjvcx.mongodb.net/ivoiresante?retryWrites=true&w=majority&appName=ivoire-sante';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Atlas connecté'))
  .catch(err => console.error('❌ Erreur MongoDB :', err));

/* ================================================
   MODÈLES MONGODB (Schemas)
   ================================================ */

/* --- Patient --- */
const PatientSchema = new mongoose.Schema({
  nom:          { type: String, required: true },
  prenom:       { type: String, required: true },
  dateNaissance:{ type: String },
  groupeSanguin:{ type: String },
  taille:       { type: Number },
  poids:        { type: Number },
  telephone:    { type: String },
  antecedents:  [String],
  allergies:    [String],
  numeroDossier:{ type: String, unique: true }
}, { timestamps: true });

/* --- Consultation --- */
const ConsultationSchema = new mongoose.Schema({
  patientId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  date:        { type: String, required: true },
  motif:       { type: String, required: true },
  ta:          { type: String },
  glycemie:    { type: Number },
  poids:       { type: Number },
  temperature: { type: Number },
  notes:       { type: String },
  traitement:  { type: String },
  rdv:         { type: String },
  status:      { type: String, enum: ['done', 'upcoming'], default: 'done' },
  medecinId:   { type: String }
}, { timestamps: true });

/* --- Utilisateur --- */
const UtilisateurSchema = new mongoose.Schema({
  identifiant:   { type: String, required: true, unique: true },
  motDePasse:    { type: String, required: true },
  role:          { type: String, enum: ['medecin', 'patient'], required: true },
  nom:           { type: String },
  initiales:     { type: String },
  specialite:    { type: String },
  numeroOrdre:   { type: String },
  dateNaissance: { type: String },
  telephone:     { type: String }
}, { timestamps: true });

const Patient       = mongoose.model('Patient', PatientSchema);
const Consultation  = mongoose.model('Consultation', ConsultationSchema);
const Utilisateur   = mongoose.model('Utilisateur', UtilisateurSchema);

/* ================================================
   MIDDLEWARE
   ================================================ */
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

/* ================================================
   ROUTES API
   ================================================ */

/* --- Health check --- */
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: '2.0.0',
    database: mongoose.connection.readyState === 1 ? 'connectée' : 'déconnectée',
    uptime: process.uptime()
  });
});

/* --- Inscription (POST /api/register) --- */
app.post('/api/register', async (req, res) => {
  const { identifiant, motDePasse, role, nom, initiales, specialite, numeroOrdre, dateNaissance, telephone } = req.body;

  if (!identifiant || !motDePasse || !role || !nom) {
    return res.status(400).json({ error: 'Champs manquants' });
  }

  try {
    /* Vérifier si l'email existe déjà */
    const existe = await Utilisateur.findOne({ identifiant });
    if (existe) {
      return res.status(409).json({ error: 'Cet email est déjà utilisé' });
    }

    /* Créer l'utilisateur */
    const user = await Utilisateur.create({
      identifiant,
      motDePasse,
      role,
      nom,
      initiales: initiales || (nom.split(' ').map(n => n[0]).join('').toUpperCase()),
      specialite,
      numeroOrdre,
      dateNaissance,
      telephone
    });

    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès',
      user: { id: user._id, role: user.role, nom: user.nom, initiales: user.initiales }
    });

  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

/* --- Auth (POST /api/login) --- */
app.post('/api/login', async (req, res) => {
  const { identifiant, motDePasse, role } = req.body;

  if (!identifiant || !motDePasse || !role) {
    return res.status(400).json({ error: 'Champs manquants' });
  }

  try {
    /* Cherche l'utilisateur en base */
    let user = await Utilisateur.findOne({ identifiant, role });

    /* Si l'utilisateur n'existe pas encore, on le crée automatiquement (démo) */
    if (!user) {
      user = await Utilisateur.create({
        identifiant,
        motDePasse,
        role,
        nom:       role === 'medecin' ? 'Dr. Amara Koné' : 'Koffi Julien',
        initiales: role === 'medecin' ? 'AK' : 'KJ'
      });
    }

    const token = Buffer.from(`${role}:${identifiant}:${Date.now()}`).toString('base64');

    res.json({
      success: true,
      token,
      user: {
        id:        user._id,
        role:      user.role,
        nom:       user.nom,
        initiales: user.initiales
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

/* --- Consultations (GET /api/consultations) --- */
app.get('/api/consultations', async (req, res) => {
  try {
    const { patientId } = req.query;
    const filtre = patientId ? { patientId } : {};
    const consultations = await Consultation.find(filtre).sort({ date: -1 });
    res.json(consultations);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

/* --- Ajouter consultation (POST /api/consultations) --- */
app.post('/api/consultations', async (req, res) => {
  try {
    const consult = await Consultation.create(req.body);
    res.status(201).json(consult);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

/* --- Patients (GET /api/patients) --- */
app.get('/api/patients', async (req, res) => {
  try {
    const patients = await Patient.find().sort({ createdAt: -1 });
    res.json(patients);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

/* --- Ajouter patient (POST /api/patients) --- */
app.post('/api/patients', async (req, res) => {
  try {
    const patient = await Patient.create(req.body);
    res.status(201).json(patient);
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur', details: err.message });
  }
});

/* --- Assistant IA (POST /api/chat) --- */
const aiReplies = [
  "Bonne question ! Pensez à mesurer votre glycémie avant le dîner.",
  "Je recommande de consulter votre médecin si votre tension dépasse 140/90.",
  "La Metformine doit toujours être prise avec un repas pour éviter les nausées.",
  "Restez bien hydraté. Buvez 1,5 à 2L d'eau par jour.",
  "N'oubliez pas de prendre vos médicaments à heure fixe chaque jour."
];
let aiIdx = 0;

app.post('/api/chat', (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'Message vide' });

  setTimeout(() => {
    res.json({
      reply: aiReplies[aiIdx++ % aiReplies.length],
      timestamp: new Date().toISOString()
    });
  }, 400);
});

/* ================================================
   DÉMARRAGE DU SERVEUR
   ================================================ */
app.listen(PORT, () => {
  console.log(`\n✅ Ivoire Santé Connect v2.0 — serveur démarré`);
  console.log(`   → http://localhost:${PORT}\n`);
});

module.exports = app;
