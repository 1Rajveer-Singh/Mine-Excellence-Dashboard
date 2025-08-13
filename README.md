# 💎 Mine Excellence Dashboard - Surface Blasting Analytics

<div align="center">

![Dashboard Preview](https://img.shields.io/badge/Dashboard-Live-brightgreen?style=for-the-badge&logo=react)
![Version](https://img.shields.io/badge/Version-1.0.0-blue?style=for-the-badge)
![Build Status](https://img.shields.io/badge/Build-Passing-success?style=for-the-badge)
![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-6.3.5-646CFF?style=for-the-badge&logo=vite)
![Deployment](https://img.shields.io/badge/Deployed-Vercel-black?style=for-the-badge&logo=vercel)

**🚀 A state-of-the-art mining analytics dashboard built with modern React technologies**

*Transform your surface blasting operations with powerful data visualization and analytics*

### 🌐 **Live Demo**
**[📊 View Live Dashboard](https://mine-excellence-dashboard.vercel.app/)** 

*Experience the dashboard in action with real-time data visualization and interactive analytics*

</div>

---

## ✨ Features

### 📊 **Advanced Analytics Dashboard**
- **Real-time Data Processing** - Dynamic loading from JSON/API sources
- **Interactive Visualizations** - Built with Recharts for stunning charts
- **Performance Optimized** - Code splitting and lazy loading implemented
- **Export Capabilities** - PDF & Image exports with high-quality rendering

### 🎨 **Modern UI/UX**
- **🌙 Dark/Light Mode** - Seamless theme switching
- **📱 Responsive Design** - Perfect on desktop, tablet, and mobile
- **⚡ Fast Loading** - Optimized bundle sizes and dynamic imports
- **🎯 Clean Interface** - Intuitive navigation and user experience

### 🔧 **Technical Excellence**
- **Production Ready** - Fully tested and optimized builds
- **Error-Free JSX** - All components follow React best practices
- **Type Safety** - Clean code with proper validation
- **Scalable Architecture** - Modular component structure

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn package manager
- Git

### Try the Live Demo First!
**🌐 [Experience the Dashboard Live](https://mine-excellence-dashboard.vercel.app/)**  
*No installation required - see all features in action*

### Local Installation

```bash
# Clone the repository
git clone https://github.com/1Rajveer-Singh/Mine-Excellence-Dashboard.git

# Navigate to project directory
cd Mine-Excellence-Dashboard

# Install dependencies
npm install

# Start development server
npm run dev
```

### 🎯 Available Scripts

```bash
# Development server with hot reload
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Code linting
npm run lint
```

---

## 📋 Dashboard Components

| Component | Description | Features |
|-----------|-------------|----------|
| 💰 **Average Blasting Cost** | Cost analysis and trends | Multi-period comparison, cost breakdown |
| 🎯 **Blast Cost Per Ton** | Cost efficiency metrics | Production optimization insights |
| 📏 **Burden Spacing Analysis** | Spatial optimization | Pattern analysis, efficiency metrics |
| 🚀 **Flyrock Analysis** | Safety and distance monitoring | Risk assessment, safety compliance |
| 🌊 **Ground & Air Vibration** | Environmental impact tracking | Compliance monitoring, trend analysis |
| ⛏️ **Production Analytics** | Output and efficiency metrics | Per-hole and per-meter analysis |
| ⚡ **Specific Charge** | Explosive efficiency analysis | Optimization recommendations |
| 🔧 **Specific Drilling** | Drilling operation metrics | Performance tracking |

---

## 🏗️ Project Structure

```
Mine-Excellence-Dashboard/
├── 📁 src/
│   ├── 📁 Dashboard/Surface Blasting/     # Main dashboard components
│   │   ├── Average_blasting_cost.jsx
│   │   ├── Blast_cost_per_ton.jsx
│   │   ├── Flyrock.jsx
│   │   └── ... (8 more components)
│   ├── 📁 Documentation/                  # Component documentation
│   ├── 📁 DemoData/                      # Sample data files
│   └── 📁 context/                       # React context providers
├── 📁 public/                            # Static assets
├── 📁 dist/                              # Production build
└── 📄 Configuration files
```

---

## 🛠️ Tech Stack

<div align="center">

| Frontend | Build Tools | Data Viz | Styling |
|----------|-------------|----------|---------|
| ![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=white) | ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white) | ![Recharts](https://img.shields.io/badge/Recharts-FF6B6B?style=flat) | ![Tailwind](https://img.shields.io/badge/Tailwind-06B6D4?style=flat&logo=tailwindcss&logoColor=white) |
| React 18.3 | Vite 6.3.5 | Recharts | Tailwind CSS |

</div>

### 📦 Key Dependencies
- **jsPDF** - High-quality PDF generation
- **html2canvas** - Screenshot and image export
- **Lucide React** - Modern icon library
- **Axios** - HTTP client for API calls

---

## 📊 Performance Metrics

### Build Optimization
- **Main Bundle**: 962.96 kB (optimized)
- **jsPDF Chunk**: 357.76 kB (code-split)
- **html2canvas Chunk**: 202.30 kB (code-split)
- **Build Time**: ~8 seconds
- **Load Time**: < 2 seconds

### Code Quality
- ✅ **ESLint** compliance
- ✅ **React** best practices
- ✅ **Performance** optimized
- ✅ **Accessibility** features

---

## 🎯 Usage Examples

### Data Loading
```javascript
// Automatic data loading from JSON/API
const dashboard = new MineExcellenceDashboard({
  dataSource: 'api', // or 'json'
  apiEndpoint: 'your-api-endpoint',
  refreshInterval: 30000 // 30 seconds
});
```

### Export Functionality
```javascript
// Export charts as PDF or images
exportChartAsPDF('blast-cost-analysis');
exportChartAsImage('png', 'production-metrics');
```

---

## 🚀 Deployment

### 🌐 Live Production Site
**🎯 [Mine Excellence Dashboard - Live Demo](https://mine-excellence-dashboard.vercel.app/)**

*The dashboard is live and fully functional with all features enabled*

### 📊 Live Features Available:
- ✅ **Real-time Analytics** - Interactive data visualization
- ✅ **Export Functionality** - PDF and image exports working
- ✅ **Dark/Light Themes** - Theme switching enabled
- ✅ **Responsive Design** - Optimized for all devices
- ✅ **Performance Optimized** - Fast loading with code splitting

### Production Build
```bash
npm run build
```

### Deployment Options
- **✅ Vercel**: Currently deployed - Zero-config deployment
- **Netlify**: Drag-and-drop deployment
- **GitHub Pages**: Static hosting
- **Docker**: Containerized deployment

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📈 Roadmap

- [ ] **Real-time Data Streaming** - WebSocket integration
- [ ] **Advanced Filters** - Multi-dimensional data filtering
- [ ] **Machine Learning** - Predictive analytics
- [ ] **Mobile App** - React Native companion app
- [ ] **API Integration** - REST API for external systems

---

## 📞 Support & Contact

<div align="center">

[![GitHub Issues](https://img.shields.io/badge/Issues-GitHub-red?style=for-the-badge&logo=github)](https://github.com/1Rajveer-Singh/Mine-Excellence-Dashboard/issues)
[![Documentation](https://img.shields.io/badge/Docs-Available-blue?style=for-the-badge&logo=gitbook)](./src/Documentation/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://mine-excellence-dashboard.vercel.app/)

**Built with ❤️ by Rajveer Singh**

### 🌐 Quick Links
**[🚀 Live Dashboard](https://mine-excellence-dashboard.vercel.app/)** | **[📚 Documentation](./src/Documentation/)** | **[🐛 Report Issues](https://github.com/1Rajveer-Singh/Mine-Excellence-Dashboard/issues)**

</div>

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**⭐ Star this repository if you found it helpful!**

🌐 **[Try the Live Demo](https://mine-excellence-dashboard.vercel.app/)** 🌐

*Making mining operations smarter, safer, and more efficient.*

</div>
