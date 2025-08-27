# Flash Cards Application

A simple, interactive application for creating and studying with digital flash cards.

## Features

- Create and organize flash cards into decks
- Study mode with card flipping functionality
- Track your learning progress
- Responsive design for desktop and mobile use

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm (v6+)

### Installation

1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm start
   ```

## Usage

1. Create a new deck of cards
2. Add questions and answers to your deck
3. Enter study mode to practice with your cards
4. Track your progress as you learn

## Application Structure

```
flash-cards/
├── public/                  # Static files
│   ├── favicon.ico
│   ├── index.html           # HTML entry point
│   └── ...
├── src/                     # Source code
│   ├── components/          # React components
│   │   ├── Card/            # Flash card component
│   │   │   ├── Card.css
│   │   │   └── Card.js
│   │   ├── DeckList/        # Deck listing component
│   │   │   ├── DeckList.css
│   │   │   └── DeckList.js
│   │   ├── Forms/           # Input forms
│   │   │   ├── CardForm.css
│   │   │   ├── CardForm.js  # Form for adding/editing cards
│   │   │   ├── DeckForm.css
│   │   │   └── DeckForm.js  # Form for adding/editing decks
│   │   └── StudyMode/       # Study interface
│   │       ├── StudyMode.css
│   │       └── StudyMode.js
│   ├── context/
│   │   └── CardsContext.js  # State management
│   ├── App.css              # Main application styles
│   ├── App.js               # Main application component
│   └── index.js             # Application entry point
└── package.json             # Project configuration
```

## Technologies Used

- React.js for the frontend
- Context API for state management
- Local Storage for data persistence
- CSS for styling

## License

This project is open source and available under the MIT License.
