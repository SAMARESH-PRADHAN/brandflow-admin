import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, KeyRound, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { adminLogin, adminForgotPassword } from "@/lib/api";
import { setAdminAuthed } from "@/lib/auth";

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [masterKey, setMasterKey] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      toast.error("Enter email and password");
      return;
    }
    setLoading(true);
    try {
      const res = await adminLogin(email.trim(), password);
      setAdminAuthed(true);
      toast.success(`Welcome back, ${res.email}`);
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!masterKey.trim() || !newPassword) {
      toast.error("Enter the master key and a new password");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await adminForgotPassword(masterKey.trim(), newPassword);
      toast.success("Password updated — please sign in");
      setMode("login");
      setPassword("");
      setMasterKey("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-[#0a0a0a] px-4">
      {/* Ambient red glow accents */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-[#e11d2e]/20 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-[#e11d2e]/10 blur-[120px]" />

      <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#131313] p-7 shadow-[0_1px_2px_rgb(0_0_0/0.4),0_20px_48px_-20px_rgb(0_0_0/0.6)] animate-in-up">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white shadow-lg overflow-hidden">
            <img src="/logo.png" alt="Arreniux" className="h-full w-full object-contain p-1.5" />
          </div>
          <h1 className="mt-3 font-display text-xl text-white">ARRHENIUX Admin</h1>
          <p className="mt-1 text-xs text-white/50">
            {mode === "login" ? "Sign in to manage your store" : "Reset your admin password"}
          </p>
        </div>

        {mode === "login" ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-white/70">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  placeholder="you@arreniux.com"
                  className="border-white/10 bg-white/5 pl-9 text-white placeholder:text-white/30 focus-visible:ring-[#e11d2e]"
                  autoFocus
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-white/70">Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  placeholder="••••••••"
                  className="border-white/10 bg-white/5 pl-9 text-white placeholder:text-white/30 focus-visible:ring-[#e11d2e]"
                />
              </div>
            </div>
            <Button
              className="w-full bg-[#e11d2e] text-white hover:bg-[#e11d2e]/90"
              disabled={loading}
              onClick={handleLogin}
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>
            <button
              type="button"
              onClick={() => setMode("forgot")}
              className="w-full text-center text-xs text-white/50 hover:text-[#e11d2e]"
            >
              Forgot password?
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-white/70">Master Key</Label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <Input
                  type="password"
                  value={masterKey}
                  onChange={(e) => setMasterKey(e.target.value)}
                  placeholder="Master key"
                  className="border-white/10 bg-white/5 pl-9 text-white placeholder:text-white/30 focus-visible:ring-[#e11d2e]"
                  autoFocus
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-white/70">New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-[#e11d2e]"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-white/70">Confirm New Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleReset()}
                placeholder="Confirm password"
                className="border-white/10 bg-white/5 text-white placeholder:text-white/30 focus-visible:ring-[#e11d2e]"
              />
            </div>
            <Button
              className="w-full bg-[#e11d2e] text-white hover:bg-[#e11d2e]/90"
              disabled={loading}
              onClick={handleReset}
            >
              {loading ? "Updating..." : "Reset password"}
            </Button>
            <button
              type="button"
              onClick={() => setMode("login")}
              className="flex w-full items-center justify-center gap-1 text-center text-xs text-white/50 hover:text-[#e11d2e]"
            >
              <ArrowLeft className="h-3 w-3" /> Back to sign in
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default LoginPage;