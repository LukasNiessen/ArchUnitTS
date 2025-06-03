# ArchUnitTS Documentation Assets

This folder contains custom styling assets for the ArchUnitTS documentation, which is generated using TypeDoc and deployed to GitHub Pages.

## Design Philosophy

The documentation design is inspired by modern development tools and websites like Cursor and Parcel, featuring:

- **Contemporary Color Palette**: Modern indigo (`#6366f1`) as the primary color with sophisticated gray tones
- **Modern Typography**: Inter font family for excellent readability and professional appearance
- **Card-based Layout**: Clean, elevated content blocks with subtle shadows and rounded corners
- **Gradient Hero Section**: Eye-catching header with grid pattern overlay
- **Responsive Design**: Mobile-first approach with breakpoints for all device sizes
- **Dark Mode Support**: Automatic dark mode based on system preferences
- **Micro-interactions**: Smooth hover effects and transitions for better UX

## Files

### `custom.css`

The main stylesheet that provides:

- CSS custom properties (variables) for consistent theming
- Modern color palette inspired by Cursor's design language
- Typography system using Inter and Fira Code fonts
- Responsive grid layouts
- Component styling for TypeDoc elements
- Dark mode support
- Animation and transition effects
- Accessibility improvements

## Key Design Features

### Color System

- **Primary**: Indigo (#6366f1) - Modern, professional, and accessible
- **Backgrounds**: Layered grays for depth and hierarchy
- **Text**: High contrast ratios for excellent readability
- **Accents**: Color-coded element types for better code navigation

### Typography

- **Primary Font**: Inter - Optimized for UI and long-form reading
- **Monospace Font**: Fira Code - Enhanced code presentation with ligatures
- **Scale**: Harmonious type scale for clear information hierarchy

### Layout

- **Grid System**: CSS Grid for flexible, responsive layouts
- **Containers**: Max-width containers for comfortable reading lengths
- **Spacing**: Consistent spacing scale using rem units
- **Cards**: Elevated content blocks with proper shadows and borders

### Interactive Elements

- **Hover States**: Subtle animations for better feedback
- **Focus States**: Clear focus indicators for accessibility
- **Transitions**: Smooth 0.2s ease transitions throughout
- **Transforms**: Micro-movements for engaging interactions

## Integration with TypeDoc

The CSS is integrated into TypeDoc through the `typedoc.json` configuration:

```json
{
  "customCss": "./docs-assets/custom.css"
}
```

This ensures the custom styling is applied to all generated documentation pages while maintaining TypeDoc's semantic structure and functionality.

## Browser Support

The styling uses modern CSS features with graceful degradation:

- CSS Custom Properties (variables)
- CSS Grid and Flexbox
- Modern selectors and pseudo-elements
- Media queries for responsive behavior

Supported browsers:

- Chrome/Edge 88+
- Firefox 84+
- Safari 14+

## Maintenance

When updating the styling:

1. Edit `custom.css` with your changes
2. Run `npm run docs` to regenerate documentation
3. Test locally with `npm run docs:serve`
4. Commit changes to trigger GitHub Pages deployment

The design system is built to be maintainable with CSS custom properties, making it easy to adjust colors, spacing, and other design tokens from the `:root` selector.
