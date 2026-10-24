import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// Font self-host Lovable (/__l5e/) tidak tersedia di Railway; font dimuat dari Google Fonts di index.html.
// import "./generated/fonts.css";

const root = document.getElementById("root");
if (root) createRoot(root).render(<App />);
