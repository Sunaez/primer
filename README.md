# Primer App

## Overview
Primer is a brain-training application designed to counteract the negative effects of modern digital entertainment. It helps users enhance cognitive abilities like attention, memory, and reaction time through engaging games based on neuroscience research. The app is free to use and encourages consistency through gamification elements such as streaks and daily challenges.

## Features
- **Cognitive Training Games**: Play games designed to improve reaction speed, memory, and focus.
- **Daily Streak Tracking**: Encourages users to engage regularly for continuous improvement.
- **Personalization**: Customizable themes and settings.
- **Data-Driven Approach**: Based on cognitive research to ensure real benefits.

## Installation & Setup
### 1. Clone the Repository
```sh
 git clone https://github.com/your-repo/primer-app.git
 cd primer-app
```

### 2. Install Dependencies
Ensure you have Node.js and Expo installed. Then, run:
```sh
 npm install
```

### 3. Setup Firebase
Primer uses Firebase for authentication and data storage. To set up Firebase:

#### **Step 1: Create a Firebase Project**
1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** and follow the setup steps.
3. Enable **Authentication** (Email/Password, Google, etc.).
4. Enable **Firestore Database** (in test mode for development).
5. Enable **Storage** if needed.

#### **Step 2: Get Firebase Config Keys**
1. In your Firebase project settings, navigate to **Project Settings** > **General**.
2. Under **Your Apps**, click **Add App** (choose Web if Expo is being used).
3. Register your app and copy the Firebase configuration keys.

#### **Step 3: Configure `.env` File**
Create a `.env` file in the root directory and add your Firebase credentials:
```sh
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 4. Run the App
Start the development server:
```sh
 npm start
```
Or if using Expo:
```sh
 expo start
```

### 5. Build for Production
To create a production build:
```sh
 expo build
```

## Contribution
- Fork the repository.
- Create a new branch (`feature-branch-name`).
- Commit changes and push.
- Create a pull request.

## License
This project is open-source and free for all users. No subscription is required to access features.

## Contact
For support, contact **Aland Azad** at [220109420@aston.ac.uk](mailto:220109420@aston.ac.uk).

