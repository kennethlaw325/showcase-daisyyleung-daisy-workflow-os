import { createRoot } from "react-dom/client";
import Dashboard from "../app/page";

const root = document.getElementById("root");

if (!root) {
  throw new Error("Standalone dashboard root was not found.");
}

createRoot(root).render(<Dashboard />);
