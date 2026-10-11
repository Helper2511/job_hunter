"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { updateProfile } from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { profileSchema } from "@/lib/schemas";

const formSchema = profileSchema.omit({ savedSearchUrls: true }).extend({ savedSearchUrls: z.string() });
type FormValues = z.infer<typeof formSchema>;

export function ProfileForm({ initial }: { initial: Omit<FormValues, "savedSearchUrls"> & { savedSearchUrls: string[] } }) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { ...initial, savedSearchUrls: initial.savedSearchUrls.join("\n") },
  });
  const { errors, isSubmitting } = form.formState;

  async function onSubmit(values: FormValues) {
    const urls = values.savedSearchUrls.split(/\s+/).map((u) => u.trim()).filter(Boolean);
    const bad = urls.find((u) => !/^https?:\/\//.test(u));
    if (bad) {
      form.setError("savedSearchUrls", { message: `“${bad}” is not a full web address.` });
      return;
    }
    await updateProfile({ ...values, savedSearchUrls: urls });
    toast.success("Profile saved");
  }

  const field = (name: keyof FormValues, label: string, opts: { placeholder?: string; type?: string; hint?: string } = {}) => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={`pf-${name}`}>{label}</Label>
      <Input id={`pf-${name}`} type={opts.type ?? "text"} placeholder={opts.placeholder} aria-invalid={Boolean(errors[name])} {...form.register(name)} />
      {errors[name] ? <p className="text-small text-danger">{errors[name]?.message}</p> : opts.hint ? <p className="text-small text-muted">{opts.hint}</p> : null}
    </div>
  );

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {field("name", "Full name")}
        {field("phone", "Phone", { type: "tel", placeholder: "e.g. +91 98765 43210" })}
        {field("noticePeriod", "Notice period", { placeholder: "e.g. 30 days" })}
        {field("linkedinUrl", "LinkedIn profile", { type: "url", placeholder: "https://www.linkedin.com/in/…" })}
        {field("naukriUrl", "Naukri profile", { type: "url", placeholder: "https://www.naukri.com/mnjuser/profile…" })}
        {field("glassdoorUrl", "Glassdoor profile", { type: "url", placeholder: "https://www.glassdoor.co.in/member/profile…" })}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pf-searches">Saved-search links on the platforms</Label>
        <Textarea id="pf-searches" rows={3} placeholder="One link per line" aria-invalid={Boolean(errors.savedSearchUrls)} {...form.register("savedSearchUrls")} />
        {errors.savedSearchUrls ? (
          <p className="text-small text-danger">{errors.savedSearchUrls.message}</p>
        ) : (
          <p className="text-small text-muted">Paste search pages you use on Naukri or Glassdoor to open them from here. No password is ever needed.</p>
        )}
      </div>
      <Button type="submit" variant="primary" disabled={isSubmitting} className="self-start">
        {isSubmitting ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
