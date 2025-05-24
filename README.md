# DocAI - Component Visualization Tool

Visualize and explore the component architecture of any GitHub repository.

## Features

- 🔍 Analyze React/Next.js repositories from GitHub
- 📊 Interactive component dependency graph
- 📁 File explorer with component indicators
- 🔄 Real-time analysis with progressive updates
- 📝 Component details and code preview

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/docai.git
cd docai
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory and add your GitHub token:
```env
GITHUB_TOKEN=your_github_personal_access_token_here
```

To get a GitHub Personal Access Token:
- Go to [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens)
- Click "Generate new token" (classic)
- Select scopes: `repo` (for private repos) or `public_repo` (for public repos only)
- Copy the token and add it to your `.env.local` file

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. Enter a GitHub repository URL in the input field (e.g., `https://github.com/admineral/OpenAI-Assistant-API-Chat`)
2. Click "Analyze" or press Enter
3. Watch as components are discovered and visualized in real-time
4. Click on components to see their details, dependencies, and code

## Technologies Used

- Next.js 15
- React Flow for graph visualization
- TypeScript
- Tailwind CSS
- GitHub API for repository analysis

## License

MIT
