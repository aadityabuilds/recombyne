# Recombyne - AI-Powered Plasmid Design Assistant

![Recombyne Screenshot](./public/images/readme.png)

Recombyne is an advanced web-based plasmid design application that combines the power of AI with intuitive DNA sequence visualization. It serves as a conversational interface for molecular biologists and genetic engineers to design custom plasmids through natural language interactions.

## Key Features

- **Conversational Interface**: Interact with the AI copilot using natural language to design and modify plasmids
- **Real-time Sequence Visualization**: Utilizes @teselagen/ove for interactive DNA sequence viewing and editing
- **Smart Backbone Selection**: Browse and insert pre-built plasmid backbones with category-based organization
- **GenBank Integration**: Search and import sequences directly from NCBI GenBank
- **Context-Aware AI**: Maintains conversation history for consistent and accurate assistance
- **Modern UI**: Clean, responsive design with intuitive split-pane layout

## How It Works

Recombyne acts as a "cursor" for plasmid design by:

1. Understanding user intent through natural language processing
2. Providing context-aware suggestions and modifications
3. Visualizing changes in real-time with interactive sequence views
4. Maintaining conversation history for consistent guidance
5. Integrating with external databases for comprehensive sequence information

## Acknowledgments

This project leverages several powerful open-source tools:

- **@teselagen/ove**: For advanced DNA sequence visualization and editing capabilities
- **DNAChisel**: For sequence optimization and design functionality

We are grateful to the maintainers and contributors of these projects for making this application possible.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager
- OpenAI API key (for AI functionality)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/recombyne.git
cd recombyne
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory with the following content:
```
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_NCBI_API_KEY=your_ncbi_api_key_here
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

### Environment Variables

The application requires several environment variables to function properly. A complete list of required variables can be found in `.env.example`. Here's what each variable is used for:

- **Server Configuration**
  - `SERVER_PORT`: Port for the Express server (default: 3001)
  - `PYTHONPATH`: Path to Python executable for DNA optimization

- **OpenAI Configuration**
  - `REACT_APP_OPENAI_API_KEY`: Your OpenAI API key for AI features

- **NCBI Configuration**
  - `REACT_APP_NCBI_EMAIL`: Your email for NCBI API requests
  - `REACT_APP_NCBI_TOOL_NAME`: Name of your tool for NCBI API
  - `REACT_APP_NCBI_API_KEY`: Your NCBI API key for enhanced access

- **Development Configuration**
  - `REACT_APP_USE_MOCK_API`: Set to false for production

Copy `.env.example` to `.env.local` and replace the placeholder values with your actual credentials. Never commit your `.env.local` file to version control.

### Development Server

The application uses a dual-server setup:
- Frontend: Vite development server 
- Backend: Express server 

Both servers run concurrently using the `concurrently` package.

### Building for Production

To build the application for production:
```bash
npm run build
# or
yarn build
```

The production build will be available in the `dist` directory.