# Portfolio Volatility Predictor MVP

A modern web application that uses machine learning to predict portfolio volatility based on real market data, featuring a Next.js frontend and FastAPI backend with enhanced risk analysis capabilities.

## 🚀 Features

- **📊 Real-time Volatility Prediction**: Multi-model ensemble approach with historical Random Forest, enhanced multi-source, and asset-based estimation
- **🎯 Comprehensive Risk Analysis**: Correlation analysis, concentration metrics (HHI), diversification scoring, and prioritized recommendations
- **🤖 AI-Powered Models**: Enhanced Random Forest trained on 500+ assets with confidence scoring
- **📱 Modern UI/UX**: Next.js frontend with responsive design, drag-and-drop uploads, and interactive components
- **🔒 Privacy-First**: Session-only data processing with no persistent storage by default
- **📈 Enhanced Coverage**: 500+ asset database covering stocks, ETFs, bonds, crypto, and mutual funds
- **🎨 Interactive Components**: Accordion FAQs, progress indicators, and real-time validation

## 🏗️ Architecture

### Frontend Stack
- **Framework**: Next.js 15.4.6 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **UI Components**: Radix UI primitives (Tabs, Accordion, Progress)
- **Icons**: Lucide React
- **State Management**: React hooks with TypeScript

### Backend Stack
- **Framework**: FastAPI with Python
- **ML Models**: Enhanced Random Forest, Multi-source ensemble, Asset-based estimation
- **Data Sources**: Yahoo Finance + optional API integration
- **Risk Analysis**: Correlation matrices, HHI concentration, diversification scoring

### Key Components
- **PortfolioUpload**: Dual input methods (CSV upload + manual entry)
- **PortfolioResults**: Comprehensive results display with risk analysis
- **FileUpload**: Drag-and-drop interface with validation
- **Navbar**: Mobile-first navigation with safe area support

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 18+
- npm or pnpm

### Backend Setup

1. **Clone and navigate to project**:
   ```bash
   cd portfolio_volatility_mvp
   ```

2. **Activate virtual environment**:
   ```bash
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the backend API**:
   ```bash
   python run.py
   ```

The backend will be available at: `http://localhost:8000`

### Frontend Setup

1. **Navigate to frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

The frontend will be available at: `http://localhost:3000`

### Alternative: Use Development Script

Run both frontend and backend simultaneously:
```bash
./start_dev.sh
```

## 📊 Using the Application

### Input Methods

1. **CSV Upload**: Drag and drop or browse for CSV files
2. **Manual Entry**: Interactive form with real-time validation and weight normalization

### CSV Format Requirements

```csv
Ticker,Weight
AAPL,25
VTI,35
TSLA,15
VOO,25
```

**Note**: Weights can be percentages (0-100) or decimals (0-1). The system automatically normalizes and handles rounding.

### Features

- **Real-time Validation**: Weight totals, ticker format, and data integrity checks
- **Quick Templates**: Pre-configured portfolio templates (SPY/QQQ/BND, VTSAX/VTIAX/VBTLX)
- **Weight Management**: Normalize to 100%, even split, and clear all functions
- **Keyboard Navigation**: Full keyboard support for manual entry

## 🔧 API Endpoints

### Core Endpoints
- `GET /` - API status and health check
- `GET /sample` - Download sample portfolio CSV template
- `POST /api/predict` - Main prediction endpoint with enhanced risk analysis
- `POST /predict` - Legacy endpoint (redirects to `/api/predict`)

### Response Format
```json
{
  "risk_level": "Moderate",
  "annual_volatility": "15.2%",
  "forecast_days": 252,
  "model_type": "enhanced_multi_source",
  "portfolio_assets": [...],
  "risk_analysis": {
    "success": true,
    "risk_metrics": {
      "correlation_analysis": {...},
      "risk_summary": {...},
      "recommendations": [...]
    }
  },
  "enhancement_data": {
    "coverage_analysis": {...},
    "overall_confidence": "high",
    "asset_details": [...]
  }
}
```

## 🤖 Model Architecture

### Multi-Model Ensemble
1. **Enhanced Multi-Source**: Blends historical signals, asset metadata, and cross-sectional priors
2. **Historical Random Forest**: Learns mappings from asset features to realized volatility
3. **Asset-Based Estimation**: Uses category-level priors when history is sparse

### Risk Analysis Components
- **Correlation Analysis**: Pairwise correlations, most correlated pairs, average correlation
- **Concentration Metrics**: HHI (Herfindahl-Hirschman Index), largest holdings analysis
- **Diversification Score**: 0-100 scale with explanations and recommendations
- **Key Concerns**: Automated identification of portfolio risks
- **Prioritized Recommendations**: Actionable insights with priority levels

