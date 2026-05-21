/* ================================================
   IVOIRE SANTÉ CONNECT — script.js
   ================================================ */

/* ------------------------------------------------
   ÉTAT GLOBAL
   ------------------------------------------------ */
let currentRole = null;  // 'medecin' | 'patient'
let aiIdx = 0;           // index cyclique pour les réponses IA

/* ------------------------------------------------
   SPLASH → CONNEXION
   ------------------------------------------------ */
setTimeout(() => {
  document.getElementById('splash').classList.add('hidden');

  setTimeout(() => {
    document.getElementById('splash').style.display = 'none';
    document.getElementById('login-screen').classList.add('visible');
  }, 650);

}, 2200);

/* ------------------------------------------------
   SÉLECTION DU RÔLE
   ------------------------------------------------ */
function selectRole(role) {
  currentRole = role;

  document.getElementById('role-medecin').classList.toggle('selected', role === 'medecin');
  document.getElementById('role-patient').classList.toggle('selected', role === 'patient');

  const idInput = document.getElementById('login-id');
  idInput.placeholder = role === 'medecin'
    ? 'dr.kone@ivoire-sante.ci'
    : 'koffi.julien@patient.ci';
}

/* ------------------------------------------------
   CONNEXION
   ------------------------------------------------ */
function doLogin() {
  if (!currentRole) {
    showToast('Veuillez choisir un profil');
    return;
  }

  const id = document.getElementById('login-id').value.trim();
  const pw = document.getElementById('login-pw').value.trim();

  if (!id || !pw) {
    showToast('Veuillez remplir tous les champs');
    return;
  }

  /* Masquer l'écran de connexion */
  document.getElementById('login-screen').classList.remove('visible');

  /* Appliquer la classe de rôle sur <body> */
  document.body.classList.add('role-' + currentRole);

  /* Mettre à jour le header */
  const badge  = document.getElementById('header-role-badge');
  const avatar = document.getElementById('header-avatar');

  if (currentRole === 'medecin') {
    badge.textContent  = 'Médecin';
    badge.className    = 'role-badge medecin';
    avatar.textContent = 'AK';
    avatar.classList.add('medecin');
    document.getElementById('ia-greeting').textContent = 'Tableau de bord Dr. Koné';
  } else {
    badge.textContent  = 'Patient';
    badge.className    = 'role-badge patient';
    avatar.textContent = 'KJ';
    avatar.classList.remove('medecin');
    document.getElementById('ia-greeting').textContent = 'Bonne journée, Kofi !';
  }

  /* Afficher l'application */
  document.getElementById('app').classList.add('visible');
  showToast('Connexion réussie !');
}

/* ------------------------------------------------
   DÉCONNEXION
   ------------------------------------------------ */
function doLogout() {
  document.getElementById('app').classList.remove('visible');
  document.body.classList.remove('role-medecin', 'role-patient');

  currentRole = null;
  document.getElementById('role-medecin').classList.remove('selected');
  document.getElementById('role-patient').classList.remove('selected');
  document.getElementById('login-id').value = '';
  document.getElementById('login-pw').value = '';

  /* Revenir à l'onglet Profil */
  switchTab('profil', document.querySelector('.nav-item'));

  document.getElementById('login-screen').classList.add('visible');
}

/* ------------------------------------------------
   NAVIGATION PAR ONGLETS
   ------------------------------------------------ */
function switchTab(name, btn) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));

  document.getElementById('tab-' + name).classList.add('active');
  if (btn) btn.classList.add('active');
}

/* ------------------------------------------------
   ACCORDÉON DES CONSULTATIONS
   ------------------------------------------------ */
function toggleConsultDetail(headerEl) {
  const detail = headerEl.parentElement.querySelector('.consult-detail');
  if (detail) detail.classList.toggle('open');
}

/* ------------------------------------------------
   FORMULAIRE D'OBSERVATION (bottom-sheet)
   ------------------------------------------------ */
function openObsForm(date, motif) {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('obs-date').value      = today;
  document.getElementById('obs-motif').value     = motif || '';
  document.getElementById('obs-ta').value        = '';
  document.getElementById('obs-glyc').value      = '';
  document.getElementById('obs-poids').value     = '';
  document.getElementById('obs-temp').value      = '';
  document.getElementById('obs-notes').value     = '';
  document.getElementById('obs-traitement').value = '';
  document.getElementById('obs-rdv').value       = '';
  document.getElementById('obs-status').value    = 'done';

  document.getElementById('obs-overlay').classList.add('open');
}

function closeObsForm() {
  document.getElementById('obs-overlay').classList.remove('open');
}

