# Multi-Vendor Purchase Order Generator

A production-ready web application for automating purchase order generation for supermarket owners. The system automatically detects low-stock items, groups them by vendor, and generates professional PDF purchase orders with email and WhatsApp delivery options.

## Features

- 🏪 **Vendor Management** - Create and manage supplier information with contact preferences
- 📦 **Inventory Tracking** - Monitor stock levels with automated reorder point alerts
- 🔄 **Automated PO Generation** - Automatically generate purchase orders for low-stock items
- 📄 **Professional PDF Creation** - Generate formatted purchase order PDFs
- 📧 **Email Delivery** - Send POs directly to vendor emails via SMTP
- 💬 **WhatsApp Integration** - Generate shareable PDF links for WhatsApp delivery
- 📊 **Dashboard Analytics** - Real-time overview of inventory and purchase orders
- 🔐 **Secure Authentication** - Session-based admin authentication

## Tech Stack

**Frontend:**
- React 18 with React Router
- Vite (build tool)
- Axios for API calls
- Modern CSS with design tokens

**Backend:**
- Node.js with Express
- MongoDB with Mongoose
- PDFKit for PDF generation
- Nodemailer for email delivery
- Express Session for authentication

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- SMTP credentials (for email functionality)

## Installation

### 1. Clone and Setup

```bash
# Navigate to the project directory
cd c:\Users\DELL\Desktop\consultancy\po-generator

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Environment Configuration

Create a `.env` file in the `backend` folder:

```bash
cd backend
copy .env.example .env
```

Edit `.env` with your configuration:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/po-generator

# Server Configuration
PORT=5000
NODE_ENV=development

# Session Configuration
SESSION_SECRET=your-super-secret-session-key-change-this-in-production

# SMTP Email Configuration (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password

# Application Configuration
STORE_NAME=SuperMart Retail Store
STORE_ADDRESS=123 Main Street, City, State, ZIP
STORE_EMAIL=admin@supermart.com
STORE_PHONE=+1-234-567-8900

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

**Gmail SMTP Setup:**
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password: Google Account → Security → 2-Step Verification → App passwords
3. Use the generated 16-character password in `SMTP_PASS`

### 3. Database Setup

Make sure MongoDB is running, then create an admin user:

```javascript
// In MongoDB shell or MongoDB Compass
use po-generator

db.users.insertOne({
  email: "admin@supermart.com",
  password: "$2a$10$xQZ9YxJZ8YG8KQxJZ8YG8.YG8KQxJZ8YG8KQxJZ8YG8KQxJZ8YG8K", // "admin123"
  name: "Admin User",
  role: "ADMIN",
  createdAt: new Date(),
  updatedAt: new Date()
})
```

Or run the provided initialization script:

```bash
cd backend
node initDB.js
```

## Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
The backend will start on `http://localhost:5000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
The frontend will start on `http://localhost:5173`

### Default Login Credentials

```
Email: admin@supermart.com
Password: admin123
```

## Usage Workflow

### 1. Add Vendors
- Navigate to **Vendors** page
- Click "Add Vendor"
- Fill in vendor details (name, email, phone, WhatsApp, address)
- Select preferred communication method

### 2. Manage Inventory
- Navigate to **Inventory** page
- Click "Add Product"
- Enter product details:
  - SKU and name
  - Select vendor
  - Set current stock level
  - Define reorder point (when to reorder)
  - Define reorder quantity (how much to order)
  - Set unit price

### 3. Monitor Stock Levels
- **Dashboard** shows low-stock alerts
- Products with `currentStock ≤ reorderPoint` are flagged
- View all low-stock items in the Inventory page

### 4. Generate Purchase Orders
- Navigate to **Purchase Orders** page
- Click "Generate POs"
- System automatically:
  - Detects all low-stock products
  - Groups products by vendor
  - Creates separate PO for each vendor
  - Generates unique PO number

### 5. Review and Send POs
- Draft POs appear in the Purchase Orders page
- Click "Review & Send" on a draft PO
- Review order details and total amount
- Choose delivery method:
  - **Email**: Sends PDF directly to vendor's email
  - **WhatsApp**: Generates shareable PDF link
