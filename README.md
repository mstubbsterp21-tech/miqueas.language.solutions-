## Miqueas Language Solutions Website

This project contains the source code for a small marketing website for **Miqueas Language Solutions**. It is built
using [React](https://react.dev/), [Vite](https://vitejs.dev/), and [Tailwind CSS](https://tailwindcss.com/). The
site introduces the company’s services, background, and resources, and provides a contact form for requesting a
quote.

### Development

To run the site locally, ensure you have Node.js installed. Then run:

```bash
npm install
npm run dev
```

The development server will start, and you can view the site at <http://localhost:5173> (the default Vite port).

### Project Structure

- `index.html` – entry point served by Vite.
- `src/main.jsx` – sets up the React application and router.
- `src/App.jsx` – top-level component with header, footer, and routing.
- `src/pages/` – individual page components (`Home.jsx`, `Services.jsx`, `About.jsx`, `Resources.jsx`, `Contact.jsx`).
- `src/logo.png` – logo used in the header and footer (placeholder graphic).
- `vite.config.js` – configuration for Vite with plugins for React and Tailwind CSS.
- `package.json` – lists dependencies and scripts.

### Styling

The project uses Tailwind CSS for styling and includes a custom color palette defined in `App.jsx`. Additional
component-specific styling can be applied inline or via Tailwind utility classes.
