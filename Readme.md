# SwiftParcel - Server

Server-side application for **SwiftParcel**, a parcel management system.  
This backend handles parcel CRUD operations, analytics, CSV/PDF exports, and user authentication.

### Features

- **Parcel Management**: Create, read, update, delete parcels.
- **User Management**: Authentication and role-based access.
- **Analytics**: Parcel status counts, user-specific reports.
- **Exports**: Generate CSV and PDF reports for parcels.
- **Real-time Updates**: WebSocket/Socket.IO support for parcel status changes.

### Tech Stack

- **Node.js** with **Express**
- **MongoDB** (NoSQL database)
- **Socket.IO** (optional for real-time updates)
- **PDFKit** for PDF generation
- **CSV export** support
- **FIrebase-admin/JWT** for authentication

### Installation

1. Clone the repo:

```
git clone https://github.com/3z4z/swift-parcel-be.git
cd swift-parcel-be
```

2. Install dependencies:

```
npm install
```

3. Set up environment variables (.env):

```
PORT=3000
MONGO_URI=<your-mongodb-uri>
JWT_SECRET=<your-secret-key>
FB_SERVICE_KEY=<your-encoded-firebase-service-key>
EMAIL_USER=<your-nodemailer-email>
EMAIL_PASS=<your-nodemailer-secret-password>
```

4. Start the server:

```
npm run dev
#or
npm start
```

The server will run on `http://localhost:3000`.

### API Endpoints

#### Parcels

`GET /parcels` - Get all parcels
`GET /parcels/:id` - Get parcel by ID
`POST /parcels` - Create a new parcel
`PATCH /parcels/:id` - Update a parcel
`PATCH /parcels/:id/cancel` - Cancel a parcel

#### Analytics

`GET /analytics/:email` - Get parcel status counts for a user
`GET /analytics` - Get parcel status counts for admin

#### Exports

`GET /exports/csv` - Export parcels as CSV
`GET /exports/pdf` - Export parcels as PDF

#### Authentication

`POST /auth/login` - Login user
`POST /auth/register` - Register user

### Contributing

- Fork the repository
- Create a new branch (git checkout -b feature/feature-name)
- Commit changes (git commit -m 'Add some feature')
- Push to branch (git push origin feature/feature-name)
- Create a Pull Request
