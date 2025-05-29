# Day Code

A comprehensive web application that aggregates and tracks programming contest schedules from major competitive programming platforms, displays hackathons, provides tutorial videos, and helps you manage your coding tasks - all in one place.

## 📚 Table of Contents

1. [Overview](#-overview)
2. [Features](#-features)
3. [Live Demo & Resources](#-live-demo--resources)
4. [Getting Started](#-getting-started)
   - [Prerequisites](#prerequisites)
   - [Installation](#installation)
   - [Running the Application](#running-the-application)
5. [Project Structure](#-project-structure)
6. [Core Functionalities](#-core-functionalities)
   - [Contest Tracking](#contest-tracking)
   - [Hackathon Discovery](#hackathon-discovery)
   - [Task Management](#task-management)
   - [Video Tutorials](#video-tutorials)
7. [Technology Stack](#-technology-stack)
8. [API Integrations](#-api-integrations)
9. [Challenges & Solutions](#-challenges--solutions)
10. [Future Enhancements](#-future-enhancements)
11. [Contributing](#-contributing)

## 📋 Overview

Day Code serves as a centralized hub for competitive programmers and developers to stay organized and informed about upcoming coding competitions and hackathons. The application fetches real-time contest data, displays relevant tutorial videos, and provides a robust task management system to help users plan their competitive programming journey effectively.

## ✨ Features
- **Coding Activiyt**: View activity from LeetCode & Github at one place
- **Contest Aggregation**: View contests from LeetCode, Codeforces, and CodeChef in one place
- **Hackathon Discovery**: Stay updated with the latest hackathon opportunities from Devpost
- **Task Management**: Organize your coding tasks with priorities, due dates, and status tracking
- **Tutorial Videos**: Access platform-specific tutorial videos for contests
- **Real-time Updates**: Get the most current contest schedules using platform APIs
- **Contest Filtering**: Sort and filter contests by platform, date, duration, and type

## 🔗 Live Demo & Resources

- **Demo Video**: [Watch the project demo](https://www.linkedin.com/posts/samrath-reddy_attention-coders-whether-youre-a-dsa-activity-7307755723109580800-0b-H?utm_source=share&utm_medium=member_desktop&rcm=ACoAAD2VzSEBqolc3AY61MDI9xdX1-_3h_Dtyb0)
- **Repository**: [Checkout the code](https://github.com/samrathreddy/Daycode)
- **Developer**: [Samrath Reddy](https://www.linkedin.com/in/samrath-reddy/)

## 🚀 Getting Started

### Prerequisites

Before installing the application, make sure you have the following installed:

- Node.js (v14+)
- npm or yarn

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/samrathreddy/Coding-Contest-Tracker.git
   cd Coding-Contest-Tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

### Running the Application

1. Start the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   ```

2. Open your browser and navigate to `http://localhost:5173` (or the port shown in your terminal)

## 📂 Project Structure

For beginners, here's a breakdown of the key directories and files:

```
/
├── public/              # Static assets
├── src/                 # Source code
│   ├── components/      # Reusable UI components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Library configurations
│   ├── pages/           # Application pages
│   │   ├── Contest.tsx  # Contest tracking page
│   │   ├── Hackathons.tsx # Hackathons page
│   │   ├── Home.tsx     # Landing page
│   │   ├── Tasks.tsx    # Task management page
│   │   └── Videos.tsx   # Tutorial videos page
│   ├── services/        # Service integrations
│   ├── utils/           # Utility functions
│   │   ├── api/         # API integration modules
│   │   ├── constants.ts # Application constants
│   │   └── types.ts     # TypeScript type definitions
│   ├── App.tsx          # Main application component
│   └── main.tsx         # Application entry point
├── package.json         # Dependencies and scripts
├── tailwind.config.ts   # Tailwind CSS configuration
└── vite.config.ts       # Vite build configuration
```

## 🔍 Core Functionalities

### Contest Tracking

The application aggregates programming contests from multiple platforms:

- **LeetCode**: Weekly and biweekly contests
- **Codeforces**: Regular, educational, and special contests
- **CodeChef**: Long challenges, cook-offs, and lunchtime contests

Each contest displays:

- Name and platform
- Start and end times (converted to your local timezone)
- Duration
- Status (upcoming, ongoing, or past)
- Direct link to the contest page

### Hackathon Discovery

Stay updated with the latest hackathon opportunities:

- Browse hackathons from Devpost
- View details including themes, prizes, and submission deadlines
- Filter by online/in-person, category, and timeframe

### Task Management

Organize your coding practice and contest preparation:

- Create tasks with titles, descriptions, and due dates
- Set priorities (low, medium, high)
- Track status (todo, in progress, completed)
- Apply tags for better organization
- Filter and search through tasks

### Video Tutorials

Access platform-specific tutorial videos directly within the app:

- Watch contest explanations and solutions
- Learn problem-solving techniques
- Discover competitive programming tips and tricks

## 🛠️ Technology Stack

### Frontend

- **Framework**: React.js with TypeScript
- **Build Tool**: Vite
- **State Management**: React Context API and React Query
- **Styling**: Tailwind CSS with shadcn/ui components
- **Routing**: React Router v6
- **Form Handling**: React Hook Form with Zod validation
- **Date Handling**: date-fns and date-fns-tz
- **HTTP Client**: Axios

## 🔌 API Integrations

The application integrates with the following APIs:

- **LeetCode**: GraphQL API for contest data
- **Codeforces**: REST API for contest listings
- **CodeChef**: REST API for contest information
- **Devpost**: For hackathon listings
- **YouTube**: For tutorial videos and content

## 🤔 Challenges & Solutions

### CORS Restrictions

**Challenge**: Many competitive programming platforms don't provide CORS headers, preventing direct API access from browsers.

**Solution**: Implemented proxy-based fetching strategies to securely access platform data.

### Time Zone Management

**Challenge**: Displaying contest times correctly across different time zones.

**Solution**: Used date-fns-tz for proper time zone conversions, storing all times as ISO strings internally and converting to local time for display.

### User Experience on Mobile

**Challenge**: Creating a seamless experience across desktop and mobile devices.

**Solution**: Implemented a responsive design with optimized navigation that adapts to different screen sizes.

## 🔮 Future Enhancements

- User authentication for personalized experiences
- Contest performance tracking and statistics
- Community features like discussion boards
- Integration with more competitive programming platforms
- Enhanced notification system with email/push alerts
- Calendar integration for contest reminders

## 🤝 Contributing

Contributions are welcome! If you'd like to contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

Built with ❤️ by [Samrath Reddy](https://www.linkedin.com/in/samrath-reddy/)
