# Multi-Vendor Purchase Order Generator

## Quick Start Guide

### Prerequisites
- Node.js (v16+)
- MongoDB running locally or MongoDB Atlas connection string
- Optional: Gmail account for email functionality

### Setup Steps

1. **Install Dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend  
   cd ../frontend
   npm install
   ```

2. **Configure Environment**
   ```bash
   cd backend
   copy .env.example .env
   # Edit .env with your MongoDB URI and SMTP credentials
   ```

3. **Initialize Database**
   ```bash
   cd backend
   node initDB.js
   ```

4. **Start Backend**
   ```bash
   cd backend
   npm run dev
   ```

5. **Start Frontend** (new terminal)
   ```bash
   cd frontend
   npm run dev
   ```

6. **Access Application**
   - Open http://localhost:5173
   - Login with: admin@supermart.com / admin123

### Project Structure
```
po-generator/
├── backend/         # Node.js + Express + MongoDB
└── frontend/        # React + Vite
```

### For Full Documentation
See README.md for:
- Detailed features
- API documentation
- Usage workflow
- Deployment guide
- Troubleshooting
