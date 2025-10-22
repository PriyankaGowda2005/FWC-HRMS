# Documentation Images

This folder contains images used in the project documentation, particularly for the main README.md file.

## Image Files

### Screenshots

- `recruitment-dashboard.png` - Screenshot of the recruitment dashboard interface
- `candidate-management.png` - Screenshot of the candidate management interface
- `ai-interview-scheduling.png` - Screenshot of the AI interview scheduling modal

## Image Guidelines

### File Naming Convention

- Use lowercase letters
- Use hyphens (-) instead of spaces
- Use descriptive names that match the content
- Use PNG format for screenshots (better quality for UI elements)

### Image Specifications

- **Width**: 800-1200px (optimal for GitHub display)
- **Format**: PNG (for screenshots) or JPG (for photos)
- **File Size**: Keep under 1MB for better loading performance
- **Aspect Ratio**: 16:9 or 4:3 for consistency

### Adding New Images

1. Save your screenshot/image in this folder
2. Follow the naming convention above
3. Update the README.md file to reference the new image
4. Commit both the image and README changes together

## Usage in README.md

```markdown
![Image Description](./docs/images/image-name.png)
_Image caption or description_
```

## Alternative Locations

If you prefer different folder structures, here are other common options:

1. **Root level**: `./images/` (simple but can clutter root)
2. **Assets folder**: `./assets/images/` (good for multiple asset types)
3. **Public folder**: `./public/images/` (if using with web frameworks)
4. **GitHub Issues**: Upload to GitHub issues and use the generated URLs

The `./docs/images/` approach is recommended as it:

- Keeps documentation assets organized
- Follows common documentation practices
- Doesn't clutter the root directory
- Is easily discoverable by contributors