function closeObsFormOutside(e) {
  if (e.target === document.getElementById('obs-overlay')) {
    closeObsForm();
  }
}

/* ------------------------------------------------
   ENREGISTREMENT D'UNE OBSERVATION
   ------------------------------------------------ */
function saveObservation() {
  const date       = document.getElementById('obs-date').value;
  const motif      = document.getElementById('obs-motif').value.trim();
  const ta         = document.getElementById('obs-ta').value.trim();
  const glyc       = document.getElementById('obs-glyc').value.trim();
  const notes      = document.getElementById('obs-notes').value.trim();
  const traitement = document.getElementById('obs-traitement').value.trim();
  const rdv        = document.getElementById('obs-rdv').value;
  const status     = document.getElementById('obs-status').value;

  if (!date || !motif) {
    showToast('Date et motif sont requis');
    return;
  }

  const d       = new Date(date);
  const months  = ['Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'];
  const day     = d.getDate();
  const month   = months[d.getMonth()];

  let tagsHTML = '';

  if (ta) {
    const taNums = ta.match(/(\d+)\/(\d+)/);
    if (taNums) {
      const sys = parseInt(taNums[1]);
      const cls = sys >= 140 ? 'alert' : sys >= 130 ? 'warning' : 'normal';
      tagsHTML += `<span class="obs-tag ${cls}"><i class="ti ti-heart"></i> TA : ${ta}</span>`;
    } else {
      tagsHTML += `<span class="obs-tag normal"><i class="ti ti-heart"></i> TA : ${ta}</span>`;
    }
  }

  if (glyc) {
    const g   = parseFloat(glyc);
    const cls = g > 7 ? 'alert' : g > 6.5 ? 'warning' : 'normal';
    tagsHTML += `<span class="obs-tag ${cls}"><i class="ti ti-droplet"></i> Glycémie : ${glyc} mmol/L</span>`;
  }

  const notesShort = notes.length > 50 ? notes.slice(0, 50) + '…' : notes;
  const subtitle   = notesShort || (ta ? 'TA : ' + ta : '');

  const rdvFmt = rdv
    ? new Date(rdv).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  const badgeClass = status === 'done' ? 'done' : 'upcoming';
  const badgeText  = status === 'done' ? 'Terminée' : 'À venir';

  const html = `
    <div class="consult-item">
      <div class="consult-item-header" onclick="toggleConsultDetail(this)">
        <div class="consult-date-box">
          <div class="consult-day">${day}</div>
          <div class="consult-month">${month}</div>
        </div>
        <div class="consult-info">
          <div class="consult-reason">${motif}</div>
          <div class="consult-notes">${subtitle}</div>
        </div>
        <span class="badge ${badgeClass}">${badgeText}</span>
        <div class="medecin-only edit-btn"
             onclick="event.stopPropagation(); openObsForm('${date}', '${motif.replace(/'/g, "\\'")}')">
          <i class="ti ti-edit"></i>
        </div>
      </div>
      <div class="consult-detail open">
        <div class="detail-row">
          <span class="detail-label">Motif</span>
          <span class="detail-val">${motif}</span>
        </div>
        ${notes ? `
        <div class="detail-row">
          <span class="detail-label">Observations</span>
          <span class="detail-val">${notes}</span>
        </div>` : ''}
        ${tagsHTML ? `
        <div class="detail-row">
          <span class="detail-label">Résultats</span>
          <span class="detail-val">${tagsHTML}</span>
        </div>` : ''}
        ${traitement ? `
        <div class="detail-row">
          <span class="detail-label">Traitement</span>
          <span class="detail-val">${traitement}</span>
        </div>` : ''}
        <div class="detail-row">
          <span class="detail-label">Prochain RDV</span>
          <span class="detail-val">${rdvFmt}</span>
        </div>
      </div>
    </div>
  `;

  document.getElementById('consult-list').insertAdjacentHTML('afterbegin', html);

  closeObsForm();
  showToast('Consultation enregistrée ✓');
}

/* ------------------------------------------------
   ASSISTANT IA — CHAT
   ------------------------------------------------ */
const aiReplies = [
  "Bonne question ! Pensez à mesurer votre glycémie avant le dîner.",
  "Je recommande de consulter Dr. Koné si votre tension dépasse 140/90.",
  "La Metformine doit toujours être prise avec un repas pour éviter les nausées.",
  "Votre prochain bilan sanguin est prévu lors de la consultation du 20 Mai.",
  "Restez bien hydraté, surtout par cette chaleur. Buvez 1,5 à 2L d'eau par jour."
];

