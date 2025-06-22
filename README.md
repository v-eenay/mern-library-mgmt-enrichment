# MERN Stack HRMS (Human Resource Management System)

A full-stack Human Resource Management System built with the MERN stack (MongoDB, Express.js, React, Node.js) using TypeScript.

## 🚀 Tech Stack

### Frontend
- **React** with TypeScript
- **React Router** for navigation
- **CSS3** for styling

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose
- **TypeScript** for type safety

## 📁 Project Structure

```
hrms-mern/
├── frontend/          # React TypeScript application
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   └── ...
│   └── package.json
├── backend/           # Node.js Express API
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── server.js         # Entry point
│   └── package.json
└── README.md
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB
- npm or yarn

### Backend Setup
```bash
cd backend
npm install
npm start
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## 📋 Features

- **Employee Management** - Add, view, update, and delete employee records
- **Department Management** - Organize employees by departments
- **Attendance Tracking** - Monitor employee attendance
- **Responsive Design** - Works on desktop and mobile devices

## 🌐 API Endpoints

The backend provides RESTful API endpoints for:
- `/api/employees` - Employee CRUD operations
- `/api/departments` - Department management
- `/api/attendance` - Attendance tracking

## 🚀 Development

1. Clone the repository
2. Install dependencies for both frontend and backend
3. Start the development servers
4. The frontend runs on `http://localhost:3000`
5. The backend API runs on `http://localhost:5000`

## 📝 License

This project is for educational purposes as part of Summer Enrichment 2025.

---

Built with ❤️ using the MERN stack