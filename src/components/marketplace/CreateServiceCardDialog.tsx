import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Camera, ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/components/site/AuthLayout";
import { initials } from "@/lib/community";
import { maskPhoneBR } from "@/lib/format";
import {
  AVATAR_TYPES,
  MAX_AVATAR_BYTES,
  adminServiceCardsKey,
  cardSchema,
  marketplaceCardsKey,
  saveServiceCard,
  uploadCardAvatar,
  type ServiceCard,
} from "@/lib/marketplace";
import { fieldErrors } from "@/lib/validation";

type MemberInfo = {
  userId: string;
  nome: string;
  cidade: string;
  estado: string;
  telefone: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: MemberInfo;
  existingCard: ServiceCard | null;
};

type FormValues = {
  nome: string;
  cidade: string;
  estado: string;
  servico: string;
  descricao: string;
  contato: string;
};

function emptyForm(
  member: Pick<MemberInfo, "nome" | "cidade" | "estado" | "telefone">,
): FormValues {
  return {
    nome: member.nome,
    cidade: member.cidade,
    estado: member.estado,
    servico: "",
    descricao: "",
    contato: maskPhoneBR(member.telefone),
  };
}

export function CreateServiceCardDialog({ open, onOpenChange, member, existingCard }: Props) {
  const queryClient = useQueryClient();
  const { userId, nome, cidade, estado, telefone } = member;
  const [form, setForm] = useState<FormValues>(() => emptyForm({ nome, cidade, estado, telefone }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [avatarUrl, setAvatarUrl] = useState<string | null>(existingCard?.avatar_url ?? null);
  const [preview, setPreview] = useState<string | null>(existingCard?.avatar_url ?? null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setForm(
      existingCard
        ? {
            nome: existingCard.nome,
            cidade: existingCard.cidade,
            estado: existingCard.estado,
            servico: existingCard.servico,
            descricao: existingCard.descricao,
            contato: maskPhoneBR(existingCard.contato),
          }
        : emptyForm({ nome, cidade, estado, telefone }),
    );
    setAvatarUrl(existingCard?.avatar_url ?? null);
    setPreview(existingCard?.avatar_url ?? null);
    setSelectedFile(null);
    setErrors({});
  }, [open, existingCard, nome, cidade, estado, telefone]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  function setField(field: keyof FormValues, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function onPickAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!AVATAR_TYPES.includes(file.type)) {
      toast.error("Escolha uma imagem JPG, PNG, WEBP ou GIF.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("A imagem deve ter no máximo 2 MB.");
      return;
    }

    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    const url = URL.createObjectURL(file);
    objectUrlRef.current = url;
    setSelectedFile(file);
    setPreview(url);
  }

  function removeAvatar() {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = null;
    setSelectedFile(null);
    setAvatarUrl(null);
    setPreview(null);
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = cardSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }

    setErrors({});
    setSaving(true);
    try {
      const finalAvatarUrl = selectedFile
        ? await uploadCardAvatar(member.userId, selectedFile)
        : avatarUrl;

      await saveServiceCard(member.userId, { ...parsed.data, avatar_url: finalAvatarUrl });
      toast.success(existingCard ? "Card atualizado." : "Seu card foi publicado!");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: marketplaceCardsKey }),
        queryClient.invalidateQueries({ queryKey: adminServiceCardsKey }),
      ]);
      onOpenChange(false);
    } catch {
      toast.error("Não foi possível salvar seu card. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existingCard ? "Editar meu card" : "Criar meu card"}</DialogTitle>
          <DialogDescription>
            Apresente seu serviço ou produto para as demais membros da comunidade Startex.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate className="mt-2 space-y-4">
          <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-muted/20 p-4">
            <Avatar className="size-20 border-2 border-primary/20">
              {preview ? <AvatarImage src={preview} alt="Prévia do avatar" /> : null}
              <AvatarFallback>{initials(form.nome)}</AvatarFallback>
            </Avatar>
            <div className="min-w-45 flex-1">
              <p className="text-sm font-semibold">Foto do card</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Envie uma foto do celular (galeria ou câmera) ou do computador. JPG, PNG, WEBP ou
                GIF, até 2 MB.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlus className="size-4" /> Galeria ou arquivo
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <Camera className="size-4" /> Tirar foto
                </Button>
                {preview && (
                  <Button type="button" size="sm" variant="ghost" onClick={removeAvatar}>
                    <Trash2 className="size-4" /> Remover
                  </Button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                aria-label="Escolher foto do dispositivo"
                onChange={onPickAvatar}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                capture="environment"
                className="hidden"
                aria-label="Tirar foto com a câmera"
                onChange={onPickAvatar}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="card-nome">Nome</Label>
              <Input
                id="card-nome"
                value={form.nome}
                onChange={(event) => setField("nome", event.target.value)}
                autoComplete="name"
              />
              <FieldError message={errors["nome"]} />
            </div>
            <div>
              <Label htmlFor="card-servico">Serviço ou empresa</Label>
              <Input
                id="card-servico"
                value={form.servico}
                onChange={(event) => setField("servico", event.target.value)}
                placeholder="Ex.: Consultoria de marketing"
              />
              <FieldError message={errors["servico"]} />
            </div>
            <div>
              <Label htmlFor="card-cidade">Cidade</Label>
              <Input
                id="card-cidade"
                value={form.cidade}
                onChange={(event) => setField("cidade", event.target.value)}
                autoComplete="address-level2"
              />
              <FieldError message={errors["cidade"]} />
            </div>
            <div>
              <Label htmlFor="card-estado">Estado (UF)</Label>
              <Input
                id="card-estado"
                value={form.estado}
                onChange={(event) => setField("estado", event.target.value.toUpperCase())}
                maxLength={2}
                placeholder="SP"
              />
              <FieldError message={errors["estado"]} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="card-contato">Número de contato</Label>
              <Input
                id="card-contato"
                value={form.contato}
                onChange={(event) => setField("contato", maskPhoneBR(event.target.value))}
                inputMode="tel"
                autoComplete="tel"
                placeholder="(11) 99999-0000"
              />
              <FieldError message={errors["contato"]} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="card-descricao">Descrição do trabalho ou produto</Label>
              <Textarea
                id="card-descricao"
                value={form.descricao}
                onChange={(event) => setField("descricao", event.target.value)}
                rows={4}
                maxLength={600}
                placeholder="Conte o que você faz e como pode ajudar outras empreendedoras."
              />
              <FieldError message={errors["descricao"]} />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="hero" disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
              {existingCard ? "Salvar alterações" : "Publicar meu card"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
