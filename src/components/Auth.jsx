import { useState } from "react";
import { TOKENS } from "../lib/constants.js";
import { FieldInput, LedgerMark } from "./Shared.jsx";
import { supabase } from "../lib/supabaseClient.js";

export function Auth({ initialError }) {
  const [mode, setMode] = useState("signin"); // "signin" | "signup" | "forgot"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError ? translateAuthError(initialError) : null);
  const [info, setInfo] = useState(null);

  const switchMode = (next) => {
    setMode(next);
    setError(null);
    setInfo(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      if (mode === "forgot") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + import.meta.env.BASE_URL,
        });
        if (resetError) throw resetError;
        setInfo("Si esa cuenta existe, te llegó un correo con un link para elegir una nueva contraseña.");
      } else if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin + import.meta.env.BASE_URL },
        });
        if (signUpError) throw signUpError;
        if (!data.session) {
          setInfo("Cuenta creada. Revisa tu correo y confirma tu email antes de iniciar sesión.");
          setMode("signin");
          setPassword("");
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }
    } catch (err) {
      setError(translateAuthError(err.message));
    } finally {
      setLoading(false);
    }
  };

  const titles = { signin: "Iniciar sesión", signup: "Crear cuenta", forgot: "Recuperar contraseña" };
  const submitLabels = { signin: "Entrar", signup: "Crear cuenta", forgot: "Enviar link de recuperación" };

  return (
    <div style={{ background: TOKENS.bg, minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: `${TOKENS.accent}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <LedgerMark size={19} color={TOKENS.accent} />
        </div>
        <div className="display" style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: TOKENS.text }}>Ledger</div>
      </div>
      <form
        onSubmit={handleSubmit}
        style={{ background: TOKENS.surface, border: `1px solid ${TOKENS.border}`, borderRadius: 12, padding: 28, width: "100%", maxWidth: 360 }}
      >
        <div className="display" style={{ fontSize: 17, fontWeight: 600, color: TOKENS.text, marginBottom: 4 }}>
          {titles[mode]}
        </div>
        <div style={{ fontSize: 12.5, color: TOKENS.textMuted, marginBottom: 20 }}>
          {mode === "forgot"
            ? "Escribe tu email y te mandamos un link para elegir una nueva contraseña."
            : "Tus movimientos y categorías, sincronizados entre tus dispositivos."}
        </div>

        <FieldInput label="Email" type="email" value={email} onChange={setEmail} required autoComplete="email" style={{ marginBottom: mode === "forgot" ? 16 : 12 }} />
        {mode !== "forgot" && (
          <FieldInput label="Contraseña" type="password" value={password} onChange={setPassword} required minLength={6}
            autoComplete={mode === "signin" ? "current-password" : "new-password"} style={{ marginBottom: 16 }} />
        )}

        {error && <div style={{ fontSize: 12.5, color: TOKENS.expense, marginBottom: 14 }}>{error}</div>}
        {info && <div style={{ fontSize: 12.5, color: TOKENS.income, marginBottom: 14 }}>{info}</div>}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%", padding: "10px 0", borderRadius: 8, border: "none",
            background: TOKENS.accent, color: TOKENS.bg, fontSize: 13.5, fontWeight: 600,
            cursor: loading ? "default" : "pointer", opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? "Un momento…" : submitLabels[mode]}
        </button>

        {mode === "signin" && (
          <div style={{ marginTop: 12, textAlign: "center", fontSize: 12, color: TOKENS.textFaint }}>
            <span onClick={() => switchMode("forgot")} style={{ cursor: "pointer" }}>¿Olvidaste tu contraseña?</span>
          </div>
        )}

        <div style={{ marginTop: 16, textAlign: "center", fontSize: 12.5, color: TOKENS.textMuted }}>
          {mode === "forgot" ? (
            <span onClick={() => switchMode("signin")} style={{ color: TOKENS.accent, cursor: "pointer" }}>Volver a iniciar sesión</span>
          ) : (
            <>
              {mode === "signin" ? "¿No tienes cuenta? " : "¿Ya tienes cuenta? "}
              <span onClick={() => switchMode(mode === "signin" ? "signup" : "signin")} style={{ color: TOKENS.accent, cursor: "pointer" }}>
                {mode === "signin" ? "Crear una" : "Inicia sesión"}
              </span>
            </>
          )}
        </div>
      </form>
    </div>
  );
}

function translateAuthError(message) {
  if (/invalid login credentials/i.test(message)) return "Email o contraseña incorrectos.";
  if (/email not confirmed/i.test(message)) return "Todavía no confirmaste tu email. Revisa tu bandeja de entrada.";
  if (/user already registered/i.test(message)) return "Ya existe una cuenta con ese email.";
  if (/link is invalid or has expired/i.test(message)) return "El link del correo venció o ya fue usado. Pedí uno nuevo.";
  return message;
}
