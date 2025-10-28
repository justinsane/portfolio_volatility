# Portfolio Upload Component

## Overview

The `PortfolioUpload` component provides a modern, user-friendly interface for portfolio volatility prediction with support for both CSV upload and manual portfolio entry.

## Features

### 🎯 Dual Input Methods
- **CSV Upload**: Drag-and-drop or file browser for CSV files
- **Manual Entry**: Interactive form for adding portfolio assets with real-time validation

### 📊 Advanced Validation
- Real-time weight calculation and validation
- Visual feedback for weight totals (green = 100%, yellow = under, red = over)
- Asset ticker auto-uppercase conversion
- Minimum asset requirements enforcement

### 🚀 User Experience Enhancements
- **Tabbed Interface**: Clean separation between CSV and manual entry
- **Quick Add Templates**: Pre-configured common portfolio templates (SPY/QQQ/BND)
- **Visual Feedback**: Color-coded weight totals and validation states
- **Responsive Design**: Works seamlessly on desktop and mobile

### 🔧 Technical Features
- **Modular Design**: Easy to extend or modify individual features
- **TypeScript Support**: Full type safety and IntelliSense
- **Accessibility**: Keyboard navigation and screen reader support
- **Error Handling**: Comprehensive error states and user feedback

## Component Structure

```
PortfolioUpload/
├── Tabs Interface
│   ├── CSV Upload Tab
│   │   ├── Drag & Drop Zone
│   │   ├── File Browser
│   │   ├── File Preview
│   │   └── Sample Download
│   └── Manual Entry Tab
│       ├── Asset Input Fields
│       ├── Weight Validation
│       ├── Quick Add Templates
│       └── Add/Remove Controls
├── Loading States
├── Error Handling
└── Results Display
    ├── Metrics Grid
    ├── Portfolio Table
    └── Risk Analysis
```

## Usage

```tsx
import PortfolioUpload from '../components/PortfolioUpload';

export default function Home() {
  return (
    <div>
      <PortfolioUpload />
    </div>
  );
}
```

## API Integration

The component integrates with the existing API endpoints:

- **CSV Upload**: Sends file directly to `/api/predict`
- **Manual Entry**: Converts to CSV format and sends to same endpoint
- **Sample Download**: Uses `/sample` endpoint for template download

## Validation Rules

### Manual Entry Validation
1. **Minimum Assets**: At least one asset required
2. **Weight Total**: Must equal 100% (±1% tolerance)
3. **Ticker Format**: Auto-converted to uppercase
4. **Weight Range**: 0-100% per asset

### CSV Upload Validation
1. **File Type**: Must be CSV format
2. **Required Columns**: Ticker, Weight
3. **Data Format**: Numeric weights, string tickers

## Quick Add Templates

Pre-configured portfolio templates for common allocations:

- **SPY (60%) + QQQ (30%) + BND (10%)**: Balanced growth portfolio
- Additional templates can be easily added to the component

## Styling

The component uses Tailwind CSS with ShadCN components:

- **Cards**: Main container and content sections
- **Tabs**: Navigation between input methods
- **Buttons**: Actions and form controls
- **Inputs**: Asset ticker and weight fields
- **Alerts**: Error and success messages
- **Badges**: Status indicators and labels

## Accessibility Features

- **Keyboard Navigation**: Full tab and arrow key support
- **Screen Reader**: Proper ARIA labels and descriptions
- **Focus Management**: Logical tab order and focus indicators
- **Error Announcements**: Screen reader accessible error messages

## Performance Optimizations

- **Memoized Callbacks**: Prevents unnecessary re-renders
- **Lazy Loading**: Components load only when needed
- **Efficient State Management**: Minimal state updates
- **Debounced Validation**: Real-time validation without performance impact

## Future Enhancements

### Planned Features
- **Portfolio Templates**: More pre-configured portfolios
- **Asset Search**: Autocomplete for ticker symbols
- **Portfolio History**: Save and load previous portfolios
- **Export Options**: Download results in various formats
- **Advanced Validation**: Sector limits, concentration warnings

### Extension Points
- **Custom Validation**: Add custom validation rules
- **Additional Input Methods**: API integration, portfolio import
- **Enhanced UI**: Charts, visualizations, animations
- **Mobile Optimization**: Touch-friendly interactions

## Dependencies

- **React**: Core framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **ShadCN UI**: Component library
- **Radix UI**: Accessible primitives
- **Lucide React**: Icons

## Testing

The component is designed for easy testing:

```tsx
// Example test structure
describe('PortfolioUpload', () => {
  it('should validate manual entry correctly', () => {
    // Test validation logic
  });
  
  it('should handle CSV upload', () => {
    // Test file upload
  });
  
  it('should display results correctly', () => {
    // Test results rendering
  });
});
```

## Contributing

When extending this component:

1. **Maintain Modularity**: Keep features separate and composable
2. **Follow TypeScript**: Use proper types and interfaces
3. **Test Accessibility**: Ensure keyboard and screen reader support
4. **Update Documentation**: Keep this README current
5. **Consider Performance**: Optimize for large portfolios

## Troubleshooting

### Common Issues

1. **Build Errors**: Ensure all dependencies are installed
2. **TypeScript Errors**: Check interface definitions
3. **Styling Issues**: Verify Tailwind classes are correct
4. **API Integration**: Confirm endpoint URLs are correct

### Debug Mode

Enable debug logging by setting environment variables:

```bash
NEXT_PUBLIC_DEBUG=true
```

This will log validation steps and API calls to the console.
