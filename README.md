# SchoolChat 🎓

A real-time Discord-like chat application for school students to connect and communicate with friends. Built with HTML, CSS, JavaScript, Firebase, and Firebase Realtime Database.

## Features ✨

- **User Authentication** - Secure registration and login with Firebase Auth
- **Direct Messaging** - One-on-one conversations with other users
- **Group Channels** - Create and join public channels for group discussions
- **Real-time Updates** - Instant message delivery using Firebase Realtime Database
- **User Profiles** - View user information and online status
- **Online Status** - See who's online and when users were last active
- **Message History** - Access all previous messages in conversations
- **Search Functionality** - Find users to start conversations
- **Responsive Design** - Works on desktop and mobile devices
- **Modern UI** - Discord-inspired interface with smooth animations

## Tech Stack 🛠️

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Firebase Firestore, Firebase Realtime Database
- **Authentication**: Firebase Authentication
- **Real-time**: Firebase Realtime Database
- **Storage**: Firestore for data persistence

## Prerequisites 📋

Before you begin, ensure you have:
- A Firebase project (create one at [firebase.google.com](https://firebase.google.com))
- A modern web browser
- Internet connection

## Setup Instructions 🚀

### Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a new project"
3. Enter project name: `SchoolChat`
4. Enable Google Analytics (optional)
5. Create the project

### Step 2: Enable Firebase Services

1. **Enable Firestore:**
   - In Firebase Console, click "Build" → "Firestore Database"
   - Click "Create database"
   - Select "Start in test mode" (for development)
   - Choose a location
   - Click "Enable"

2. **Enable Realtime Database:**
   - Click "Build" → "Realtime Database"
   - Click "Create Database"
   - Select "Start in test mode"
   - Choose a location (same as Firestore)
   - Click "Enable"

3. **Enable Firebase Authentication:**
   - Click "Build" → "Authentication"
   - Click "Get started"
   - Enable "Email/Password" sign-in method
   - Click "Save"

### Step 3: Get Firebase Credentials

1. Click the gear icon (⚙️) at the top left → "Project settings"
2. Under "Your apps", click the web icon `</>`
3. Register an app with nickname "SchoolChat"
4. Copy the Firebase configuration object

### Step 4: Configure the App

1. Open `firebase-config.js`
2. Replace the Firebase configuration values with your own:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID",
    databaseURL: "YOUR_DATABASE_URL"
};
```

### Step 5: Add Firebase SDK

Firebase SDK scripts are already included in `index.html`:

```html
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js"></script>
```

### Step 6: Run the App

1. Open `index.html` in your web browser (or use a local server)
2. Create an account with email and password
3. Start chatting! 🎉

## File Structure 📁

```
school-chat-app/
├── index.html          # Main HTML file with UI structure
├── styles.css          # All styling (1000+ lines)
├── app.js             # Main app logic and chat initialization
├── auth.js            # Authentication (login/signup)
├── chat.js            # Real-time chat and messaging
├── firebase-config.js # Firebase configuration template
└── README.md          # This file
```

## Usage Guide 📖

### Creating an Account
1. Go to the app and click "Sign Up"
2. Enter username, email, and password
3. Click "Sign Up" button
4. You're now logged in!

### Starting a Direct Message
1. Click the "+" button next to "Direct Messages"
2. Search for a user by username or email
3. Click on the user to start a conversation
4. You're ready to chat!

### Creating a Channel
1. Click the "+" button next to "Channels"
2. Enter channel name (e.g., "general", "announcements")
3. Add an optional description
4. Click "Create Channel"
5. Everyone can see and join the channel

### Sending Messages
1. Select a conversation from the sidebar
2. Type your message in the input box
3. Press Enter or click Send button
4. Messages appear in real-time for all participants

### Searching Users
- Click the "+" button next to "Direct Messages"
- Type username or email in search box
- Results update as you type
- Click a user to start conversation

## Firebase Database Structure 🗄️

### Users Collection
```
users/
  {uid}/
    - username: string
    - email: string
    - createdAt: timestamp
    - status: string (online/offline/idle)
    - lastSeen: timestamp
```

### Channels Collection
```
channels/
  {channelId}/
    - name: string
    - description: string
    - createdBy: string (uid)
    - createdAt: timestamp
    - members: array (user IDs)
    - lastMessageTime: timestamp
    - lastMessage: string
```

### Direct Messages Collection
```
directMessages/
  {dmId}/
    - participants: array (two user IDs)
    - createdAt: timestamp
    - lastMessageTime: timestamp
    - lastMessage: string
```

### Messages Collection
```
messages/
  {messageId}/
    - chatId: string (channelId or dmId)
    - chatType: string (channel or dm)
    - authorId: string (uid)
    - authorName: string
    - text: string
    - timestamp: timestamp
```

## Firestore Security Rules 🔒

For production, update your Firestore rules. Go to Firestore → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own profile
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth.uid == userId;
    }
    
    // Anyone authenticated can read channels
    match /channels/{document=**} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.createdBy;
    }
    
    // Users can only access their own DMs
    match /directMessages/{dmId} {
      allow read, write: if request.auth.uid in resource.data.participants;
      allow create: if request.auth.uid in request.resource.data.participants;
    }
    
    // Messages rules
    match /messages/{document=**} {
      allow read: if request.auth != null;
      allow create: if request.auth.uid == request.resource.data.authorId;
      allow update, delete: if request.auth.uid == resource.data.authorId;
    }
  }
}
```

## Realtime Database Rules 🔐

Go to Realtime Database → Rules:

```json
{
  "rules": {
    "status": {
      "{uid}": {
        ".read": true,
        ".write": "auth.uid === $uid"
      }
    }
  }
}
```

## Keyboard Shortcuts ⌨️

- `Enter` - Send message (when focused on input)
- `Esc` - Close modals
- `+` buttons - Create new DM/Channel

## Troubleshooting 🔧

### "Firebase is not defined"
- Make sure Firebase SDK scripts are loaded before your app scripts
- Check your internet connection
- Verify script URLs in index.html
- Check browser console (F12) for errors

### Messages not sending
- Check browser console for errors (F12)
- Verify Firebase credentials are correct in `firebase-config.js`
- Check Firestore permissions/rules
- Ensure you're logged in

### Real-time updates not working
- Check Realtime Database rules
- Verify database URL is correct in `firebase-config.js`
- Check browser console for errors
- Try refreshing the page

### Users not appearing in search
- Ensure users have been created (sign up first)
- Check Firestore users collection exists
- Verify Firestore rules allow read access
- Wait a few seconds for data to sync

### "Cannot read property 'uid' of null"
- App is trying to load before Firebase initializes
- Make sure `firebase-config.js` loads before other scripts
- Check that Firebase SDK loads successfully

## Features Coming Soon 🚧

- Image/file sharing
- Emoji reactions
- Message editing and deletion UI
- Voice/video calls
- Typing indicators
- User profiles with bio/avatar
- Message search
- Browser notification system
- Dark mode toggle
- Admin controls for channels
- Message threading
- User presence indicators

## Deployment 🌐

### Deploy to Firebase Hosting

1. **Install Firebase CLI:**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase:**
   ```bash
   firebase login
   ```

3. **Initialize project:**
   ```bash
   firebase init hosting
   ```

4. **Deploy:**
   ```bash
   firebase deploy
   ```

### Deploy to Other Hosting Services

You can also deploy to:
- GitHub Pages
- Netlify
- Vercel
- AWS S3
- Any static hosting service

Just upload all files to your hosting service!

## Performance Tips ⚡

- Messages are limited to 50 for initial load (for performance)
- Real-time listeners only active on current chat
- Avoid loading all users at once on large servers
- Use indexes in Firestore for better query performance

## Security Notes 🔐

- Never commit your `firebase-config.js` with real credentials to public repos
- Use environment variables for sensitive data in production
- Review Firestore rules regularly
- Implement rate limiting for message sending
- Validate all user inputs on backend

## Contributing 🤝

Feel free to fork, modify, and improve this project!

## Support & Issues 💬

If you encounter any issues:
1. Check the browser console (F12) for error messages
2. Verify all Firebase configuration is correct
3. Check Firebase console for any errors or quota issues
4. Review the Troubleshooting section above
5. Check Firebase documentation

## License 📄

This project is open source and available for educational purposes.

## Credits 👏

Built as a school communication platform inspired by Discord.

---

**Happy Chatting! 🎉**

For questions or improvements, feel free to reach out!
