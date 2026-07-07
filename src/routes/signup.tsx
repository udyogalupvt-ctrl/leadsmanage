import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Zap, Mail, Lock, User, Loader2, Eye, EyeOff, GraduationCap, Building2 } from "lucide-react";
import { toast } from "sonner";
import { signUpWithEmail, signInWithGoogle, completeGoogleSignup } from "@/lib/auth";
import { auth } from "@/lib/firebase";
import type { UseCase } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SearchParams = { google?: string };

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Sign Up · Lead Pilot" },
      { name: "description", content: "Create your Lead Pilot account." },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    google: typeof search.google === "string" ? search.google : undefined,
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const { google: googleParam } = Route.useSearch();
  const isGoogleComplete = googleParam === "complete";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [useCase, setUseCase] = useState<UseCase | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Pre-fill name for Google users
  useEffect(() => {
    if (isGoogleComplete && auth.currentUser) {
      setName(auth.currentUser.displayName ?? "");
      setEmail(auth.currentUser.email ?? "");
    }
  }, [isGoogleComplete]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!useCase) {
      toast.error("Please select your use case");
      return;
    }

    if (isGoogleComplete) {
      // Google user completing signup — just save the use case
      setLoading(true);
      try {
        await completeGoogleSignup(useCase);
        toast.success("Account created!");
        navigate({ to: "/" });
      } catch (err: any) {
        toast.error(err?.message ?? "Failed to complete signup");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await signUpWithEmail(email.trim(), password, name.trim(), useCase);
      toast.success("Account created!");
      navigate({ to: "/" });
    } catch (err: any) {
      const msg =
        err?.code === "auth/email-already-in-use"
          ? "An account with this email already exists"
          : err?.code === "auth/weak-password"
            ? "Password is too weak"
            : err?.message ?? "Signup failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const { isNewUser } = await signInWithGoogle();
      if (isNewUser) {
        // Stay on this page, show use case selector
        setName(auth.currentUser?.displayName ?? "");
        setEmail(auth.currentUser?.email ?? "");
        navigate({ to: "/signup", search: { google: "complete" } });
      } else {
        navigate({ to: "/" });
      }
    } catch (err: any) {
      if (err?.code !== "auth/popup-closed-by-user") {
        toast.error(err?.message ?? "Google sign-in failed");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl gradient-primary">
            <Zap className="h-6 w-6" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">
              {isGoogleComplete ? "One more step" : "Create your account"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isGoogleComplete
                ? "Select your industry to personalize your workspace"
                : "Start managing leads like a pro"}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Use Case Selector — always shown */}
          <div className="space-y-2">
            <Label>What do you use Lead Pilot for?</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setUseCase("education")}
                className={`group card-surface flex flex-col items-center gap-2.5 p-4 transition-all ${
                  useCase === "education"
                    ? "border-primary ring-2 ring-primary/20"
                    : "hover:border-primary/40"
                }`}
              >
                <div
                  className={`grid h-11 w-11 place-items-center rounded-xl transition-colors ${
                    useCase === "education"
                      ? "gradient-primary"
                      : "bg-muted text-muted-foreground group-hover:text-foreground"
                  }`}
                >
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold">Education</p>
                  <p className="text-[11px] text-muted-foreground">Admissions &amp; enrollment</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setUseCase("realestate")}
                className={`group card-surface flex flex-col items-center gap-2.5 p-4 transition-all ${
                  useCase === "realestate"
                    ? "border-primary ring-2 ring-primary/20"
                    : "hover:border-primary/40"
                }`}
              >
                <div
                  className={`grid h-11 w-11 place-items-center rounded-xl transition-colors ${
                    useCase === "realestate"
                      ? "gradient-primary"
                      : "bg-muted text-muted-foreground group-hover:text-foreground"
                  }`}
                >
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold">Real Estate</p>
                  <p className="text-[11px] text-muted-foreground">Property sales</p>
                </div>
              </button>
            </div>
          </div>

          {/* Only show email fields for non-Google signups */}
          {!isGoogleComplete && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="signup-name">Full name</Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="signup-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="h-11 pl-9"
                    autoComplete="name"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="signup-email">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-11 pl-9"
                    autoComplete="email"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="signup-password">Password</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="h-11 pl-9 pr-10"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </>
          )}

          <Button
            type="submit"
            disabled={loading || googleLoading}
            className="h-11 w-full gradient-primary text-sm font-semibold"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isGoogleComplete ? "Complete setup" : "Create account"}
          </Button>
        </form>

        {!isGoogleComplete && (
          <>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="h-11 w-full gap-2.5 text-sm font-medium"
              onClick={handleGoogle}
              disabled={googleLoading || loading}
            >
              {googleLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}
              Continue with Google
            </Button>
          </>
        )}

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
