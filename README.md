# Timezone Clocks

[![Deploy](https://github.com/godajaiko21/timezone-clocks/actions/workflows/deploy.yml/badge.svg)](https://github.com/godajaiko21/timezone-clocks/actions/workflows/deploy.yml)
[![CodeQL](https://github.com/godajaiko21/timezone-clocks/actions/workflows/codeql.yml/badge.svg)](https://github.com/godajaiko21/timezone-clocks/actions/workflows/codeql.yml)

A web application for visualizing and comparing time across multiple time zones using interactive analog clocks. Features intuitive visual representation of daytime/nighttime, dark mode support, and flexible configuration options.

> This project was generated with assistance from Claude, an AI assistant by Anthropic.

## Features

### Core Functionality
- Compare 2-3 different time zones simultaneously (one source and up to two target zones)
- Visual analog clock display with day/night indication
- Automatic time zone conversion
- Default settings: Tokyo (source), New York (first target)
- Current time automatically set as default

### User Interface
- Dark mode support with persistent preference
- Responsive design for all screen sizes
- Toast notifications for operation feedback
- Error handling with user-friendly messages
- Form validation with immediate feedback

### Sharing & Export
- URL sharing with timezone configurations
- Copy image to clipboard functionality
- Fallback to SVG download for unsupported browsers
- OGP (Open Graph Protocol) integration

### Time Input
- ISO 8601 format support (YYYY-MM-DDThh:mm)
- Timezone-aware time conversion
- Input validation with helpful feedback
- Supports various input formats with automatic parsing

## Technology Stack

### Frontend
- Pure HTML5/CSS3/JavaScript
- Luxon.js for timezone calculations
- Custom SVG generation for clock visualization
- Modern CSS features (Custom Properties, Grid, Flexbox)

### Infrastructure
- AWS S3 for static file hosting
- AWS CloudFront for content delivery
- AWS CloudFormation for infrastructure as code

## Project Structure

```
timezone-clocks
├── LICENSE
├── README.md
├── cloudformation/
│   └── template.yaml       # AWS CloudFormation template
├── scripts/
│   ├── cleanup.sh         # Resource cleanup script
│   └── deploy.sh          # Deployment script
└── src/
    ├── assets/
    │   └── favicon.ico
    ├── css/
    │   └── styles.css     # Main stylesheet
    ├── js/
    │   ├── app.js         # Main application logic
    │   ├── clock-utils.js # Clock visualization utilities
    │   └── timezones.js   # Timezone management
    └── index.html         # Main HTML file
```

## Setup and Development

### Prerequisites
- AWS CLI installed and configured
- Basic understanding of web development
- Modern web browser
- Text editor of your choice

### Deployment

1. Make scripts executable:
```bash
chmod +x scripts/deploy.sh scripts/cleanup.sh
```

2. Deploy to AWS:
```bash
./scripts/deploy.sh timezone-clocks
```

3. Cleanup AWS resources:
```bash
./scripts/cleanup.sh timezone-clocks
```

## Usage

### URL Parameters

The application accepts the following URL parameters:
- `time`: ISO 8601 formatted time (e.g., "2024-02-20T14:30")
- `sourceTz`: Source timezone (e.g., "Asia/Tokyo")
- `targetTz`: Comma-separated target timezones (e.g., "America/New_York,Europe/London")

Example URL:
```
https://[cloudfront-domain]/?time=2025-01-01T09:00&sourceTz=Asia/Tokyo&targetTz=America/New_York
```

### Features Guide

1. Time Selection
   - Enter time in ISO format
   - Current time is used by default
   - Validation ensures correct format

2. Timezone Selection
   - Source timezone (required)
   - First target timezone (required)
   - Second target timezone (optional)

3. Display Options
   - Dark/Light mode toggle
   - Automatic day/night indication
   - Responsive layout

4. Sharing
   - Copy URL button
   - Copy Image button
   - Automatic OGP image generation

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License & Copyright

Copyright © 2025 Akinori Hiratani (godajaiko21)  
Released under the MIT License  
https://github.com/godajaiko21/timezone-clocks

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Luxon.js for reliable timezone calculations
- AWS for hosting infrastructure
- Contributors and maintainers

---

For issues, feature requests, or contributions, please create an issue in the GitHub repository.