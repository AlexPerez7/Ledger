import { Component } from "react";
import { AlertTriangle } from "lucide-react";
import { TOKENS } from "../lib/constants.js";

// Aísla fallas de render a la sección donde ocurren en vez de dejar toda la
// app en blanco — los error boundaries de React solo existen como clase.
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary capturó un error:", error, info);
  }

  handleReset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback(this.handleReset);
      return (
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
          padding: "40px 20px", textAlign: "center", color: TOKENS.textFaint, fontSize: 12.5,
        }}>
          <AlertTriangle size={20} color={TOKENS.expense} />
          <div>Esta sección tuvo un problema y no se pudo mostrar.</div>
          <button
            onClick={this.handleReset}
            style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${TOKENS.border}`, background: "transparent", color: TOKENS.textMuted, fontSize: 12, cursor: "pointer" }}
          >
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
