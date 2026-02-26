/**
 * FIREBASE CONFIGURATION
 * Replace the values below with YOUR Firebase project config.
 * Get it from: Firebase Console → Project Settings → Your Apps → SDK setup
 */

const firebaseConfig = {
  apiKey: "AIzaSyAaTQmjRa0iacRisViHjKN4PnWZrDib74k",
  authDomain: "quiz-app-bdf3a.firebaseapp.com",
  projectId: "quiz-app-bdf3a",
  storageBucket: "quiz-app-bdf3a.firebasestorage.app",
  messagingSenderId: "618702863002",
  appId: "1:618702863002:web:2f8354f98bed37f3b2bd23"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ─────────────────────────────────────────
// AUTH HELPERS
// ─────────────────────────────────────────

function getCurrentUser() {
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      unsubscribe();
      resolve(user);
    });
  });
}

async function requireAuth(redirectTo = 'login.html') {
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = redirectTo;
    return null;
  }
  return user;
}

async function signUp(email, password) {
  try {
    const result = await auth.createUserWithEmailAndPassword(email, password);
    return { data: result.user, error: null };
  } catch (e) {
    return { data: null, error: e };
  }
}

async function signIn(email, password) {
  try {
    const result = await auth.signInWithEmailAndPassword(email, password);
    return { data: result.user, error: null };
  } catch (e) {
    return { data: null, error: e };
  }
}

async function signOut() {
  try {
    await auth.signOut();
    return { error: null };
  } catch (e) {
    return { error: e };
  }
}

// ─────────────────────────────────────────
// QUIZ HELPERS
// ─────────────────────────────────────────

async function createQuiz(userId, title, description, timerSeconds) {
  try {
    const docRef = await db.collection('quizzes').add({
      user_id: userId,
      title,
      description,
      timer_seconds: parseInt(timerSeconds) || 0,
      created_at: firebase.firestore.FieldValue.serverTimestamp()
    });
    const doc = await docRef.get();
    return { data: { id: doc.id, ...doc.data() }, error: null };
  } catch (e) {
    return { data: null, error: e };
  }
}

async function getUserQuizzes(userId) {
  try {
    // No orderBy here to avoid needing a composite index
    // We sort client-side instead
    const snap = await db.collection('quizzes')
      .where('user_id', '==', userId)
      .get();
    const data = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => {
        const ta = a.created_at ? a.created_at.toMillis() : 0;
        const tb = b.created_at ? b.created_at.toMillis() : 0;
        return tb - ta; // newest first
      });
    return { data, error: null };
  } catch (e) {
    return { data: [], error: e };
  }
}

async function getQuiz(quizId) {
  try {
    const doc = await db.collection('quizzes').doc(quizId).get();
    if (!doc.exists) return { data: null, error: { message: 'Quiz not found' } };
    return { data: { id: doc.id, ...doc.data() }, error: null };
  } catch (e) {
    return { data: null, error: e };
  }
}

async function deleteQuiz(quizId) {
  try {
    const qSnap = await db.collection('questions').where('quiz_id', '==', quizId).get();
    const b1 = db.batch();
    qSnap.docs.forEach(d => b1.delete(d.ref));
    await b1.commit();

    const rSnap = await db.collection('responses').where('quiz_id', '==', quizId).get();
    const b2 = db.batch();
    rSnap.docs.forEach(d => b2.delete(d.ref));
    await b2.commit();

    await db.collection('quizzes').doc(quizId).delete();
    return { error: null };
  } catch (e) {
    return { error: e };
  }
}

// ─────────────────────────────────────────
// QUESTION HELPERS
// ─────────────────────────────────────────

async function insertQuestions(questions) {
  try {
    const batch = db.batch();
    questions.forEach(q => {
      const ref = db.collection('questions').doc();
      batch.set(ref, {
        ...q,
        created_at: firebase.firestore.FieldValue.serverTimestamp()
      });
    });
    await batch.commit();
    return { error: null };
  } catch (e) {
    return { error: e };
  }
}

async function getQuizQuestions(quizId) {
  try {
    const snap = await db.collection('questions')
      .where('quiz_id', '==', quizId)
      .get();
    const data = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => {
        const ta = a.created_at ? a.created_at.toMillis() : 0;
        const tb = b.created_at ? b.created_at.toMillis() : 0;
        return ta - tb;
      });
    return { data, error: null };
  } catch (e) {
    return { data: null, error: e };
  }
}

// ─────────────────────────────────────────
// RESPONSE HELPERS
// ─────────────────────────────────────────

async function saveResponse(quizId, score, totalQuestions, percentage) {
  try {
    const docRef = await db.collection('responses').add({
      quiz_id: quizId,
      score,
      total_questions: totalQuestions,
      percentage,
      created_at: firebase.firestore.FieldValue.serverTimestamp()
    });
    const doc = await docRef.get();
    return { data: { id: doc.id, ...doc.data() }, error: null };
  } catch (e) {
    return { data: null, error: e };
  }
}

async function getQuizResponses(quizId) {
  try {
    const snap = await db.collection('responses')
      .where('quiz_id', '==', quizId)
      .get();
    const data = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => {
        const ta = a.created_at ? a.created_at.toMillis() : 0;
        const tb = b.created_at ? b.created_at.toMillis() : 0;
        return tb - ta;
      });
    return { data, error: null };
  } catch (e) {
    return { data: null, error: e };
  }
}

async function getAnalytics(userId) {
  const { data: quizzes } = await getUserQuizzes(userId);
  if (!quizzes) return [];
  const analytics = [];
  for (const quiz of quizzes) {
    const { data: responses } = await getQuizResponses(quiz.id);
    const attempts = responses ? responses.length : 0;
    const avgScore = attempts > 0
      ? responses.reduce((sum, r) => sum + r.percentage, 0) / attempts : 0;
    const highestScore = attempts > 0
      ? Math.max(...responses.map(r => r.percentage)) : 0;
    analytics.push({ quiz, attempts, avgScore, highestScore, responses: responses || [] });
  }
  return analytics;
}

// Format Firestore timestamp
function formatTimestamp(ts) {
  if (!ts) return '—';
  try {
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '—';
  }
}