- Click "Send" to deliver

### 6. Track Orders
- Mark orders as "Received" when delivered
- Download PDFs anytime
- Filter by status (Draft, Sent, Received)

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Vendors
- `GET /api/vendors` - Get all vendors
- `POST /api/vendors` - Create vendor
- `PUT /api/vendors/:id` - Update vendor
- `DELETE /api/vendors/:id` - Delete vendor (soft delete)

### Products
- `GET /api/products` - Get all products
- `GET /api/products/low-stock` - Get low-stock products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product (soft delete)

### Purchase Orders
- `POST /api/purchase-orders/generate` - Generate POs from low-stock items
- `GET /api/purchase-orders` - Get all purchase orders
- `GET /api/purchase-orders/:id` - Get single purchase order
- `PUT /api/purchase-orders/:id` - Update PO status
- `POST /api/purchase-orders/:id/send` - Send PO to vendor
- `GET /api/purchase-orders/:id/pdf` - Download PDF
- `DELETE /api/purchase-orders/:id` - Delete draft PO

## Project Structure

```
po-generator/
├── backend/
│   ├── config/          # Database configuration
│   ├── models/          # Mongoose models
│   ├── controllers/     # Business logic
│   ├── routes/          # API routes
│   ├── middleware/      # Authentication middleware
│   ├── utils/           # PDF and email utilities
│   ├── uploads/         # Generated PDF storage
│   └── server.js        # Express server
└── frontend/
    └── src/
        ├── components/  # Reusable UI components
        ├── pages/       # Main application pages
        ├── context/     # React context (Auth)
        ├── services/    # API service layer
        └── index.css    # Global styles
```

## Assumptions & Limitations

> [!IMPORTANT]
> **Single Store Support**
> - The application is designed for a single retail store
> - No multi-branch or multi-location support
> - All inventory is managed centrally

> [!IMPORTANT]
> **Single Vendor per SKU**
> - Each product/SKU is associated with exactly one vendor
> - No support for multi-vendor sourcing for the same product
> - Vendor switching requires manual product update

> [!IMPORTANT]
> **No Vendor Acknowledgment System**
> - The system does not track vendor confirmations
> - No automatic delivery date capture
> - Status updates are manual (admin must mark as "Received")

> [!IMPORTANT]
> **Email Delivery Dependencies**
> - Email functionality requires valid SMTP configuration
> - Application works without SMTP, but emails won't send
> - WhatsApp delivery is manual (copy/paste link)

> [!IMPORTANT]
> **No Real-Time WhatsApp Integration**
> - WhatsApp feature generates shareable PDF links
> - No actual WhatsApp API integration
> - Admin must manually share the link

> [!IMPORTANT]
> **Session-Based Authentication**
> - Uses server-side sessions (not JWT)
> - Sessions expire after 24 hours
> - Single admin role (no role-based permissions)

## Production Deployment

### Environment Variables
- Set `NODE_ENV=production`
- Use strong `SESSION_SECRET`
- Configure production MongoDB URI
- Set up production SMTP credentials

### Security Considerations
- Use HTTPS in production
- Set secure cookie flags
- Implement rate limiting
- Add input validation
- Regular database backups

### Performance
- Enable MongoDB indexes
- Configure CORS for production domain
- Implement pagination for large datasets
- Cache frequently accessed data

## Troubleshooting

**MongoDB Connection Error:**
- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env`
- Verify network access to MongoDB

**Email Sending Fails:**
- Verify SMTP credentials
- Check Gmail App Password generation
- Ensure port 587 is not blocked by firewall

**Login Not Working:**
- Verify admin user exists in database
- Check password hash (use `initDB.js` script)
- Clear browser cookies and try again

**PDF Generation Error:**
- Ensure `uploads/pos` directory exists
- Check write permissions on the directory
- Verify PDFKit installation

## License

MIT License - feel free to use this project for educational or commercial purposes.

## Support

For issues or questions, please refer to the code documentation and comments throughout the application.

---

**Built with ❤️ for supermarket inventory management**
# test
