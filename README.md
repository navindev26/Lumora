# Lumora Admin - Product Management Dashboard

A modern, professional product management interface built with React, Vite, Tailwind CSS, and shadcn/ui components, integrated with Supabase for data storage.

## 🚀 Features

- **Product Grid** - Responsive grid displaying all products with search and filtering
- **Add Products** - Comprehensive modal form with organized sections
- **Product Details** - Detailed product view modal with all information
- **Delete Products** - Safe product deletion with confirmation and toast feedback
- **Real-time Search** - Search products by title, handle, or tags
- **Advanced Filters** - Filter by vendor, type, and publication status
- **Vendor Management** - Add new vendors with searchable dropdown
- **Type Management** - Add new product types with searchable dropdown
- **Image Upload** - Drag & drop file upload with preview
- **Toast Notifications** - Success/error feedback for all actions
- **Supabase Integration** - Real-time database operations
- **Environment Variables** - Secure credential management

## 🛠 Tech Stack

- **Frontend:** React 18, Vite 4
- **Styling:** Tailwind CSS, shadcn/ui components
- **Database:** Supabase (PostgreSQL)
- **Icons:** Lucide React
- **Notifications:** Sonner (toast notifications)
- **Deployment:** Netlify

## 📦 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd lumora-admin
```

2. Install dependencies:
```bash
npm install
```

3. Create environment variables:
```bash
# Copy the example file
cp env.example .env

# Edit .env file with your Supabase credentials:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

## 🔧 Configuration

### Supabase Setup

The application connects to Supabase using environment variables:
- **URL:** Set in `VITE_SUPABASE_URL`
- **Anonymous Key:** Set in `VITE_SUPABASE_ANON_KEY`
- **Table:** `shopify_products_complete`

Make sure your Supabase table has the following structure:
- Handle (varchar, required)
- Title (text)
- Body (HTML) (text)
- Vendor (varchar)
- Type (varchar)
- Variant Price (numeric)
- Variant Inventory Qty (integer)
- Variant Grams (numeric)
- Variant SKU (varchar)
- Image Src (text)
- Image Alt Text (text)
- Published (boolean)
- And other Shopify-compatible fields...

## 📱 Usage

### Adding Products
1. Click the "Add Product" button
2. Fill out the 4-section form:
   - **Product Identity:** Title, description, vendor, type
   - **Pricing & Stock:** Price, inventory, weight, SKU
   - **Product Images:** Upload product photos
   - **Publishing:** Control product visibility
3. Click "Create Product" to save

### Viewing Products
- Click any product card to view detailed information
- Use the search bar to find specific products
- Use filter dropdowns to narrow down results

### Managing Vendors & Types
- Use the vendor/type pickers in the add product form
- Click "Add new vendor" or "Add new type" to create custom options
- All new options are immediately available for selection

## 🚀 Deployment

### Netlify Deployment

This project is configured for easy Netlify deployment:

1. Build the project:
```bash
npm run build
```

2. Deploy to Netlify (automatic via `netlify.toml` configuration)

### Manual Deployment

1. Connect your GitHub repository to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Deploy!

## 🎨 Design System

The application uses a modern design system with:
- **Light Theme** - Clean, professional appearance
- **Subtle Borders** - Very light borders for clean separation
- **Compact Grid** - Optimized for viewing many products
- **Professional Typography** - Clear hierarchy and readability
- **shadcn/ui Components** - Industry-standard component library

## 📄 License

This project is private and proprietary to Lumora.

## 🤝 Contributing

This is a private project. Contact the development team for contribution guidelines. 