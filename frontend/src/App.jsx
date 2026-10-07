import Chat from "./pages/Chat";
import NotFound from "./pages/NotFound";

export default function App() {
  return window.location.pathname === "/" ? <Chat /> : <NotFound />;
}
