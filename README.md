# StudyBuddy

StudyBuddy is a full-stack web application designed to help students find and connect with study partners based on shared interests, location, and study habits. The platform features user registration (with OTP/email verification), Google OAuth, profile completion, recommendations, swiping (like/dislike), mutual matches, and a chat-ready interface.

## Features

- **User Registration & Login** (Email/OTP, Google OAuth)
- **Profile Completion** (subjects, location, study time, personal info, preferences)
- **Profile Picture Upload** (Cloudinary)
- **Recommendations** (find users with similar interests)
- **Swipe UI** (like/dislike users, inspired by dating apps)
- **Mutual Matches** (see users who liked you back)
- **Filtering** (filter users by subject, language, gender, city, state, study time)
- **Edit Ratings** (change like/dislike for rated users)
- **Secure Authentication** (JWT-based)
- **Admin Features** (ban/unban users)
- **Ready for Messaging** (chat UI placeholder for matches)

## Project Structure

```
study_buddy/
  backend/      # Node.js/Express/MongoDB API
  frontend/     # React.js client
```

### Backend
- **Node.js + Express**
- **MongoDB (Mongoose)**
- **JWT Authentication**
- **Cloudinary for image uploads**
- **RESTful API**

#### Main Endpoints
- `/api/users/register` - Register with OTP
- `/api/users/login` - Login
- `/api/users/me` - Get current user
- `/api/users/recommendations` - Get recommended users
- `/api/interactions` - Like/dislike users
- `/api/interactions/my-mutual` - Get mutual matches
- ...and more (see `backend/routes/`)

### Frontend
- **React.js**
- **Modern, minimalist UI**
- **Routing with react-router**
- **Profile, Home, Recommendations, Matches pages**
- **Responsive and mobile-friendly**

## Setup Instructions

### Prerequisites
- Node.js (v16+ recommended)
- npm or yarn
- MongoDB (local or Atlas)
- Cloudinary account (for image uploads)

### 1. Clone the repository
```
git clone https://github.com/Rohanlobo15/StudyBuddy.git
cd StudyBuddy
```

### 2. Backend Setup
```
cd backend
npm install
# Create a .env file with the following variables:
# MONGO_URI=your_mongodb_uri
# JWT_SECRET=your_jwt_secret
# JWT_EXPIRE=7d
# SMTP_HOST=your_smtp_host
# SMTP_PORT=your_smtp_port
# SMTP_USER=your_smtp_user
# SMTP_PASSWORD=your_smtp_password
# ADMIN_REGISTRATION_CODE=your_admin_code
# CLOUDINARY_CLOUD_NAME=your_cloud_name
# CLOUDINARY_API_KEY=your_api_key
# CLOUDINARY_API_SECRET=your_api_secret
# CLIENT_URL=http://localhost:3000
npm start
```

### 3. Frontend Setup
```
cd ../frontend
npm install
# (Optional) Edit package.json proxy if backend runs on a different port
npm start
```

### 4. Usage
- Visit `http://localhost:3000` in your browser.
- Register, complete your profile, and start finding study buddies!

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](LICENSE) 