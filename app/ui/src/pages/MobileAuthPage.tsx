/**
 * MobileAuthPage — /mobile-auth?redirect=<deep-link>
 *
 * Used by the mobile app (Expo) to sign in via Google without PKCE/proxy hacks.
 *
 * Flow:
 *  1. Mobile opens this page in WebBrowser.openAuthSessionAsync()
 *  2. First load: signInWithRedirect → browser navigates to Google
 *  3. Google redirects back here
 *  4. Second load: getRedirectResult() has user → exchangeFirebaseToken
 *  5. Redirect to deep link: askiepmobile://auth?token=xxx&refreshToken=yyy
 *  6. WebBrowser detects app scheme → closes → mobile handles tokens
 */
import { getAuthService } from "@/domain/auth/auth.service";
import { auth, googleProvider } from "@/lib/firebase";
import { getRedirectResult, signInWithRedirect } from "firebase/auth";
import { useEffect, useState } from "react";

type State = "loading" | "redirecting" | "error";

const ALLOWED_REDIRECT_SCHEMES = ["askiepmobile://"];

function isValidRedirectUri(uri: string): boolean {
  return ALLOWED_REDIRECT_SCHEMES.some((scheme) => uri.startsWith(scheme));
}

export function MobileAuthPage() {
  const [state, setState] = useState<State>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const rawRedirect = params.get("redirect") || "askiepmobile://auth";
    const redirectUri = isValidRedirectUri(rawRedirect) ? rawRedirect : "askiepmobile://auth";

    const run = async () => {
      try {
        // ── Second load: back from Google ───────────────────────────────────
        const result = await getRedirectResult(auth);

        if (result) {
          const firebaseToken = await result.user.getIdToken();
          const { accessToken, refreshToken } = await getAuthService().exchangeFirebaseToken(firebaseToken);
          // Send tokens back to the mobile app via deep link
          const deepLink = `${redirectUri}?token=${encodeURIComponent(accessToken)}&refreshToken=${encodeURIComponent(refreshToken)}`;
          window.location.href = deepLink;
          return;
        }

        // ── First load: kick off Google sign-in via full-page redirect ──────
        setState("redirecting");
        // Preserve redirect param through the Google redirect round-trip
        const callbackUrl = `${window.location.origin}/mobile-auth?redirect=${encodeURIComponent(redirectUri)}`;
        auth.config.authDomain; // ensure initialized
        // Store redirect URI so we recover it after Google returns
        sessionStorage.setItem("mobile_auth_redirect", redirectUri);
        await signInWithRedirect(auth, googleProvider);
      } catch (err: any) {
        console.error("[MobileAuth] error:", err);
        const msg = err?.message || "Authentication failed";
        setErrorMsg(msg);
        setState("error");
        // Send error back to mobile so WebBrowser can close
        const params2 = new URLSearchParams(window.location.search);
        const rawRedirect2 = params2.get("redirect") || sessionStorage.getItem("mobile_auth_redirect") || "askiepmobile://auth";
        const redirectUri2 = isValidRedirectUri(rawRedirect2) ? rawRedirect2 : "askiepmobile://auth";
        setTimeout(() => {
          window.location.href = `${redirectUri2}?error=${encodeURIComponent(msg)}`;
        }, 2000);
      }
    };

    // Recover redirect URI if Google wiped our query params during redirect
    const storedRedirect = sessionStorage.getItem("mobile_auth_redirect");
    if (!params.get("redirect") && storedRedirect) {
      const newUrl = `${window.location.pathname}?redirect=${encodeURIComponent(storedRedirect)}`;
      window.history.replaceState({}, "", newUrl);
    }

    run();
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="12" fill="#5B5AF7" />
            <path d="M14 24h20M24 14v20" stroke="white" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
        <h2 style={styles.title}>AskIEP</h2>

        {state === "loading" && (
          <>
            <div style={styles.spinner} />
            <p style={styles.text}>Checking sign-in status…</p>
          </>
        )}

        {state === "redirecting" && (
          <>
            <div style={styles.spinner} />
            <p style={styles.text}>Redirecting to Google…</p>
          </>
        )}

        {state === "error" && (
          <>
            <p style={{ ...styles.text, color: "#EF4444" }}>⚠ {errorMsg}</p>
            <p style={styles.subtext}>Returning to app…</p>
          </>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #EEF2FF 0%, #F5F3FF 100%)",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  card: {
    background: "#fff",
    borderRadius: 16,
    padding: "48px 40px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
    boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
    minWidth: 320,
  },
  logo: { marginBottom: 4 },
  title: { margin: 0, fontSize: 24, fontWeight: 700, color: "#111827" },
  text: { margin: 0, fontSize: 15, color: "#6B7280", textAlign: "center" },
  subtext: { margin: 0, fontSize: 13, color: "#9CA3AF" },
  spinner: {
    width: 32,
    height: 32,
    border: "3px solid #E5E7EB",
    borderTop: "3px solid #5B5AF7",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
};

// Inject keyframe for spinner
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
}
