"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/ui/logo";
import { useTransitionStore } from "@/lib/transition-store";
import { AlertCircle, ArrowLeft, CheckCircle, Loader2, Mail } from "lucide-react";
import { auth, googleProvider } from "@/lib/firebase";
import { signInWithPopup } from "firebase/auth";

type Mode = "signup" | "signin";

function GoogleGlyph() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function GoogleSignInButton({ label, returnUrl }: { label: string; returnUrl?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onClick() {
    setError("");
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      const res = await fetch("/api/auth/firebase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        window.location.href = returnUrl || data.redirect || "/dashboard";
        return;
      }

      setError(data.error || "Failed to authenticate with server. Please try again.");
      setLoading(false);
    } catch (err: any) {
      console.error("[Firebase Auth Error Details]:", err);
      if (err?.code === "auth/popup-closed-by-user" || err?.code === "auth/cancelled-popup-request") {
        setLoading(false);
        return;
      }
      if (err?.code === "auth/popup-blocked") {
        setError("Sign-in popup was blocked by your browser. Please allow popups for this site.");
      } else if (err?.code === "auth/unauthorized-domain") {
        setError("This domain is not authorized in Firebase Console (Authentication > Settings > Authorized domains).");
      } else if (err?.code === "auth/internal-error" || err?.code === "auth/configuration-not-found") {
        setError("Firebase configuration error: Please make sure Google Sign-in is enabled in Firebase Console (Authentication > Sign-in method > Google), with a Project Support Email selected and saved.");
      } else {
        setError(err?.message || "Google sign-in failed. Please try again.");
      }
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <Button
        variant="secondary"
        size="lg"
        className="mb-4 w-full"
        onClick={onClick}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <GoogleGlyph />
        )}
        {loading ? "Signing in..." : label}
      </Button>
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}

interface OtpAuthFormProps {
  mode: Mode;
  returnUrl?: string;
  onSwitchMode?: (mode: Mode) => void;
}

function OtpAuthForm({ mode, returnUrl, onSwitchMode }: OtpAuthFormProps) {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const isSignup = mode === "signup";

  useEffect(() => {
    if (!cooldown) return;
    const t = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(t);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  async function handleSendOtp(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, mode }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setStep("otp");
        setCooldown(60);
      } else if (data.code === "email_exists" && onSwitchMode) {
        // Already registered → move the visitor to Sign In automatically.
        setNotice(data.error || "This email is already registered. Please sign in.");
        onSwitchMode("signin");
      } else if (data.code === "account_not_found" && onSwitchMode) {
        // No account yet → move the visitor to Sign Up automatically.
        setNotice(data.error || "No account found with this email. Please create one.");
        onSwitchMode("signup");
      } else {
        setError(data.error || "Failed to send verification code. Please try again.");
      }
    } catch {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!code || code.trim().length !== 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, name }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        window.location.href = returnUrl || data.redirect || "/dashboard";
        return;
      }
      setError(data.error || "Invalid code. Please check and try again.");
    } catch {
      setError("Failed to verify code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (step === "otp") {
    return (
      <form onSubmit={handleVerifyOtp} className="space-y-4">
        <div className="text-center mb-4">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-paper-high/10 text-ink">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="font-display font-semibold text-lg text-ink">
            Enter 6-digit code
          </h3>
          <p className="text-xs text-ink-mute mt-1">
            We sent a verification code to <span className="font-medium text-ink">{email}</span>
          </p>
          <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Didn&apos;t receive the code? Check your spam / junk folder.
          </p>
        </div>

        <div>
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="• • • • • •"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            required
            autoFocus
            className="text-center text-2xl tracking-[0.4em] font-mono font-bold h-14"
            aria-label="Verification Code"
          />
        </div>

        {error && <p className="text-xs text-red-600 text-center">{error}</p>}

        <Button type="submit" size="lg" className="w-full" disabled={loading || code.length !== 6}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {loading ? "Verifying..." : "Verify & Continue"}
        </Button>

        <div className="flex items-center justify-between pt-2 text-xs text-ink-mute">
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setError("");
              setCode("");
            }}
            className="inline-flex items-center gap-1 hover:text-ink font-medium"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Change email
          </button>

          {cooldown > 0 ? (
            <span className="text-ink-faint">Resend in {cooldown}s</span>
          ) : (
            <button
              type="button"
              onClick={() => handleSendOtp()}
              className="text-green-600 hover:underline font-medium"
              disabled={loading}
            >
              Resend code
            </button>
          )}
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSendOtp} className="space-y-4">
      {isSignup && (
        <Input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Name"
        />
      )}
      <Input
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        aria-label="Email address"
      />
      {notice && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {notice}
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
        {loading ? "Sending code..." : "Send verification code"}
      </Button>
      <p className="text-center text-xs text-ink-faint">
        You&apos;ll receive a 6-digit code by email — check your spam folder if it doesn&apos;t appear.
      </p>
    </form>
  );
}

interface FormShellProps {
  onToggle: () => void;
  returnUrl?: string;
  onSwitchMode?: (mode: Mode) => void;
}