function sendMsg() {
  const input = document.getElementById('chat-in');
  const msgs  = document.getElementById('chat-msgs');

  if (!input.value.trim()) return;

  const userMsg = document.createElement('div');
  userMsg.className   = 'msg user';
  userMsg.textContent = input.value;
  msgs.appendChild(userMsg);
  msgs.scrollTop = msgs.scrollHeight;

  const userText = input.value;
  input.value = '';

  /* Indicateur de frappe */
  const typing = document.createElement('div');
  typing.className   = 'msg ai';
  typing.textContent = '…';
  msgs.appendChild(typing);
  msgs.scrollTop = msgs.scrollHeight;

  /* Appel API Node.js simulé (fetch vers /api/chat) */
  simulateNodeApiCall(userText).then(reply => {
    typing.textContent = reply;
    msgs.scrollTop = msgs.scrollHeight;
  });
}

/**
 * Simule un appel à une API Node.js/Express
 * En production : fetch('/api/chat', { method:'POST', body: JSON.stringify({message}) })
 */
async function simulateNodeApiCall(message) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(aiReplies[aiIdx++ % aiReplies.length]);
    }, 900);
  });
}

/* ------------------------------------------------
   TOAST DE NOTIFICATION
   ✅ CORRECTION : ID renommé "toast" → utilise class "toast-custom"
   ------------------------------------------------ */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2600);
}

/* ================================================
   GESTION DES ONGLETS AUTH (Connexion / Inscription)
   ================================================ */
let currentRegRole = null;

function switchAuthTab(tab) {
  const isConnexion = tab === 'connexion';

  document.getElementById('tab-connexion').classList.toggle('active', isConnexion);
  document.getElementById('tab-inscription').classList.toggle('active', !isConnexion);

  document.getElementById('form-connexion').style.display  = isConnexion ? 'block' : 'none';
  document.getElementById('form-inscription').style.display = isConnexion ? 'none' : 'block';
}

/* ------------------------------------------------
   SÉLECTION DU RÔLE INSCRIPTION
   ------------------------------------------------ */
function selectRegRole(role) {
  currentRegRole = role;

  document.getElementById('reg-role-medecin').classList.toggle('selected', role === 'medecin');
  document.getElementById('reg-role-patient').classList.toggle('selected', role === 'patient');

  document.getElementById('reg-medecin-fields').style.display = role === 'medecin' ? 'block' : 'none';
  document.getElementById('reg-patient-fields').style.display = role === 'patient' ? 'block' : 'none';
}

/* ------------------------------------------------
   INSCRIPTION
   ------------------------------------------------ */
async function doRegister() {
  if (!currentRegRole) {
    showToast('Veuillez choisir un profil');
    return;
  }

  const prenom = document.getElementById('reg-prenom').value.trim();
  const nom    = document.getElementById('reg-nom').value.trim();
  const email  = document.getElementById('reg-email').value.trim();
  const pw     = document.getElementById('reg-pw').value.trim();
  const pw2    = document.getElementById('reg-pw2').value.trim();

  if (!prenom || !nom || !email || !pw) {
    showToast('Veuillez remplir tous les champs');
    return;
  }

  if (pw !== pw2) {
    showToast('Les mots de passe ne correspondent pas');
    return;
  }

  if (pw.length < 6) {
    showToast('Le mot de passe doit contenir au moins 6 caractères');
    return;
  }

  /* Données supplémentaires selon le rôle */
  const extra = currentRegRole === 'medecin'
    ? {
        specialite: document.getElementById('reg-specialite').value.trim(),
        numeroOrdre: document.getElementById('reg-ordre').value.trim()
      }
    : {
        dateNaissance: document.getElementById('reg-ddn').value,
        telephone: document.getElementById('reg-tel').value.trim()
      };

  /* Initiales automatiques */
  const initiales = (prenom[0] + nom[0]).toUpperCase();

  /* Appel API serveur Node.js */
  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifiant: email,
        motDePasse: pw,
        role: currentRegRole,
        nom: `${prenom} ${nom}`,
        initiales,
        ...extra
      })
    });

    const data = await response.json();

    if (!response.ok) {
      showToast(data.error || 'Erreur lors de l\'inscription');
      return;
    }

    showToast('Compte créé avec succès ! Connectez-vous 🎉');

    /* Pré-remplir le formulaire de connexion */
    switchAuthTab('connexion');
    selectRole(currentRegRole);
    document.getElementById('login-id').value = email;

  } catch (err) {
    /* Mode hors-ligne : simulation */
    showToast(`Compte créé ! Bienvenue ${prenom} 🎉`);
    switchAuthTab('connexion');
    selectRole(currentRegRole);
    document.getElementById('login-id').value = email;
  }
}
