# Button Styling Guide

## Overview

This guide documents the button styling system used throughout the application. We use a combination of shadcn/ui Button component variants and custom styling to ensure consistent, accessible, and visually appealing buttons across the entire site.

## Button Variants

### Standard Variants (shadcn/ui)

- `default`: Primary action buttons with blue background
- `destructive`: Dangerous actions with red background
- `outline`: Standard outline buttons (improved hover states)
- `secondary`: Secondary actions with muted background
- `ghost`: Minimal styling for subtle actions
- `link`: Text-only buttons that look like links

### Custom Outline Variants

We've added custom outline variants to provide better visual hierarchy and accessibility:

#### `outline-blue`
- **Use case**: Primary secondary actions, important tools
- **Colors**: Blue border and text with light blue hover
- **Example**: "Load Demo", "Normalize Weights", "Continue with Manual Entry"

#### `outline-slate`
- **Use case**: Standard secondary actions, neutral actions
- **Colors**: Gray border and text with light gray hover
- **Example**: "Download Sample", "Validate Portfolio", "Quick Add" buttons

#### `outline-red`
- **Use case**: Destructive actions that aren't primary
- **Colors**: Red border and text with light red hover
- **Example**: "Clear All", "Delete", "Remove"

#### `outline-green`
- **Use case**: Success actions, positive confirmations
- **Colors**: Green border and text with light green hover
- **Example**: "Save", "Confirm", "Apply"

## Usage Examples

### Primary Action Button
```tsx
<Button 
  className='w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold py-4 sm:py-3 text-lg shadow-lg hover:shadow-xl active:shadow-inner transition-all duration-200 touch-manipulation select-none cursor-pointer'
>
  Analyze Portfolio
</Button>
```

### Secondary Action Button
```tsx
<Button variant='outline-blue' className='flex items-center gap-2'>
  <Download className='h-4 w-4' />
  Download Sample
</Button>
```

### Small Utility Button
```tsx
<Button 
  size='sm' 
  variant='outline-slate' 
  className='h-8 px-3 text-xs'
>
  Quick Add
</Button>
```

### Destructive Action Button
```tsx
<Button 
  variant='outline-red' 
  size='sm' 
  className='h-8 px-3 text-xs'
>
  Clear All
</Button>
```

## Best Practices

### 1. Accessibility
- Always include proper hover and focus states
- Use semantic button elements
- Ensure sufficient color contrast (WCAG AA compliant)
- Include proper ARIA labels when needed

### 2. Mobile-First Design
- Use `touch-manipulation` for better mobile interaction
- Ensure minimum 48px touch targets
- Use responsive text patterns for long button text
- Test hover states on touch devices

### 3. Visual Hierarchy
- Use `outline-blue` for important secondary actions
- Use `outline-slate` for standard secondary actions
- Use `outline-red` for destructive actions
- Use `outline-green` for success/positive actions

### 4. Consistency
- Use the same button variants across similar actions
- Maintain consistent spacing and typography
- Use the same transition effects throughout
- Follow the established color scheme

### 5. Performance
- Use CSS transitions instead of JavaScript animations
- Keep button styles lightweight
- Avoid complex hover effects that might cause layout shifts

## Color Scheme

### Blue Theme (Primary)
- Background: `bg-blue-600`
- Hover: `hover:bg-blue-700`
- Active: `active:bg-blue-800`
- Text: `text-white`

### Outline Variants
- **Blue**: `border-blue-200` → `hover:border-blue-300`, `text-blue-700` → `hover:text-blue-800`
- **Slate**: `border-slate-200` → `hover:border-slate-300`, `text-slate-700` → `hover:text-slate-800`
- **Red**: `border-red-200` → `hover:border-red-300`, `text-red-700` → `hover:text-red-800`
- **Green**: `border-green-200` → `hover:border-green-300`, `text-green-700` → `hover:text-green-800`

## Migration Guide

### From Old Styling
If you find buttons using the old `variant='outline'` with custom classes, migrate them to use the new custom variants:

**Before:**
```tsx
<Button 
  variant='outline' 
  className='bg-white border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 hover:border-blue-300'
>
  Action
</Button>
```

**After:**
```tsx
<Button variant='outline-blue'>
  Action
</Button>
```

### Common Patterns

1. **Tool buttons**: Use `outline-blue` for important tools
2. **Utility buttons**: Use `outline-slate` for standard utilities
3. **Destructive actions**: Use `outline-red` for non-primary destructive actions
4. **Success actions**: Use `outline-green` for positive confirmations

## Testing Checklist

- [ ] Hover states work correctly on desktop
- [ ] Touch interactions work on mobile
- [ ] Focus states are visible for keyboard navigation
- [ ] Color contrast meets WCAG AA standards
- [ ] Buttons are properly sized for touch targets
- [ ] Text remains readable in all states
- [ ] Transitions are smooth and performant

## Future Enhancements

- Consider adding loading states for async actions
- Implement button groups for related actions
- Add icon-only button variants
- Consider dark mode variants
- Add button size variants for different contexts
