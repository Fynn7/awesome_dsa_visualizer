import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  Navigate,
  RouterProvider,
  createBrowserRouter,
  useSearchParams,
} from "react-router-dom";
import App from "./App";
import type { AlgorithmId } from "./lib/mockTrace";
import { getFilteredPaletteItems } from "./lib/commandPaletteItems";
import { HomePage } from "./pages/HomePage";
import "./index.css";

const VALID_ALGORITHM_IDS = new Set<AlgorithmId>(
  getFilteredPaletteItems("").map(({ item }) => item.id)
);

function MainPage() {
  const [searchParams] = useSearchParams();
  const algorithm = searchParams.get("algorithm");
  const initialAlgorithmId =
    algorithm && VALID_ALGORITHM_IDS.has(algorithm as AlgorithmId)
      ? (algorithm as AlgorithmId)
      : undefined;
  return <App initialAlgorithmId={initialAlgorithmId} />;
}

const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  { path: "/app", element: <MainPage /> },
  { path: "*", element: <Navigate to="/" replace /> },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
