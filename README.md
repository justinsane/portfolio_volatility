# Portfolio Volatility Predictor

A modern web application that uses machine learning to predict portfolio volatility and provide comprehensive risk analysis. Features a Next.js frontend with SnapTrade integration and a FastAPI backend with enhanced ML models.

## 🚀 Features

- **📊 Real-time Volatility Prediction**: Multi-model ensemble with confidence scoring
- **🎯 Comprehensive Risk Analysis**: Correlation analysis, concentration metrics, diversification scoring
- **🤖 Enhanced ML Models**: Random Forest + Multi-source estimation for 500+ assets
- **📱 Modern UI**: Next.js 15 with Tailwind CSS v4 and shadcn/ui components
- **🔗 SnapTrade Integration**: Connect real brokerage accounts for live portfolio data
- **📈 500+ Asset Coverage**: Stocks, ETFs, bonds, crypto, and mutual funds

## 🏗️ Tech Stack

### Frontend
- **Framework**: Next.js 15.4.6 with React 18
- **Styling**: Tailwind CSS v4.1.11 with shadcn/ui
- **UI Components**: Radix UI primitives (Tabs, Accordion, Progress)
- **Trading Integration**: SnapTrade React SDK
- **Build Tool**: Turbopack for fast development

### Backend
- **Framework**: FastAPI with Python 3.13
- **ML Libraries**: scikit-learn, pandas, numpy
- **Data Sources**: Yahoo Finance + Alpha Vantage API
- **Risk Analysis**: Custom correlation and concentration analyzers

## 🧠 Machine Learning Architecture

### Multi-Model Ensemble Approach

Our system uses three complementary models for robust volatility prediction:

1. **Enhanced Multi-Source Model**: Blends historical data, asset metadata, and cross-sectional priors
2. **Historical Random Forest**: Trained on 500+ assets with feature engineering
3. **Asset-Based Estimation**: Category-level priors for assets with limited history

### Risk Analysis Pipeline

```python
# Portfolio Analysis Flow
1. Asset Coverage Analysis → Identify known vs unknown assets
2. Volatility Estimation → Multi-model prediction with confidence scoring
3. Correlation Analysis → Pairwise correlations and concentration metrics
4. Risk Scoring → HHI index, diversification score (0-100)
5. Recommendations → Prioritized actionable insights
```

### Model Confidence Levels

- **High**: Extensive historical data with reliable patterns
- **Medium**: Limited history but strong category priors  
- **Low**: Sparse data requiring conservative assumptions

## 🚀 Quick Start

### Prerequisites
- Python 3.13+
- Node.js 18+
- Virtual environment (recommended)

### Backend Setup
```bash
# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI server
python run.py
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Development Script
```bash
./start_dev.sh  # Runs both frontend and backend
```

## 📊 Portfolio Input Methods

1. **CSV Upload**: Drag-and-drop interface with validation
2. **Manual Entry**: Interactive form with real-time weight normalization
3. **SnapTrade Connection**: Direct brokerage account integration

### CSV Format
```csv
Ticker,Weight
AAPL,25
VTI,35
TSLA,15
VOO,25
```

## 🔧 API Endpoints

- `GET /` - Health check
- `POST /api/predict` - Main prediction endpoint
- `GET /sample` - Download sample portfolio template

### Response Format
```json
{
  "risk_level": "Moderate",
  "annual_volatility": "15.2%",
  "model_type": "enhanced_multi_source",
  "risk_analysis": {
    "correlation_analysis": {...},
    "diversification_score": 75,
    "recommendations": [...]
  }
}
```

## 🎨 UI Components

- **PortfolioUpload**: Tabbed interface (CSV/Manual/SnapTrade)
- **PortfolioResults**: Comprehensive results with metrics grid
- **FileUpload**: Drag-and-drop with validation
- **Navbar**: Mobile-first navigation

## 🔒 Privacy & Security

- **Session-Only Processing**: No persistent storage by default
- **Input Validation**: Comprehensive validation on all inputs
- **Error Handling**: Graceful error states with user-friendly messages

## 📈 Performance Features

- **Lazy Loading**: Components load only when needed
- **Model Caching**: Prevents reloading on every request
- **Debounced Validation**: Real-time validation without performance impact
- **Turbopack**: Fast development builds

## 🚀 Deployment

### Frontend (Vercel)
```bash
cd frontend
npm run build
npm start
```

### Backend (Render/Railway)
```bash
source venv/bin/activate
python run.py
```

## 📧 Feedback System

Configure email feedback in `.env`:
```bash
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
FEEDBACK_EMAIL=test@gmail.com
```

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SnapTrade Documentation](https://docs.snaptrade.com/)
- [Tailwind CSS v4](https://tailwindcss.com/docs)

---

**Note**: This application provides volatility estimates for educational purposes. Always consult financial professionals before making investment decisions.
