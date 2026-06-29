# AG-store 🛒

A modern, responsive, and performance-oriented e-commerce frontend interface built with semantic HTML, CSS/Bootstrap, and vanilla JavaScript. Designed with a modular architecture, clean card layouts, and optimization for Persian typography and Persian locale numbers.

## 🚀 Key Features

*   **Responsive E-Commerce Layout:** Optimized grid system showcasing product cards beautifully across mobile, tablet, and desktop views.
*   **Modular Architecture:** Structured with a clean separation of concerns (HTML layouts, modular CSS, and dedicated JS API integration services).
*   **API Integration:** Fully compatible with REST APIs, utilizing Swagger specifications for streamlined communication.
*   **Localized Formatting:** Precise implementation of Persian currency and number formatting using `Intl.NumberFormat('fa-IR')` to handle thousands separators properly.
*   **Self-Hosted Assets:** Prioritizes CDN-free fonts (utilizing the *Vazirmatn* typeface locally) to ensure offline availability, stability, and faster load times.
*   **State Persistence:** Handles user sessions and authorization states locally via persistent `localStorage` mechanisms.

## 🛠️ Tech Stack & Structure

*   **Markup:** HTML5 (Semantic tags)
*   **Styling:** CSS3 / Bootstrap 5 (Customized for grid adjustments)
*   **Scripting:** Vanilla JavaScript (ES6+)
*   **Typography:** Vazirmatn Font (CDN-free / Local)

### Project Layout
```text
AG-store/
├── assets/
│   ├── css/
│   │   └── style.css      # Core styles (height constraints, typography, custom grids)
│   ├── js/
│   │   ├── app.js         # UI Render and layout handlers
│   │   └── api.js         # REST API clients & helper utilities
│   └── fonts/
│       └── Vazirmatn/     # Local Persian font files
├── index.html             # Main entry point (structured e-commerce landing page)
└── README.md              # Project documentation
🎨 UI/UX Improvements Included
Balanced Grid Layout: Modified grid structures to display products cleanly (e.g., transitioning to col-lg-3 or col-lg-2 based on container context to target an optimal count of cards per row).
Vertical Alignment: Used margin-top: auto on card footers and strict height parameters on titles to keep buttons, prices, and visual boundaries perfectly aligned.
No Wrap Rules: Enforced white-space: nowrap on pricing tags to prevent ugly currency abbreviation wraps on small screens.
⚙️ Installation & Usage
Clone the repository:
bash
   git clone https://github.com/alighi20/AG-store.git
   
Navigate into the directory:
bash
   cd AG-store
   
Run Locally:Since this is a client-side web app using local storage and modular scripts, you can open index.html directly in a browser or run it using a local development server (e.g., Live Server in VS Code):
bash
   # If you have Node.js and serve installed:
   npx serve .
   
🔒 Authentication & API Integration
The project communicates with a Swagger-documented backend. User authentication tokens are securely saved and fetched using localStorage to ensure persistence across page reloads:

javascript
// Example token handling
localStorage.setItem('authToken', token);
const token = localStorage.getItem('authToken');
