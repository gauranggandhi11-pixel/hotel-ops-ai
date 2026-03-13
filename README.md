# Hotel Operations AI 🏨

An intelligent hotel management system with AI-powered guest communication, real-time task management, and comprehensive housekeeping operations.

## ✨ Features

- **AI Guest Chat Interface** - Natural language processing for guest requests with automatic intent classification
- **Smart Task Management** - Automated task routing to appropriate departments with SLA tracking
- **Housekeeping Dashboard** - Real-time room status monitoring and attendant assignment
- **Multi-Department Coordination** - Seamless integration across Housekeeping, Engineering, F&B, IT, Security, and Concierge
- **Priority-Based Workflow** - Intelligent task prioritization with urgent escalation
- **Real-Time Analytics** - Live metrics and performance tracking

## 🎯 Intent Classification

The system automatically categorizes guest requests into:
- 🧹 Housekeeping
- 🔧 Maintenance
- 🕐 Late Checkout
- 🍽️ Room Service
- 📶 Wi-Fi Issues
- 🔔 Noise Complaints
- 💳 Billing
- 📍 Recommendations
- 🚨 Emergencies
- 💬 General Inquiries

## 🚀 Getting Started

### Prerequisites

- Node.js 16.x or higher
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/hotel-ops-ai.git

# Navigate to project directory
cd hotel-ops-ai

# Install dependencies
npm install

# Start development server
npm run dev
```

### Usage

1. Launch the application
2. Navigate between Chat, Tasks, and Housekeeping views
3. Interact with the AI chat to create tasks
4. Monitor real-time operations from the dashboard
5. Assign and track tasks across departments

## 🏗️ Tech Stack

- **React** - UI framework with hooks
- **CSS-in-JS** - Custom styling with CSS variables
- **Date/Time Management** - Native JavaScript Date API

## 📊 Key Modules

### Guest Chat
- Natural language processing
- Intent classification
- Automatic task creation
- Guest context preservation

### Task Management
- Department-based routing
- SLA tracking and alerts
- Priority-based queuing
- Status lifecycle management

### Housekeeping
- Room status tracking
- Attendant assignment
- Cleaning schedules
- Performance metrics

## 🎨 Design System

- **Typography**: DM Serif Display, DM Sans, JetBrains Mono
- **Color Scheme**: Dark mode with gold accents
- **Layout**: Responsive grid with sidebar navigation
- **Components**: Modular panel-based architecture

## 📝 Configuration

Customize the system by modifying constants in the main component:

- `INTENTS` - Add or modify request types
- `ROOMS` - Configure room inventory
- `ATTENDANTS` - Set up staff members
- SLA times and priority levels

## 🔐 Security Notes

This is a demonstration project. For production use:
- Implement proper authentication
- Secure API endpoints
- Add rate limiting
- Encrypt sensitive data
- Validate all user inputs

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by modern hotel management systems
- Built with modern React patterns and best practices
- Designed for scalability and extensibility

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Note**: This is a frontend demonstration. For production deployment, integrate with a proper backend API and database.
