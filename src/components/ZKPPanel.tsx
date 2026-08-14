import { useState } from "react";
import { useWallet } from "@/lib/wallet-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Shield, KeyRound, Cpu, CheckCircle2, XCircle, Loader2, FileLock2 } from "lucide-react";

interface ProofStep {
  label: string;
  detail: string;
  status: "idle" | "active" | "done" | "error";
}

export function ZKPPanel() {
  const { address } = useWallet();
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<ProofStep[]>([
    { label: "Compile circuit", detail: "message_validity.circom → r1cs", status: "idle" },
    { label: "Trusted setup", detail: "Powers of Tau · Groth16 proving key", status: "idle" },
    { label: "Generate witness", detail: "Hash message + sender + nonce", status: "idle" },
    { label: "Create proof", detail: "zk-SNARK proof π = (A, B, C)", status: "idle" },
    { label: "Verify on-chain", detail: "Verifier.sol · 142k gas", status: "idle" },
  ]);
  const [proofOutput, setProofOutput] = useState<string | null>(null);

  const runProof = async () => {
    setRunning(true);
    setProofOutput(null);
    const updated = [...steps];
    for (let i = 0; i < updated.length; i++) {
      updated[i] = { ...updated[i], status: "active" };
      setSteps([...updated]);
      await new Promise((r) => setTimeout(r, 500 + Math.random() * 400));
      updated[i] = { ...updated[i], status: "done" };
      setSteps([...updated]);
    }
    const a = `0x${Math.random().toString(16).slice(2, 10)}…${Math.random().toString(16).slice(2, 6)}`;
    const b = `0x${Math.random().toString(16).slice(2, 10)}…${Math.random().toString(16).slice(2, 6)}`;
    const c = `0x${Math.random().toString(16).slice(2, 10)}…${Math.random().toString(16).slice(2, 6)}`;
    setProofOutput(`π_a: ${a}\nπ_b: ${b}\nπ_c: ${c}`);
    setRunning(false);
  };

  const reset = () => {
    setSteps(steps.map((s) => ({ ...s, status: "idle" })));
    setProofOutput(null);
  };

  return (
    <aside className="border-l border-slate-800/80 bg-slate-900/40 flex flex-col overflow-y-auto">
      <div className="px-5 py-4 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <FileLock2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-serif font-bold text-slate-100">ZKP Console</h3>
            <p className="text-xs text-slate-500">Groth16 proof pipeline</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Identity */}
        <div className="rounded-xl border border-slate-700/60 bg-slate-800/30 p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <KeyRound className="w-3.5 h-3.5" />
            Signing Identity
          </div>
          <div className="space-y-1.5">
            <Row label="Address" value={address ? `${address.slice(0, 10)}…${address.slice(-4)}` : "—"} mono />
            <Row label="Nullifier" value="0x7f3a…2b9c" mono />
            <Row label="Identity null" value="0x1e4d…8a0f" mono />
          </div>
        </div>

        {/* Pipeline */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Proof Pipeline</span>
            <Button variant="ghost" size="sm" onClick={reset} disabled={running} className="text-slate-500 hover:text-slate-300 h-7 text-xs">
              Reset
            </Button>
          </div>
          {steps.map((step, i) => (
            <div
              key={i}
              className={cn(
                "flex items-start gap-3 rounded-lg border px-3 py-2.5 transition",
                step.status === "active" && "border-emerald-500/40 bg-emerald-500/5",
                step.status === "done" && "border-slate-700/50 bg-slate-800/20",
                step.status === "idle" && "border-slate-800/60 bg-transparent",
                step.status === "error" && "border-red-900/50 bg-red-950/20"
              )}
            >
              <div className="mt-0.5">
                {step.status === "idle" && <div className="w-4 h-4 rounded-full border-2 border-slate-700" />}
                {step.status === "active" && <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />}
                {step.status === "done" && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                {step.status === "error" && <XCircle className="w-4 h-4 text-red-500" />}
              </div>
              <div className="min-w-0">
                <p className={cn("text-sm font-medium", step.status === "done" ? "text-slate-300" : step.status === "active" ? "text-emerald-200" : "text-slate-400")}>
                  {step.label}
                </p>
                <p className="text-xs text-slate-600 font-mono truncate">{step.detail}</p>
              </div>
            </div>
          ))}
        </div>

        <Button
          onClick={runProof}
          disabled={running}
          className="w-full bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-semibold"
        >
          {running ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating proof…
            </>
          ) : (
            <>
              <Cpu className="w-4 h-4 mr-2" />
              Generate ZK Proof
            </>
          )}
        </Button>

        {/* Output */}
        {proofOutput && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
              <Shield className="w-3.5 h-3.5" />
              Proof Generated
            </div>
            <pre className="text-xs font-mono text-emerald-300/80 whitespace-pre-wrap leading-relaxed">{proofOutput}</pre>
            <div className="pt-1 space-y-1">
              <Row label="Proof size" value="184 bytes" />
              <Row label="Verify gas" value="142,000" />
              <Row label="Circuit constraints" value="4,096" />
            </div>
          </div>
        )}

        {/* Contract info */}
        <div className="rounded-xl border border-slate-700/60 bg-slate-800/30 p-4 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Deployed Contracts</span>
          <Row label="ChatRoom" value="0x5FbDB…22864" mono />
          <Row label="ZKVerifier" value="0xe7f17…7a3b9" mono />
          <Row label="MessageStore" value="0x9fE46…2c1Ad" mono />
        </div>
      </div>
    </aside>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={cn("text-xs text-slate-300", mono && "font-mono")}>{value}</span>
    </div>
  );
}