/**
 * SUPABASE CONFIGURATION
 * ----------------------
 * Find your keys in: Supabase Dashboard → Project Settings → API
 *
 * IMPORTANT: Your ANON KEY must start with "eyJ..." and be very long.
 * What you had before was NOT a valid anon key.
 * Go to Supabase → Project Settings → API → copy the "anon public" key
 */

const SUPABASE_URL = 'https://wuoglmrnuerrciezwxmg.supabase.co';

// ⚠️ REPLACE THIS with your real anon key from Supabase Dashboard
// It should start with eyJ and be about 200+ characters long
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1b2dsbXJudWVycmNpZXp3eG1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMzYwNzIsImV4cCI6MjA4NzYxMjA3Mn0.fQT-iKth0SnJFlmbdwisJeRC9-YUPtwU85Yh3TSIuXE';

// ✅ FIX: renamed from "supabase" to "dbClient" to avoid conflict
// with the Supabase CDN library which also uses the name "supabase"
const dbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// ─────────────────────────────────────────
// AUTH HELPERS
// ─────────────────────────────────────────

async function getCurrentUser() {
  const { data: { user } } = await dbClient.auth.getUser();
  return user;
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
  return await dbClient.auth.signUp({ email, password });
}

async function signIn(email, password) {
  return await dbClient.auth.signInWithPassword({ email, password });
}

async function signOut() {
  return await dbClient.auth.signOut();
}


// ─────────────────────────────────────────
// QUIZ HELPERS
// ─────────────────────────────────────────

async function createQuiz(userId, title, description, timerSeconds) {
  return await dbClient
    .from('quizzes')
    .insert([{ user_id: userId, title, description, timer_seconds: timerSeconds }])
    .select()
    .single();
}

async function getUserQuizzes(userId) {
  return await dbClient
    .from('quizzes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
}

async function getQuiz(quizId) {
  return await dbClient
    .from('quizzes')
    .select('*')
    .eq('id', quizId)
    .single();
}

async function deleteQuiz(quizId) {
  await dbClient.from('questions').delete().eq('quiz_id', quizId);
  await dbClient.from('responses').delete().eq('quiz_id', quizId);
  return await dbClient.from('quizzes').delete().eq('id', quizId);
}


// ─────────────────────────────────────────
// QUESTION HELPERS
// ─────────────────────────────────────────

async function insertQuestions(questions) {
  return await dbClient.from('questions').insert(questions);
}

async function getQuizQuestions(quizId) {
  return await dbClient
    .from('questions')
    .select('*')
    .eq('quiz_id', quizId)
    .order('created_at', { ascending: true });
}


// ─────────────────────────────────────────
// RESPONSE HELPERS
// ─────────────────────────────────────────

async function saveResponse(quizId, score, totalQuestions, percentage) {
  return await dbClient
    .from('responses')
    .insert([{ quiz_id: quizId, score, total_questions: totalQuestions, percentage }])
    .select()
    .single();
}

async function getQuizResponses(quizId) {
  return await dbClient
    .from('responses')
    .select('*')
    .eq('quiz_id', quizId)
    .order('created_at', { ascending: false });
}

async function getAnalytics(userId) {
  const { data: quizzes } = await getUserQuizzes(userId);
  if (!quizzes) return [];

  const analytics = [];
  for (const quiz of quizzes) {
    const { data: responses } = await getQuizResponses(quiz.id);
    const attempts = responses ? responses.length : 0;
    const avgScore = attempts > 0
      ? responses.reduce((sum, r) => sum + r.percentage, 0) / attempts
      : 0;
    const highestScore = attempts > 0
      ? Math.max(...responses.map(r => r.percentage))
      : 0;
    analytics.push({ quiz, attempts, avgScore, highestScore, responses: responses || [] });
  }
  return analytics;
}