### Confidence Scoring
- **High**: Extensive historical data and reliable patterns
- **Medium**: Limited history but strong category priors
- **Low**: Sparse data requiring conservative assumptions

## 🎨 UI/UX Features

### Components
- **PortfolioUpload**: Tabbed interface with CSV and manual entry
- **PortfolioResults**: Comprehensive results with metrics grid and risk analysis
- **FileUpload**: Drag-and-drop with visual feedback
- **Navbar**: Mobile-first navigation with safe area support

### Design System
- **Colors**: Blue/purple gradient theme with semantic color coding
- **Typography**: Consistent font hierarchy and spacing
- **Icons**: Lucide React icons throughout the interface
- **Responsive**: Mobile-first design with desktop enhancements

## 🔒 Privacy & Security

### Data Handling
- **Session-Only Processing**: No persistent storage by default
- **Minimal Data Collection**: Only tickers and weights required
- **Transparent Processing**: Model types and confidence indicators displayed
- **Clear Data**: Refresh page to remove session data

### Security Considerations
- **No PII Storage**: Avoid including personal information in CSVs
- **Input Validation**: Comprehensive validation on all inputs
- **Error Handling**: Graceful error states with user-friendly messages

## 🧪 Development

### Project Structure
```
portfolio_volatility_mvp/
├── frontend/                 # Next.js frontend
│   ├── components/          # React components
│   ├── pages/              # Next.js pages
│   ├── lib/                # Utilities and API
│   └── styles/             # Global styles
├── utils/                   # Backend utilities
│   ├── risk_analysis/      # Risk analysis modules
│   └── model_predict.py    # ML model integration
├── data/                    # Sample data files
├── model/                   # Trained ML models
└── requirements.txt         # Python dependencies
```

### Key Files
- `frontend/pages/index.tsx` - Main application page
- `frontend/components/PortfolioUpload.tsx` - Portfolio input interface
- `frontend/components/PortfolioResults.tsx` - Results display
- `utils/risk_analysis/` - Risk analysis modules
- `run.py` - FastAPI backend server

### Development Commands
```bash
# Backend
python run.py                    # Start FastAPI server
python train_model.py           # Retrain ML model
python check_model_status.py    # Verify model status

# Frontend
npm run dev                     # Start development server
npm run build                   # Production build
npm run lint                    # Run ESLint
```

## 📈 Performance & Scalability

### Optimizations
- **Lazy Loading**: Components load only when needed
- **Memoized Callbacks**: Prevents unnecessary re-renders
- **Efficient State Management**: Minimal state updates
- **Debounced Validation**: Real-time validation without performance impact

### Scalability Considerations
- **Modular Architecture**: Easy to extend individual features
- **TypeScript Support**: Full type safety and IntelliSense
- **Component Reusability**: ShadCN components for consistency
- **API Design**: RESTful endpoints with clear response formats

## 🚀 Deployment

### Frontend Deployment
```bash
cd frontend
npm run build
npm start
```

### Backend Deployment
```bash
source venv/bin/activate
python run.py
```

### Environment Variables
- `PORT`: Backend port (default: 8000)
- `HOST`: Backend host (default: 0.0.0.0)
- `DEBUG`: Enable debug mode

## 📧 Feedback System

The application includes a feedback form that sends emails to your specified address. See [FEEDBACK_SETUP.md](./FEEDBACK_SETUP.md) for detailed setup instructions.

### Quick Setup
1. Create a `.env` file with email configuration
2. Set up Gmail App Password
3. Configure environment variables
4. Restart the development server

### Environment Variables for Feedback
```bash
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=your-email@gmail.com
FEEDBACK_EMAIL=test@gmail.com
```

## 🤝 Contributing

### Development Guidelines
1. **TypeScript**: Use proper types and interfaces
2. **Component Design**: Follow shadCN patterns for consistency
3. **Testing**: Ensure keyboard and screen reader support
4. **Documentation**: Keep README and component docs current

### Code Quality
- **ESLint**: Follow Next.js and TypeScript rules
- **Prettier**: Consistent code formatting
- **Type Safety**: Full TypeScript coverage
- **Accessibility**: ARIA labels and keyboard navigation

## 📚 Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [ShadCN UI](https://ui.shadcn.com/)

### Sample Data
- Sample portfolios available in `/data/` directory
- Download templates from the application interface
- CSV format with Ticker and Weight columns

## 📄 License

This project is for educational and research purposes. Use at your own risk for financial decisions.

---

**Note**: This application provides volatility estimates and risk analysis for educational purposes. Always consult with financial professionals before making investment decisions.
