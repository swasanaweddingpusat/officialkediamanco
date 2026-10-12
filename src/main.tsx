import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./generated/fonts.css";

const root = document.getElementById("root");
if (root) createRoot(root).render(<App />);
