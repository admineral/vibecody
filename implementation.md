# DocAI: React Component Visualization Canvas

## Overview

DocAI's Component Visualization Canvas is an interactive diagram tool for React component visualization, similar to n8n's workflow editor. It provides a visual representation of a React application's architecture by displaying components as draggable cards connected with relationship lines, making it easy to understand component dependencies, data flow, and structure.

## Implemented Features

### Core Components

1. **Canvas** - Interactive ReactFlow-based diagram area where components are visualized as nodes with custom styling and connections.

2. **Component Cards** - Custom interactive cards representing React components with:
   - Component name and description
   - Visual indication of component type (page, layout, component, hook, etc.)
   - Input/output handles for connections
   - Visual metrics showing props count, incoming and outgoing connections
   - Selection state with highlighting

3. **File Explorer** - Tree view of the project's file structure with:
   - Hierarchical representation of directories and files
   - Component highlighting by type
   - Selection and navigation to components

4. **Properties Panel** - Detailed view of selected components with:
   - Component metadata display
   - Props list with types, descriptions, and required status
   - Connections tab showing components this component uses and is used by
   - Code tab for viewing component source code

5. **Code Viewer** - Syntax-highlighted code display for component implementation

### Technical Implementation

1. **Component Metadata System**
   - Types and interfaces for component metadata
   - Support for component relationships (uses/usedBy)
   - Prop type definitions and documentation

2. **Interactive Graph Management**
   - Custom React hook (useComponentGraph) for managing the component graph
   - Auto-layout algorithm for component positioning
   - Edge creation based on component relationships
   - Node and edge state management

3. **UI/UX Features**
   - Responsive layout with resizable panels
   - Collapsible sidebar and properties panel
   - Component type color coding
   - Interactive selection and highlighting
   - Minimap for navigation
   - Zoom and pan controls

### Data Visualization

The visualization shows:
- Component hierarchy and dependencies
- Data flow between components
- Component categorization (pages, layouts, UI components, hooks)
- Detailed component documentation including props and relationships
- Interactive graph with zoom, pan, and selection capabilities

### Admin Interface

1. **Component Metadata Management**
   - Interactive file tree view of the project structure
   - Component list with filterable/sortable columns
   - Detailed component view showing relationships and props
   - JSON editor for direct manipulation of component metadata

2. **File Generation System**
   - API endpoint for generating mock Next.js component files
   - Generation of JSDoc annotations based on component metadata
   - Creation of appropriate file structure matching Next.js conventions
   - Support for different component types (layouts, pages, components, hooks)

3. **Testing Framework**
   - Generation of sample Next.js project for testing
   - Mock component files with appropriate metadata
   - Standardized JSDoc format for component metadata
   - Integration with the visualization system

### Metadata Format

We've standardized on a JSDoc-based metadata format for components:

```jsx
/**
 * @component ButtonComponent
 * @type client
 * @description Primary button used across the application
 * @uses Spinner, Icon
 * @usedBy LoginForm, SubmitForm, Header
 * @props {string} variant (optional) (default: primary) - Button style variant
 * @props {ReactNode} children - Button content
 * @props {() => void} onClick (optional) - Click handler
 */
```

This metadata describes:
- Component name and rendering type (client/server)
- Component description
- Relationships with other components (uses/usedBy)
- Props with types, required status, default values, and descriptions

## Technologies Used

- **ReactFlow** - For the interactive node-based canvas
- **React** - For UI components
- **TypeScript** - For type safety and component metadata
- **TailwindCSS** - For styling and responsive design
- **Prism** - For code syntax highlighting
- **Next.js** - For the application framework and API routes

## Testing Approach

Our testing approach includes:

1. **Mock Data Generation**:
   - Admin interface to define component relationships
   - JSON editor for manipulating component metadata
   - API endpoint to generate mock Next.js files

2. **File Generation**:
   - Creation of a mock-nextjs-app directory
   - Generation of TypeScript files with appropriate imports
   - JSDoc annotations based on component metadata

3. **Integration Testing**:
   - Testing the canvas visualization with generated components
   - Verifying relationship mapping between components
   - Testing the properties panel with component details

## Current State

The application currently supports:
- Visualization of pre-defined component metadata
- Interactive selection and navigation between components
- Auto-layout of components based on their relationships
- Detailed component information display
- Code sample viewing
- Collapsible interface panels
- Admin interface for metadata management
- File generation API for testing

## Next Steps

1. **GitHub Integration**:
   - Parser for actual GitHub repositories
   - Authentication and repository selection
   - Automated component detection and relationship mapping

2. **Enhanced Visualization**:
   - Component grouping and categorization
   - Advanced layout algorithms for large component trees
   - Filtering and searching capabilities

3. **Real-time Updates**:
   - Webhooks for detecting repository changes
   - Real-time updates to the component visualization
   - Diff viewing between versions 