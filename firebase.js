/**
 * FIREBASE CONFIGURATION
 * ─────────────────────────────────────────────
 * Replace the config below with YOUR Firebase project config.
 * Find it in: Firebase Console → Project Settings → Your Apps → SDK setup
 *
 * HOW TO GET YOUR CONFIG:
 * 1. Go to https://console.firebase.google.com
 * 2. Click your project → Project Settings (gear icon)
 * 3. Scroll down to "Your apps" → click Web app (</>)
 * 4. Copy the firebaseConfig object and paste it below
 */

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAaTQmjRa0iacRisViHjKN4PnWZrDib74k",
  authDomain: "quiz-app-bdf3a.firebaseapp.com",
  projectId: "quiz-app-bdf3a",
  storageBucket: "quiz-app-bdf3a.firebasestorage.app",
  messagingSenderId: "618702863002",
  appId: "1:618702863002:web:2f8354f98bed37f3b2bd23"
};


// ── Initialize Firebase ──────────────────────
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ─────────────────────────────────────────────
// AUTH HELPERS
// ─────────────────────────────────────────────

// Get current logged in user
function getCurrentUser() {
  return new Promise((resolve) => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      unsubscribe();
      resolve(user);
    });
  });
}

// Redirect to login if not authenticated
async function requireAuth(redirectTo = 'login.html') {
  const user = await getCurrentUser();
  if (!user) {
    window.location.href = redirectTo;
    return null;
  }
  return user;
}

// Sign up
async function signUp(email, password) {
  try {
    const result = await auth.createUserWithEmailAndPassword(email, password);
    return { data: result.user, error: null };
  } catch (e) {
    return { data: null, error: e };
  }
}

// Sign in
async function signIn(email, password) {
  try {
    const result = await auth.signInWithEmailAndPassword(email, password);
    return { data: result.user, error: null };
  } catch (e) {
    return { data: null, error: e };
  }
}

// Sign out
async function signOut() {
  try {
    await auth.signOut();
    return { error: null };
  } catch (e) {
    return { error: e };
  }
}

// ─────────────────────────────────────────────
// QUIZ HELPERS
// ─────────────────────────────────────────────

// Create a new quiz
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

// Get all quizzes for a user
async function getUserQuizzes(userId) {
  try {
    const snap = await db.collection('quizzes')
      .where('user_id', '==', userId)
      .orderBy('created_at', 'desc')
      .get();
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return { data, error: null };
  } catch (e) {
    return { data: null, error: e };
  }
}

// Get a single quiz by ID
async function getQuiz(quizId) {
  try {
    const doc = await db.collection('quizzes').doc(quizId).get();
    if (!doc.exists) return { data: null, error: { message: 'Quiz not found' } };
    return { data: { id: doc.id, ...doc.data() }, error: null };
  } catch (e) {
    return { data: null, error: e };
  }
}

// Delete a quiz and all its data
async function deleteQuiz(quizId) {
  try {
    // Delete questions
    const qSnap = await db.collection('questions').where('quiz_id', '==', quizId).get();
    const batch1 = db.batch();
    qSnap.docs.forEach(d => batch1.delete(d.ref));
    await batch1.commit();

    // Delete responses
    const rSnap = await db.collection('responses').where('quiz_id', '==', quizId).get();
    const batch2 = db.batch();
    rSnap.docs.forEach(d => batch2.delete(d.ref));
    await batch2.commit();

    // Delete quiz
    await db.collection('quizzes').doc(quizId).delete();
    return { error: null };
  } catch (e) {
    return { error: e };
  }
}

// ─────────────────────────────────────────────
// QUESTION HELPERS
// ─────────────────────────────────────────────

// Insert multiple questions
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

// Get all questions for a quiz
async function getQuizQuestions(quizId) {
  try {
    const snap = await db.collection('questions')
      .where('quiz_id', '==', quizId)
      .get();
    // Sort by created_at client-side to avoid composite index requirement
    const data = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => {
        const ta = a.created_at?.toMillis?.() || 0;
        const tb = b.created_at?.toMillis?.() || 0;
        return ta - tb;
      });
    return { data, error: null };
  } catch (e) {
    return { data: null, error: e };
  }
}

// ─────────────────────────────────────────────
// RESPONSE HELPERS
// ─────────────────────────────────────────────

// Save a quiz response
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

// Get all responses for a quiz
async function getQuizResponses(quizId) {
  try {
    const snap = await db.collection('responses')
      .where('quiz_id', '==', quizId)
      .get();
    const data = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => {
        const ta = a.created_at?.toMillis?.() || 0;
        const tb = b.created_at?.toMillis?.() || 0;
        return tb - ta;
      });
    return { data, error: null };
  } catch (e) {
    return { data: null, error: e };
  }
}

// Get analytics for all user quizzes
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

// ── Format Firestore timestamp to readable date ──
function formatTimestamp(ts) {
  if (!ts) return '—';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
