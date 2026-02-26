# QuizForge — Smart Quiz Builder

A complete, production-ready quiz creation and analytics platform.
**Live at:** https://quizeworld.netlify.app

---

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Firebase (Firestore + Auth) — asia-south1 Mumbai region
- **Email**: EmailJS (free — sends OTP emails via Gmail)
- **Charts**: Chart.js
- **Hosting**: Netlify

---

## File Structure

```
quiz-app/
├── index.html           ← Landing page
├── login.html           ← Login / Sign Up / OTP / Forgot Password
├── dashboard.html       ← Quiz creator (protected)
├── quiz.html            ← Public quiz player
├── result.html          ← Results + review page
├── analytics.html       ← Analytics (protected)
├── style.css            ← All styles + dark mode
├── script.js            ← Shared utilities
├── firebase.js          ← Firebase config + all DB helpers
├── firestore.rules      ← Firestore security rules
├── PROJECT_CONTEXT.txt  ← AI context file (share with AI to modify project)
└── README.md            ← This file
```

---

## Firebase Setup

### Step 1 — Create Firebase Project
1. Go to console.firebase.google.com
2. Click Add Project → name it → create
3. Register a Web App → copy the config object

### Step 2 — Enable Authentication
1. Firebase Console → Authentication → Sign-in method
2. Enable: Email/Password (both toggles ON including Email link)
3. Enable: Google
4. Add Authorized domains: quizeworld.netlify.app, localhost

### Step 3 — Create Firestore Database
1. Firebase Console → Firestore Database → Create database
2. Choose asia-south1 (Mumbai) region
3. Start in test mode

### Step 4 — Set Firestore Rules
Go to Firestore → Rules tab → paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /email_otps/{email} {
      allow read, write: if true;
    }
    match /otp_passwords/{email} {
      allow read, write: if true;
    }
    match /quizzes/{quizId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /questions/{questionId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /responses/{responseId} {
      allow read, write: if true;
    }
  }
}
```

---

## EmailJS Setup

1. Sign up at emailjs.com
2. Add Gmail as a service (Service ID: quizforge_service)
3. Create a template (Template ID: quizforge_otp) with:
   - To Email: {{to_email}}
   - Subject: Your QuizForge OTP: {{otp}}
   - Body: Your OTP is: {{otp}} — expires in 10 minutes.
4. Copy your Public Key from Account page
5. Update login.html and dashboard.html: emailjs.init("YOUR_PUBLIC_KEY")

---

## CSV Import Format

```csv
Question,Option A,Option B,Option C,Option D,Correct Option
What is 2+2?,3,4,5,6,B
What color is the sky?,Red,Green,Blue,Yellow,C
```

---

## Deploy

```bash
git add .
git commit -m "your message"
git push
netlify deploy --prod --dir=.
```

---

## Features

| Feature | Status |
|---|---|
| Email + Password Login | YES |
| Google OAuth Login | YES |
| Email OTP Login (passwordless) | YES |
| Sign Up with personal details (name, username) | YES |
| Username availability check (real-time) | YES |
| Forgot Password via OTP email | YES |
| Set New Password after OTP verify | YES |
| User profile dropdown in navbar | YES |
| Edit profile (name, username, phone) | YES |
| Change password from dashboard | YES |
| Password strength meter | YES |
| Password eye toggle (show/hide) | YES |
| Dark mode with persistence | YES |
| Protected dashboard (auth required) | YES |
| Create quiz (title, description, timer) | YES |
| Add questions manually | YES |
| CSV question import with preview | YES |
| Drag and drop CSV upload | YES |
| Delete quiz | YES |
| Share quiz link (copy to clipboard) | YES |
| Public quiz player (no login needed) | YES |
| Per-question countdown timer | YES |
| Auto-advance on timer expiry | YES |
| Progress bar | YES |
| Score calculation | YES |
| Results page with answer review | YES |
| Analytics dashboard | YES |
| Score distribution chart (Chart.js) | YES |
| Response history table | YES |
| Mobile responsive | YES |

---

## Authentication Flows

### Email OTP (passwordless)
1. Enter email → OTP sent via EmailJS
2. Enter 6-digit OTP → verified in Firestore
3. Logged in (account auto-created if new)

### Forgot Password
1. Click "Forgot password?" → enter email
2. OTP sent via EmailJS
3. Enter OTP → verified
4. Set new password screen appears
5. Password updated → redirected to dashboard

### Forgot Password from Dashboard
1. Dropdown → Forgot Password
2. OTP sent to your email
3. Logged out → redirected to login page
4. Forgot tab opens with email pre-filled and OTP step shown
5. Enter OTP → set new password → done

---

## Firestore Collections

| Collection | Purpose |
|---|---|
| users | User profiles (name, username, email, phone) |
| quizzes | Quiz metadata |
| questions | Quiz questions |
| responses | Quiz attempt results |
| email_otps | OTP codes for login and password reset |
| otp_passwords | Auto-generated passwords for OTP accounts |

---

## Troubleshooting

**OTP login redirects back to login page**
- Check Firebase Auth authorized domains includes your Netlify URL
- firebase.js must call auth.setPersistence(LOCAL) before sign-in

**INVALID_LOGIN_CREDENTIALS error**
- Delete the document from Firestore otp_passwords collection for your email
- Delete your user from Firebase Auth → Users tab
- Try again fresh

**EmailJS email not arriving**
- Check spam/junk folder
- Go to EmailJS dashboard → test the service
- Make sure template has {{to_email}} in the To field

**Firestore rules error on save**
- Paste ONLY the rules code, no surrounding text

---

## Modifying with AI

Share PROJECT_CONTEXT.txt with any AI assistant. It contains everything
needed to understand and modify this project correctly.

Example prompt:
"Here is my PROJECT_CONTEXT.txt for my QuizForge app.
Please add a leaderboard to the quiz result page.
Use Firebase v8 compat syntax and keep EmailJS config."