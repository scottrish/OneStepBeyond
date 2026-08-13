import { useAuth } from "./hooks/useAuth";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";

export default function App() {
  const { user, signUp, signIn, signOut } = useAuth();

  if (user) {
    return <HomePage user={user} signOut={signOut} />;
  }

  return <LoginPage signIn={signIn} signUp={signUp} />;
}
