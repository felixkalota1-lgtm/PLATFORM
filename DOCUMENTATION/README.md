# Platform Sales & Procurement Marketplace (PSPM)

A comprehensive B2B marketplace platform for buying, selling, and managing products with integrated inventory, warehouse, logistics, HR, and accounting modules.

## 🚀 Features

### Core Marketplace
- **Product Discovery**: Browse and search products from multiple vendors
- **Vendor Management**: Save vendors, view profiles, track performance
- **Shopping Cart**: Add to cart and bulk checkout functionality
- **Smart Search**: Filter by category, price, availability, vendor

### Inventory & Warehouse
- **Bulk Upload**: Excel-based product import with automatic validation
- **AI Integration**: Auto-generate product descriptions and images
- **Stock Tracking**: Real-time inventory level monitoring
- **2D Warehouse Map**: Visual location tracking (Zone/Aisle/Shelf/Bin)
- **Reorder Alerts**: Automatic notifications when stock hits threshold

### Procurement System
- **Inquiry Management**: Create inquiries by product or vendor search
- **Quote Processing**: Sellers respond with quotations
- **Order Management**: Convert quotes to orders with tracking
- **Purchase History**: View all historical transactions

### Logistics & Transportation
- **Shipment Tracking**: Real-time order tracking with GPS
- **Fleet Management**: Vehicle location and status monitoring
- **Maintenance Scheduling**: Track spare parts and maintenance intervals
- **Auto-Alerts**: Warnings when maintenance is overdue

### HR & Payroll
- **Employee Management**: Complete employee database
- **Attendance Tracking**: Check-in/check-out with hours calculation
- **Payroll Processing**: Automated salary calculations
- **Contract Management**: Contract expiry alerts and renewals
- **Job Postings**: Post and manage job openings
- **Department Management**: Organize teams and reporting structure

### Accounting & Finance
- **Invoice Generation**: Create and manage invoices
- **Payment Tracking**: Monitor paid/unpaid invoices
- **Financial Reports**: Comprehensive business analytics
- **Budget Management**: Track departmental budgets
- **Tax Calculations**: Automated tax computation

### Analytics & Reporting
- **Sales Dashboard**: Real-time sales metrics
- **Top Products**: Identify best-selling items
- **Revenue Analysis**: Track income trends
- **Inventory Valuation**: Calculate inventory worth
- **Employee Metrics**: Productivity and payroll analytics
- **Financial Reports**: Complete business intelligence

### Internal Communication
- **Team Messaging**: Internal chat system
- **Notifications**: Real-time alerts for:
  - New inquiries
  - Quote responses
  - Order confirmations
  - Document expiry
  - Contract renewals
  - Low inventory

### Company Management
- **Multi-User Support**: Multiple users per company with role assignment
- **Role-Based Access**: Admin, Manager, Staff, Vendor, Buyer roles
- **Document Management**: Store and track company documents
- **Settings Management**: Configure company preferences

## 🛠️ Tech Stack

### Frontend
- **React 18**: UI framework with hooks
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **Tailwind CSS**: Utility-first styling
- **React Router**: Client-side navigation

### State Management
- **Zustand**: Lightweight global state
- **React Context**: Local component state

### Backend & Services
- **Firebase**:
  - Authentication (Email/Password)
  - Firestore (NoSQL database)
  - Cloud Storage (File uploads)
  - Cloud Functions (Backend logic)
  - Pub/Sub (Real-time messaging)
  - Scheduler (Cron jobs)

### Data & Forms
- **React Hook Form**: Form state management
- **Zod**: Schema validation
- **xlsx**: Excel file processing

### UI Components
- **Lucide React**: Icon library
- **Framer Motion**: Animations
- **React Hot Toast**: Notifications
- **Recharts**: Data visualization

### Additional Libraries
- **Axios**: HTTP client
- **Date-fns**: Date utilities
- **Lodash**: Utility functions
- **React DnD**: Drag and drop

## 📋 Installation

### Prerequisites
- Node.js 16+ and npm/yarn
- Firebase project (create at firebase.google.com)

### Setup Steps

1. **Clone the repository**
```bash
git clone <repository-url>
cd platform-sales-procurement
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure Firebase**
- Create a Firebase project at console.firebase.google.com
- Copy your credentials
- Create `.env.local` in the root directory:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

4. **Enable Firebase Services**
   - Go to Firebase Console
   - Enable Authentication (Email/Password)
   - Create Firestore Database (start in test mode)
   - Enable Cloud Storage
   - Enable Cloud Functions
   - Enable Pub/Sub and Scheduler

5. **Start development server**
```bash
npm run dev
```

The app will be available at `http://localhost:5173/`

## 📚 Documentation

For detailed setup instructions, Firebase service configuration, and feature roadmap, see:
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Complete setup and Firebase configuration
- **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** - Code organization
- **[API_REFERENCE.md](./API_REFERENCE.md)** - Service APIs and methods

## 🗂️ Project Structure

```
src/
├── modules/              # Feature modules
│   ├── marketplace/
│   ├── inventory/
│   ├── procurement/
│   ├── warehouse/
│   ├── logistics/
│   ├── hr/
│   ├── analytics/
│   ├── accounting/
│   └── communication/
├── components/           # Reusable components
├── services/            # API and Firebase services
├── store/               # Global state management
├── hooks/               # Custom React hooks
├── types/               # TypeScript interfaces
├── pages/               # Page components
└── styles/              # Global styles
```

## 🔐 Security

- **Role-Based Access Control**: Different permissions for each user role
- **Data Encryption**: HTTPS for all communications
- **Firestore Security Rules**: Enforce authorization at database level
- **JWT Authentication**: Secure token-based auth
- **Private/Public Settings**: Control data visibility

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Firebase Hosting
```bash
firebase login
firebase init hosting
firebase deploy
```

### Environment Configuration
- Production env variables in `.env.production`
- Development env variables in `.env.local`
- Never commit sensitive credentials

## 📊 Database Schema

The application uses Firestore with the following main collections:
- `users` - User accounts and roles
- `companies` - Company information
- `products` - Product listings
- `orders` - Purchase orders
- `inquiries` - Procurement inquiries
- `quotes` - Seller quotations
- `employees` - HR employee records
- `shipments` - Logistics tracking
- `invoices` - Financial documents
- `notifications` - User notifications

## 🎯 Development Workflow

1. **Create a feature branch**
```bash
git checkout -b feature/your-feature-name
```

2. **Make your changes** following TypeScript and component best practices

3. **Test thoroughly** (unit tests, integration tests)

4. **Commit with clear messages**
```bash
git commit -m "feat: add new feature"
```

5. **Push and create a pull request**

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🐛 Troubleshooting

### Issues with Firebase
- Ensure `.env.local` is in root directory
- Verify Firebase project credentials are correct
- Check Firestore security rules allow access

### Performance Issues
- Clear browser cache
- Rebuild with `npm run build`
- Check network tab in DevTools

### Module Not Found Errors
- Run `npm install` to ensure all dependencies installed
- Check import paths match file locations

## 🤝 Contributing

1. Follow the existing code style
2. Write TypeScript with full type safety
3. Add tests for new features
4. Update documentation
5. Submit PRs with clear descriptions

## 📄 License

This project is proprietary. All rights reserved.

## 📞 Support

For issues, questions, or feature requests, contact the development team.

---

**Current Status**: 🟢 Development Active
**Last Updated**: December 12, 2025
**Version**: 1.0.0-beta

