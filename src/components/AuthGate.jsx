import { useEffect, useState } from "react";
import { TOKENS } from "../lib/constants.js";
import { useTheme } from "../lib/useTheme.js";
import { supabase } from "../lib/supabaseClient.js";
import { Auth } from "./Auth.jsx";
import { ResetPassword } from "./ResetPassword.jsx";
import App from "../App.jsx";

export function AuthGate() {
  const [session, setSession] = useState(undefined); // undefined = todavía no se sabe
  const [recovering, setRecovering] = useState(false); // true: llegó desde el link de "olvidé mi contraseña"
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === "PASSWORD_RECOVERY") setRecovering(true);
      setSession(newSession);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (session === undefined) {
    return (
      <div style={{ background: TOKENS.bg, color: TOKENS.textMuted, height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        Cargando…
      </div>
    );
  }

  if (recovering) return <ResetPassword onDone={() => setRecovering(false)} />;

  if (!session) return <Auth />;

  return <App onSignOut={() => supabase.auth.signOut()} theme={theme} onToggleTheme={toggleTheme} />;
}
