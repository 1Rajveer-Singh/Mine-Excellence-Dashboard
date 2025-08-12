# Contributing to Mine Excellence Dashboard

Thank you for your interest in contributing to the Mine Excellence Dashboard! This document provides guidelines and instructions for contributing to this project.

## 🚀 Getting Started

### Prerequisites
- Node.js 16 or higher
- npm or yarn
- Git
- Basic knowledge of React and JavaScript

### Setting Up Development Environment

1. **Fork the repository**
   ```bash
   # Click the "Fork" button on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR-USERNAME/Mine-Excellence-Dashboard.git
   cd Mine-Excellence-Dashboard
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## 🔄 Development Workflow

### Branch Naming Convention
- `feature/description` - For new features
- `bugfix/description` - For bug fixes
- `hotfix/description` - For urgent fixes
- `docs/description` - For documentation updates

### Commit Message Format
Follow the conventional commit format:
```
type(scope): description

[optional body]

[optional footer]
```

Examples:
- `feat(dashboard): add new blasting cost component`
- `fix(export): resolve PDF generation issue`
- `docs(readme): update installation instructions`

## 📝 Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, readable code
   - Follow existing code style
   - Add comments where necessary

3. **Test your changes**
   ```bash
   npm run build
   npm run lint
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Provide a clear description of your changes

## 🎯 Code Style Guidelines

### React Components
- Use functional components with hooks
- Follow PascalCase for component names
- Use descriptive prop names
- Include PropTypes when possible

### JavaScript/JSX
- Use ES6+ features
- Prefer const/let over var
- Use meaningful variable names
- Keep functions small and focused

### File Organization
- Group related components in folders
- Use index.js files for clean imports
- Keep component files under 500 lines

## 🧪 Testing Guidelines

### Before Submitting
- [ ] Code builds without errors (`npm run build`)
- [ ] No ESLint warnings (`npm run lint`)
- [ ] All existing functionality works
- [ ] New features are documented

### Manual Testing
- Test on different screen sizes
- Verify dark/light mode compatibility
- Check export functionality
- Validate data loading

## 📊 Component Development

### Adding New Analytics Components
1. Create component in `src/Dashboard/Surface Blasting/`
2. Follow existing component structure
3. Include export functionality
4. Add responsive design
5. Update documentation

### Data Visualization
- Use Recharts for consistency
- Follow color theme guidelines
- Include loading states
- Handle empty data gracefully

## 🐛 Bug Reports

When reporting bugs, please include:
- **Environment**: OS, browser, Node.js version
- **Steps to reproduce**: Detailed reproduction steps
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Screenshots**: If applicable

## 💡 Feature Requests

For new features, please provide:
- **Problem statement**: What problem does this solve?
- **Proposed solution**: How should it work?
- **Alternatives considered**: Other solutions you thought about
- **Additional context**: Any other relevant information

## 📚 Documentation

### Updating Documentation
- Update README.md for new features
- Add component documentation in `src/Documentation/`
- Include code examples
- Update changelog

### Documentation Standards
- Use clear, concise language
- Include code examples
- Add screenshots when helpful
- Keep examples up to date

## ⚡ Performance Guidelines

### Code Optimization
- Use React.memo for expensive components
- Implement lazy loading where appropriate
- Optimize bundle sizes
- Minimize re-renders

### Data Handling
- Cache API responses when possible
- Use pagination for large datasets
- Implement efficient filtering
- Minimize data processing

## 🔒 Security Considerations

- Validate all user inputs
- Sanitize data before rendering
- Use secure API endpoints
- Don't commit sensitive information

## 🤝 Community Guidelines

### Be Respectful
- Use inclusive language
- Be patient with newcomers
- Provide constructive feedback
- Help others learn and grow

### Communication
- Use GitHub issues for bug reports
- Use discussions for questions
- Be clear and specific
- Respond promptly when possible

## 📞 Getting Help

If you need help:
1. Check existing issues and documentation
2. Search for similar problems
3. Create a new issue with detailed information
4. Join our community discussions

## 🙏 Recognition

Contributors will be recognized in:
- GitHub contributors list
- Project documentation
- Release notes (for significant contributions)

Thank you for contributing to Mine Excellence Dashboard! 🚀
