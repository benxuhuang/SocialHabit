import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

document.documentElement.classList.add('light');
document.body.classList.add('font-sf', 'bg-background', 'text-foreground');

createRoot(document.getElementById("root")!).render(<App />);