function SignInForm({ onToggle, returnUrl, onSwitchMode }: FormShellProps) {
  return (
    <div className="w-full max-w-sm">
      <h1 className="display text-3xl font-semibold text-ink">Welcome back</h1>
      <p className="mb-8 mt-2 text-ink-mute">Continue where you left off.</p>

      <GoogleSignInButton label="Continue with Google" returnUrl={returnUrl} />

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-line" />
        </div>
        <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
          <span className="bg-paper px-3 text-ink-faint">or</span>
        </div>
      </div>

      <OtpAuthForm mode="signin" returnUrl={returnUrl} onSwitchMode={onSwitchMode} />

      <p className="mt-8 text-center text-sm text-ink-mute">
        New here?{" "}
        <button onClick={onToggle} className="link-underline font-medium text-ink">
          Create an account
        </button>
      </p>
    </div>
  );
}

function SignUpForm({ onToggle, returnUrl, onSwitchMode }: FormShellProps) {
  return (
    <div className="w-full max-w-sm">
      <h1 className="display text-3xl font-semibold text-ink">Create your account</h1>
      <p className="mb-8 mt-2 text-ink-mute">Put your channel on autopilot.</p>

      <GoogleSignInButton label="Sign up with Google" returnUrl={returnUrl} />

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-line" />
        </div>
        <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
          <span className="bg-paper px-3 text-ink-faint">or</span>
        </div>
      </div>

      <OtpAuthForm mode="signup" returnUrl={returnUrl} onSwitchMode={onSwitchMode} />

      <p className="mt-8 text-center text-sm text-ink-mute">
        Already have an account?{" "}
        <button onClick={onToggle} className="link-underline font-medium text-ink">
          Sign in
        </button>
      </p>
    </div>
  );
}

export default function LoginPage() {
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");
  const returnUrl = searchParams.get("return_url") || undefined;
  const [mode, setMode] = useState<Mode>(() =>
    searchParams.get("mode") === "signin" ? "signin" : "signup"
  );
  const [panelCopy, setPanelCopy] = useState<Mode>(() =>
    searchParams.get("mode") === "signin" ? "signin" : "signup"
  );
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);



  // Resolve the "Get Started" expand transition: shrink the fullscreen
  // black overlay into the side panel once this screen is mounted under it.
  useEffect(() => {
    const state = useTransitionStore.getState();
    if (state.phase === "covered" || state.phase === "expanding") {
      setMode(state.target);
      setPanelCopy(state.target);
      const t = window.setTimeout(() => {
        useTransitionStore.getState().startShrink();
      }, 60);
      return () => window.clearTimeout(t);
    }
  }, []);

  function toggle() {
    const next: Mode = mode === "signup" ? "signin" : "signup";
    setMode(next);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setPanelCopy(next), 380);
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const panelContent = (
    <>
      <Link href="/" className="group mb-10 inline-flex transition-opacity hover:opacity-80">
        <Logo variant="paper" />
      </Link>

      <div key={panelCopy} className="animate-fade-in">
        {panelCopy === "signup" ? (
          <>
            <h2 className="display text-display-md">
              Let AI run your channel while you focus on the craft.
            </h2>
            <p className="mt-5 max-w-sm leading-relaxed text-paper/70">
              Connect your channel, set your niche, and the agent handles the
              rest — around the clock.
            </p>
          </>
        ) : (
          <>
            <h2 className="display text-display-md">Welcome back.</h2>
            <p className="mt-5 max-w-sm leading-relaxed text-paper/70">
              Your channel has been growing. Pick up where you left off and see
              what the agent has been working on.
            </p>
          </>
        )}
      </div>
    </>
  );

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-paper">


      {/* ============ Desktop: sliding panel ============ */}
      <div className="hidden lg:block">
        {/* Sign In form — left half */}
        <div className="absolute inset-y-0 left-0 z-0 flex w-1/2 items-center justify-center px-10">
          <SignInForm onToggle={toggle} returnUrl={returnUrl} onSwitchMode={setMode} />
        </div>
        {/* Sign Up form — right half */}
        <div className="absolute inset-y-0 right-0 z-0 flex w-1/2 items-center justify-center px-10">
          <SignUpForm onToggle={toggle} returnUrl={returnUrl} onSwitchMode={setMode} />
        </div>

        {/* Dark panel — slides left <-> right */}
        <div
          className={cn(
            "absolute inset-y-0 left-0 z-10 flex w-1/2 items-center bg-ink px-14 text-paper-high",
            "transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]",
            mode === "signup" ? "translate-x-0" : "translate-x-full"
          )}
        >
          <div className="w-full">{panelContent}</div>
        </div>
      </div>

      {/* ============ Mobile: stacked with fade ============ */}
      <div className="lg:hidden">
        <div className="bg-ink px-6 pb-10 pt-12 text-paper-high">
          <Link href="/" className="mb-8 inline-flex">
            <Logo variant="paper" size="sm" />
          </Link>
          <div key={panelCopy} className="animate-fade-in">
            <h2 className="display text-2xl leading-snug">
              {panelCopy === "signup"
                ? "Let AI run your channel while you focus on the craft."
                : "Welcome back."}
            </h2>
          </div>
        </div>

        <div className="px-6 py-10">
          <div key={mode} className="animate-fade-in">
            {mode === "signup" ? (
              <SignUpForm onToggle={toggle} returnUrl={returnUrl} onSwitchMode={setMode} />
            ) : (
              <SignInForm onToggle={toggle} returnUrl={returnUrl} onSwitchMode={setMode} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
