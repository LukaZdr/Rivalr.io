const dictionary = {
  en: {
    // General
    "app.title": "Rivalr.io",
    "btn.save": "Save",
    "btn.cancel": "Cancel",
    "btn.edit": "Edit",
    "btn.delete": "Delete",
    "btn.close": "Close",

    // Login
    "login.title": "Welcome to Rivalr.io",
    "login.subtitle": "Sign in to track goals and compete with friends.",
    "login.email": "Email address",
    "login.password": "Password",
    "login.signin": "Sign In",
    "login.signup": "Sign Up",
    "login.loading": "Loading...",
    "login.error": "Login failed.",

    // Header & Profile
    "header.editProfile": "Edit Profile",
    "header.signOut": "Sign Out",
    "profile.edit.title": "Edit Profile",
    "profile.displayName": "Display Name",
    "profile.bio": "Bio",
    "profile.bioPlaceholder": "Tell us about your goals...",
    "profile.themeColor": "Theme Color",
    "profile.language": "Language",
    "profile.save": "Save Profile",
    "profile.success": "Profile updated!",
    "profile.error": "Failed to update profile",

    // Dashboard Tabs
    "tab.goals": "Goal Tracker",
    "tab.feed": "Feed",
    "tab.leaderboard": "Leaderboard",
    "tab.friends": "Manage Friends",

    // Dashboard Sections
    "goals.title": "Your Goals",
    "goals.newBtn": "+ New Goal",
    "goals.empty.title": "No goals yet",
    "goals.empty.desc": "Create your first fitness milestone to start tracking your progress",
    
    // Create Goal Modal
    "createGoal.title": "Create a Goal",
    "createGoal.type": "Goal Type (e.g. Running, Pushups)",
    "createGoal.target": "Target",
    "createGoal.unit": "Unit (e.g. km, reps)",
    "createGoal.kind": "Goal Kind",
    "createGoal.kind.cumulative": "Cumulative (adds up over time)",
    "createGoal.kind.milestone": "Milestone (highest single attempt)",
    "createGoal.submit": "Create Goal",
    "createGoal.creating": "Creating...",
    "createGoal.success": "Goal created! 🎯",
    "createGoal.error": "Failed to create goal",

    // Goal Card
    "goal.milestone": "Milestone",
    "goal.cumulative": "Cumulative",
    "goal.extend": "📈 Extend",
    "goal.pastMilestones": "Past Milestones",
    "goal.achievedOn": "Achieved on",
    "goal.deleteConfirm": "Delete this goal?",
    "goal.deleted": "Goal deleted",
    "goal.deleteError": "Failed to delete goal",
    "goal.history.show": "Show History",
    "goal.history.hide": "Hide History",
    "goal.history.empty": "No logs yet.",

    // Log Progress Modal
    "log.title": "Log Progress",
    "log.amount": "Amount to add",
    "log.amountDesc": "This will be added to your total.",
    "log.attempt": "Attempt value",
    "log.attemptDesc": "Your new personal best attempt.",
    "log.note": "Note (optional)",
    "log.date": "Date",
    "log.dateDesc": "Leave empty for today",
    "log.submit": "Log It",
    "log.save": "Save Changes",
    "log.success": "Progress logged! 💪",
    "log.error": "Failed to log progress",
    "log.editTitle": "Edit Log",
    "log.editSuccess": "Log updated!",
    "log.deleteConfirm": "Delete this log? This will recalculate your goal progress.",
    "log.deleted": "Log deleted",

    // Extend Goal Modal
    "extend.title": "Extend Target",
    "extend.desc": "You've reached your target of {0}! Set a new, higher target to keep challenging yourself.",
    "extend.newTarget": "New Target",
    "extend.mustBeGreater": "Must be greater than {0}",
    "extend.submit": "Extend Goal",
    "extend.success": "Goal extended! Keep pushing!",
    "extend.error": "Failed to extend goal",

    // Feed
    "feed.title": "Feed",
    "feed.empty.title": "No activity yet",
    "feed.empty.desc": "Add friends or log progress to see updates here",
    "feed.postPlaceholder": "What did you achieve today?",
    "feed.postBtn": "Post",
    "feed.posting": "Posting...",
    "feed.deleteConfirm": "Delete this post?",
    "feed.log.milestone": "Logged an attempt of {0} {1}",
    "feed.log.cumulative": "Logged +{0} {1}",
    "feed.log.achieved": "Achieved Goal!",
    "feed.log.progress": "Made progress!",
    "feed.extendBtn": "Extend Target",
    "feed.commentPlaceholder": "Write a comment...",
    "feed.replyBtn": "Reply",
    "feed.time.y": " y ago",
    "feed.time.mo": " mo ago",
    "feed.time.d": " d ago",
    "feed.time.h": " h ago",
    "feed.time.m": " m ago",
    "feed.time.s": " s ago",

    // Leaderboard
    "leaderboard.title": "Leaderboard",
    "leaderboard.empty.title": "No goals found",
    "leaderboard.empty.desc": "Create goals to see how you rank against friends",
    "leaderboard.rank": "Rank",
    "leaderboard.user": "User",
    "leaderboard.progress": "Progress",
    "leaderboard.target": "Target",

    // Progress Chart
    "chart.title": "Progress Chart",
    "chart.filter.all": "All Time",
    "chart.filter.year": "Last Year",
    "chart.filter.month": "Last Month",
    "chart.filter.week": "Last Week",
    "chart.filter.today": "Today",
    "chart.empty.title": "No data yet",
    "chart.empty.desc": "Create goals and log progress to see your chart",

    // Friends Panel
    "friends.addBtn": "Add Friend",
    "friends.addPlaceholder": "Enter username",
    "friends.pendingTitle": "Pending Requests",
    "friends.noPending": "No pending requests",
    "friends.accept": "Accept",
    "friends.decline": "Decline",
    "friends.listTitle": "Your Friends",
    "friends.empty.title": "No friends yet",
    "friends.empty.desc": "Add friends to compete and share progress",
    "friends.removeConfirm": "Remove {0} from your friends?",
    "friends.addSuccess": "Friend request sent!",
    "friends.addError": "Failed to send request",
    "friends.notFound": "User not found or request already exists",
    "friends.acceptError": "Failed to accept request",
    "friends.declineError": "Failed to decline request",
  },
  de: {
    // General
    "app.title": "Rivalr.io",
    "btn.save": "Speichern",
    "btn.cancel": "Abbrechen",
    "btn.edit": "Bearbeiten",
    "btn.delete": "Löschen",
    "btn.close": "Schließen",

    // Login
    "login.title": "Willkommen bei Rivalr.io",
    "login.subtitle": "Melde dich an, um Ziele zu verfolgen und gegen Freunde anzutreten.",
    "login.email": "E-Mail-Adresse",
    "login.password": "Passwort",
    "login.signin": "Anmelden",
    "login.signup": "Registrieren",
    "login.loading": "Lädt...",
    "login.error": "Anmeldung fehlgeschlagen.",

    // Header & Profile
    "header.editProfile": "Profil bearbeiten",
    "header.signOut": "Abmelden",
    "profile.edit.title": "Profil bearbeiten",
    "profile.displayName": "Anzeigename",
    "profile.bio": "Bio",
    "profile.bioPlaceholder": "Erzähle uns von deinen Zielen...",
    "profile.themeColor": "Themenfarbe",
    "profile.language": "Sprache",
    "profile.save": "Profil speichern",
    "profile.success": "Profil aktualisiert!",
    "profile.error": "Profil konnte nicht aktualisiert werden",

    // Dashboard Tabs
    "tab.goals": "Ziel-Tracker",
    "tab.feed": "Feed",
    "tab.leaderboard": "Bestenliste",
    "tab.friends": "Freunde verwalten",

    // Dashboard Sections
    "goals.title": "Deine Ziele",
    "goals.newBtn": "+ Neues Ziel",
    "goals.empty.title": "Noch keine Ziele",
    "goals.empty.desc": "Erstelle deinen ersten Fitness-Meilenstein, um deinen Fortschritt zu verfolgen",
    
    // Create Goal Modal
    "createGoal.title": "Ziel erstellen",
    "createGoal.type": "Zieltyp (z.B. Laufen, Liegestütze)",
    "createGoal.target": "Zielwert",
    "createGoal.unit": "Einheit (z.B. km, Wdh)",
    "createGoal.kind": "Zielart",
    "createGoal.kind.cumulative": "Kumulativ (summiert sich über die Zeit)",
    "createGoal.kind.milestone": "Meilenstein (höchster Einzelversuch)",
    "createGoal.submit": "Ziel erstellen",
    "createGoal.creating": "Erstelle...",
    "createGoal.success": "Ziel erstellt! 🎯",
    "createGoal.error": "Ziel konnte nicht erstellt werden",

    // Goal Card
    "goal.milestone": "Meilenstein",
    "goal.cumulative": "Kumulativ",
    "goal.extend": "📈 Erweitern",
    "goal.pastMilestones": "Vergangene Meilensteine",
    "goal.achievedOn": "Erreicht am",
    "goal.deleteConfirm": "Dieses Ziel löschen?",
    "goal.deleted": "Ziel gelöscht",
    "goal.deleteError": "Fehler beim Löschen des Ziels",
    "goal.history.show": "Verlauf anzeigen",
    "goal.history.hide": "Verlauf ausblenden",
    "goal.history.empty": "Noch keine Einträge.",

    // Log Progress Modal
    "log.title": "Fortschritt eintragen",
    "log.amount": "Hinzuzufügende Menge",
    "log.amountDesc": "Dies wird zu deiner Gesamtsumme addiert.",
    "log.attempt": "Versuchswert",
    "log.attemptDesc": "Dein neuer persönlicher Rekord.",
    "log.note": "Notiz (optional)",
    "log.date": "Datum",
    "log.dateDesc": "Für heute leer lassen",
    "log.submit": "Eintragen",
    "log.save": "Änderungen speichern",
    "log.success": "Fortschritt gespeichert! 💪",
    "log.error": "Fehler beim Speichern",
    "log.editTitle": "Eintrag bearbeiten",
    "log.editSuccess": "Eintrag aktualisiert!",
    "log.deleteConfirm": "Diesen Eintrag löschen? Dadurch wird dein Zielfortschritt neu berechnet.",
    "log.deleted": "Eintrag gelöscht",

    // Extend Goal Modal
    "extend.title": "Ziel erweitern",
    "extend.desc": "Du hast dein Ziel von {0} erreicht! Setze ein neues, höheres Ziel, um dich weiter herauszufordern.",
    "extend.newTarget": "Neues Ziel",
    "extend.mustBeGreater": "Muss größer als {0} sein",
    "extend.submit": "Ziel erweitern",
    "extend.success": "Ziel erweitert! Bleib dran!",
    "extend.error": "Ziel konnte nicht erweitert werden",

    // Feed
    "feed.title": "Feed",
    "feed.empty.title": "Noch keine Aktivität",
    "feed.empty.desc": "Füge Freunde hinzu oder trage Fortschritte ein, um hier Updates zu sehen",
    "feed.postPlaceholder": "Was hast du heute erreicht?",
    "feed.postBtn": "Posten",
    "feed.posting": "Wird gepostet...",
    "feed.deleteConfirm": "Diesen Beitrag löschen?",
    "feed.log.milestone": "Versuch von {0} {1} eingetragen",
    "feed.log.cumulative": "+{0} {1} eingetragen",
    "feed.log.achieved": "Ziel erreicht!",
    "feed.log.progress": "Fortschritt gemacht!",
    "feed.extendBtn": "Ziel erweitern",
    "feed.commentPlaceholder": "Schreibe einen Kommentar...",
    "feed.replyBtn": "Antworten",
    "feed.time.y": " J her",
    "feed.time.mo": " M her",
    "feed.time.d": " T her",
    "feed.time.h": " Std her",
    "feed.time.m": " Min her",
    "feed.time.s": " Sek her",

    // Leaderboard
    "leaderboard.title": "Bestenliste",
    "leaderboard.empty.title": "Keine Ziele gefunden",
    "leaderboard.empty.desc": "Erstelle Ziele, um zu sehen, wie du im Vergleich abschneidest",
    "leaderboard.rank": "Rang",
    "leaderboard.user": "Benutzer",
    "leaderboard.progress": "Fortschritt",
    "leaderboard.target": "Ziel",

    // Progress Chart
    "chart.title": "Fortschrittsdiagramm",
    "chart.filter.all": "Gesamte Zeit",
    "chart.filter.year": "Letztes Jahr",
    "chart.filter.month": "Letzter Monat",
    "chart.filter.week": "Letzte Woche",
    "chart.filter.today": "Heute",
    "chart.empty.title": "Noch keine Daten",
    "chart.empty.desc": "Erstelle Ziele und trage Fortschritte ein, um dein Diagramm zu sehen",

    // Friends Panel
    "friends.addBtn": "Freund hinzufügen",
    "friends.addPlaceholder": "Benutzername eingeben",
    "friends.pendingTitle": "Ausstehende Anfragen",
    "friends.noPending": "Keine ausstehenden Anfragen",
    "friends.accept": "Annehmen",
    "friends.decline": "Ablehnen",
    "friends.listTitle": "Deine Freunde",
    "friends.empty.title": "Noch keine Freunde",
    "friends.empty.desc": "Füge Freunde hinzu, um Fortschritte zu teilen",
    "friends.removeConfirm": "{0} aus deiner Freundesliste entfernen?",
    "friends.addSuccess": "Freundschaftsanfrage gesendet!",
    "friends.addError": "Fehler beim Senden der Anfrage",
    "friends.notFound": "Benutzer nicht gefunden oder Anfrage existiert bereits",
    "friends.acceptError": "Fehler beim Annehmen",
    "friends.declineError": "Fehler beim Ablehnen",
  }
};

/**
 * Get current language setting.
 */
export function getLang() {
  return localStorage.getItem('rivalr_lang') || 'en';
}

/**
 * Set language setting.
 */
export function setLang(lang) {
  if (dictionary[lang]) {
    localStorage.setItem('rivalr_lang', lang);
  }
}

/**
 * Translate a key.
 * @param {string} key - Dictionary key.
 * @param  {...any} args - Variables to format (e.g. {0}).
 */
export function t(key, ...args) {
  const lang = getLang();
  let str = dictionary[lang]?.[key] || dictionary['en']?.[key] || key;
  
  if (args.length > 0) {
    args.forEach((arg, i) => {
      str = str.replace(new RegExp(`\\{${i}\\}`, 'g'), arg);
    });
  }
  
  return str;
}
