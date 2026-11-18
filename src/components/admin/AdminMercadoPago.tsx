import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Copy, CreditCard, Eye, EyeOff, Loader2, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { usePaymentSettings } from "@/hooks/use-payment-settings";
import {
  defaultPaymentSettings,
  isMercadoPagoConfigured,
  mercadoPagoWebhookUrl,
  paymentSettingsKey,
  savePaymentSettings,
  type PaymentSettings,
} from "@/lib/payment-settings";
import { formatDateTimeSP } from "@/lib/format";

type SecretFieldProps = {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  show: boolean;
  disabled: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
};

function SecretField({
  id,
  label,
  value,
  placeholder,
  show,
  disabled,
  onChange,
  onToggle,
}: SecretFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className="font-mono text-xs"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onToggle}
          disabled={disabled}
          aria-label={show ? `Ocultar ${label}` : `Mostrar ${label}`}
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </Button>
      </div>
    </div>
  );
}

export function AdminMercadoPago() {
  const queryClient = useQueryClient();
  const { data, isLoading } = usePaymentSettings();
  const webhookUrl = useMemo(
    () => mercadoPagoWebhookUrl(String(import.meta.env["VITE_SUPABASE_URL"] ?? "")),
    [],
  );
  const [form, setForm] = useState<PaymentSettings>(() => defaultPaymentSettings(webhookUrl));
  const [showSecrets, setShowSecrets] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  function update<K extends keyof PaymentSettings>(key: K, value: PaymentSettings[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function copyWebhook() {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      toast.success("URL do webhook copiada.");
    } catch {
      toast.error("Não foi possível copiar. Selecione o campo e copie manualmente.");
    }
  }

  async function save() {
    if (form.enabled && !isMercadoPagoConfigured(form)) {
      toast.error(
        "Preencha chave pública, access token, webhook secret e user ID antes de ativar.",
      );
      return;
    }
    setSaving(true);
    try {
      await savePaymentSettings({ ...form, notificationUrl: webhookUrl });
      toast.success("Configuração do Mercado Pago salva.");
      await queryClient.invalidateQueries({ queryKey: paymentSettingsKey });
    } catch {
      toast.error("Não foi possível salvar a configuração.");
    } finally {
      setSaving(false);
    }
  }

  const configured = isMercadoPagoConfigured(form);
  const disabled = isLoading || saving;

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-lg font-bold">
            <CreditCard className="size-5 text-primary" /> Mercado Pago
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Cadastre as credenciais, o webhook e os identificadores usados pela integração de
            pagamentos.
          </p>
        </div>
        <Badge variant={configured ? "default" : "outline"}>
          {configured ? "Configurado" : "Pendente"}
        </Badge>
      </div>

      {isLoading ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          <div className="mt-5 flex flex-wrap items-center gap-6 rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex items-center gap-3">
              <Switch
                id="mp-enabled"
                checked={form.enabled}
                disabled={saving}
                onCheckedChange={(value) => update("enabled", value)}
              />
              <Label htmlFor="mp-enabled">Integração ativa</Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="mp-sandbox"
                checked={form.sandbox}
                disabled={saving}
                onCheckedChange={(value) => update("sandbox", value)}
              />
              <Label htmlFor="mp-sandbox">Modo sandbox (testes)</Label>
            </div>
            {form.updatedAt && (
              <span className="text-xs text-muted-foreground">
                Última alteração: {formatDateTimeSP(form.updatedAt)}
              </span>
            )}
          </div>

          <div className="mt-4 flex gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
            <p>
              As credenciais ficam no banco com acesso restrito a administradores. Use o modo
              sandbox para testar e só desative quando a integração estiver validada.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="mp-site">Site ID</Label>
              <Input
                id="mp-site"
                value={form.siteId}
                placeholder="MLB"
                disabled={disabled}
                onChange={(event) => update("siteId", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mp-user">User ID do Mercado Pago</Label>
              <Input
                id="mp-user"
                value={form.userId}
                placeholder="123456789"
                disabled={disabled}
                onChange={(event) => update("userId", event.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="mp-public">Chave pública (Public Key)</Label>
              <Input
                id="mp-public"
                value={form.publicKey}
                placeholder={form.sandbox ? "TEST-..." : "APP_USR-..."}
                autoComplete="off"
                spellCheck={false}
                disabled={disabled}
                onChange={(event) => update("publicKey", event.target.value)}
                className="font-mono text-xs"
              />
            </div>
            <SecretField
              id="mp-access"
              label="Access Token"
              value={form.accessToken}
              placeholder={form.sandbox ? "TEST-..." : "APP_USR-..."}
              show={showSecrets}
              disabled={disabled}
              onChange={(value) => update("accessToken", value)}
              onToggle={() => setShowSecrets((current) => !current)}
            />
            <SecretField
              id="mp-webhook-secret"
              label="Webhook Secret (x-signature)"
              value={form.webhookSecret}
              placeholder="Senha cadastrada no webhook"
              show={showSecrets}
              disabled={disabled}
              onChange={(value) => update("webhookSecret", value)}
              onToggle={() => setShowSecrets((current) => !current)}
            />
            <div className="space-y-2">
              <Label htmlFor="mp-integrator">Integrator ID (opcional)</Label>
              <Input
                id="mp-integrator"
                value={form.integratorId}
                placeholder="ID do integrador"
                disabled={disabled}
                onChange={(event) => update("integratorId", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mp-plan">ID do plano de assinatura (opcional)</Label>
              <Input
                id="mp-plan"
                value={form.subscriptionPlanId}
                placeholder="ID do preapproval plan"
                disabled={disabled}
                onChange={(event) => update("subscriptionPlanId", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mp-pix">Chave Pix (opcional)</Label>
              <Input
                id="mp-pix"
                value={form.pixKey}
                placeholder="CPF, e-mail, telefone ou chave aleatória"
                disabled={disabled}
                onChange={(event) => update("pixKey", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mp-descriptor">Descrição no extrato</Label>
              <Input
                id="mp-descriptor"
                value={form.statementDescriptor}
                placeholder="STARTEX"
                disabled={disabled}
                onChange={(event) => update("statementDescriptor", event.target.value)}
              />
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <Label htmlFor="mp-webhook">URL do webhook</Label>
            <div className="flex gap-2">
              <Input id="mp-webhook" value={webhookUrl} readOnly className="font-mono text-xs" />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => void copyWebhook()}
              >
                <Copy className="size-4" />
                <span className="sr-only">Copiar URL do webhook</span>
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Cadastre essa URL no painel do Mercado Pago e use a mesma senha do campo Webhook
              Secret.
            </p>
          </div>

          <div className="mt-6 flex justify-end">
            <Button type="button" variant="hero" onClick={() => void save()} disabled={disabled}>
              {saving ? <Loader2 className="animate-spin" /> : <Save className="size-4" />}
              Salvar configuração
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
