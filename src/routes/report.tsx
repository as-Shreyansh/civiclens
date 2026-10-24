import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { CheckCircle2, Crosshair, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PublicShell } from "@/components/civic/Shells";
import { MapView } from "@/components/civic/MapView";
import { CATEGORIES, type Category, type Defect } from "@/lib/types";
import { submitReport, validateReport } from "@/lib/store";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "Report a road issue — CIVICLENS" },
      { name: "description", content: "Report a pothole, crack, waterlogging or uneven surface. No account needed." },
      { property: "og:title", content: "Report a road issue — CIVICLENS" },
      { property: "og:description", content: "Submit a road hazard report and get a tracking ID." },
    ],
  }),
  component: ReportPage,
});

const MAX_PHOTO = 1.5 * 1024 * 1024;

function ReportPage() {
  const [f, setF] = useState({ road: "", location: "", lat: "", lng: "", category: "" as Category | "", severity: 3, description: "" });
  const [photo, setPhoto] = useState<string>();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");
  const [done, setDone] = useState<Defect | null>(null);
  const set = (k: keyof typeof f, v: string | number) => setF((s) => ({ ...s, [k]: v }));

  const onPhoto = (file?: File) => {
    setErrors((e) => ({ ...e, photo: "" }));
    if (!file) return setPhoto(undefined);
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return setErrors((e) => ({ ...e, photo: "Use a JPG, PNG or WEBP image." }));
    if (file.size > MAX_PHOTO) return setErrors((e) => ({ ...e, photo: "Image must be under 1.5 MB." }));
    const r = new FileReader();
    r.onload = () => setPhoto(String(r.result));
    r.readAsDataURL(file);
  };

  const locate = () => navigator.geolocation?.getCurrentPosition(
    (p) => { set("lat", p.coords.latitude.toFixed(5)); set("lng", p.coords.longitude.toFixed(5)); },
    () => setErrors((e) => ({ ...e, lat: "Couldn't read your location; pick on the map instead." })),
  );

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const payload = { ...f, lat: f.lat === "" ? NaN : Number(f.lat), lng: f.lng === "" ? NaN : Number(f.lng), category: f.category as Category, photo };
    const errs = validateReport(payload);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setState("busy");
    try {
      await new Promise((r) => setTimeout(r, 400));
      setDone(submitReport(payload));
      setState("idle");
    } catch (err) {
      setState("error");
      setErrors({ form: err instanceof Error ? err.message : "Submission failed. Please try again." });
    }
  };

  if (done) return (
    <PublicShell>
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <CheckCircle2 className="mx-auto size-12 text-success" />
        <h1 className="mt-4 text-3xl font-bold">Report received</h1>
        <p className="mt-2 text-muted-foreground">Save this ID to track progress.</p>
        <div className="panel mt-6 p-6 font-mono text-3xl font-bold tracking-widest">{done.id}</div>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild><Link to="/track" search={{ id: done.id }}>Track this report</Link></Button>
          <Button variant="outline" onClick={() => { setDone(null); setF({ road: "", location: "", lat: "", lng: "", category: "", severity: 3, description: "" }); setPhoto(undefined); }}>Report another</Button>
        </div>
      </div>
    </PublicShell>
  );

  const err = (k: string) => errors[k] && <p id={`${k}-err`} className="mt-1 text-xs text-destructive">{errors[k]}</p>;
  const pick: [number, number] | null = f.lat && f.lng && Number.isFinite(+f.lat) && Number.isFinite(+f.lng) ? [+f.lat, +f.lng] : null;

  return (
    <PublicShell>
      <div className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="text-3xl font-bold">Report a road issue</h1>
        <p className="mt-1 text-muted-foreground">No account needed. Fields marked * are required.</p>
        <form onSubmit={submit} noValidate className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="panel space-y-4 p-5">
            <div><Label htmlFor="road">Road name *</Label><Input id="road" value={f.road} onChange={(e) => set("road", e.target.value)} aria-invalid={!!errors.road} aria-describedby="road-err" placeholder="e.g. Tonk Road" />{err("road")}</div>
            <div><Label htmlFor="location">Location / landmark *</Label><Input id="location" value={f.location} onChange={(e) => set("location", e.target.value)} aria-invalid={!!errors.location} placeholder="Near Durgapura flyover" />{err("location")}</div>
            <div>
              <Label htmlFor="category">Defect category *</Label>
              <select id="category" value={f.category} onChange={(e) => set("category", e.target.value)} className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm" aria-invalid={!!errors.category}>
                <option value="">Choose…</option>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>{err("category")}
            </div>
            <fieldset>
              <legend className="text-sm font-medium">Observed severity *</legend>
              <div className="mt-2 grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <label key={n} className={`cursor-pointer rounded-md border py-2 text-center text-sm font-semibold focus-within:ring-2 focus-within:ring-ring ${f.severity === n ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                    <input type="radio" name="severity" value={n} checked={f.severity === n} onChange={() => set("severity", n)} className="sr-only" />{n}
                  </label>
                ))}
              </div>
              <div className="mt-1 flex justify-between text-xs text-muted-foreground"><span>Minor</span><span>Dangerous</span></div>
            </fieldset>
            <div><Label htmlFor="description">Description *</Label><Textarea id="description" rows={4} value={f.description} onChange={(e) => set("description", e.target.value)} aria-invalid={!!errors.description} placeholder="What did you see? How big is it?" />{err("description")}</div>
            <div>
              <Label htmlFor="photo">Photo (optional, max 1.5 MB)</Label>
              <label htmlFor="photo" className="mt-1 flex cursor-pointer items-center gap-2 rounded-md border border-dashed p-3 text-sm text-muted-foreground hover:bg-muted"><Upload className="size-4" />{photo ? "Photo attached — change" : "Choose image"}</label>
              <input id="photo" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(e) => onPhoto(e.target.files?.[0])} />
              {photo && <img src={photo} alt="Preview of attached photo" className="mt-2 h-28 rounded-md object-cover" />}
              {err("photo")}
            </div>
          </div>
          <div className="space-y-4">
            <div className="panel space-y-3 p-5">
              <div className="flex items-center justify-between"><span className="text-sm font-medium">Location on map *</span><Button type="button" variant="outline" size="sm" onClick={locate}><Crosshair className="size-4" /> Use my location</Button></div>
              <p className="text-xs text-muted-foreground">Click the map to drop a pin, or type coordinates.</p>
              <MapView points={[]} pick={pick} onPick={(la, ln) => { set("lat", String(la)); set("lng", String(ln)); }} height={300} center={pick ?? undefined} zoom={pick ? 15 : 12} />
              <div className="grid grid-cols-2 gap-3">
                <div><Label htmlFor="lat">Latitude</Label><Input id="lat" inputMode="decimal" value={f.lat} onChange={(e) => set("lat", e.target.value)} aria-invalid={!!errors.lat} />{err("lat")}</div>
                <div><Label htmlFor="lng">Longitude</Label><Input id="lng" inputMode="decimal" value={f.lng} onChange={(e) => set("lng", e.target.value)} aria-invalid={!!errors.lng} />{err("lng")}</div>
              </div>
            </div>
            {errors.form && <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{errors.form}</p>}
            {Object.keys(errors).filter((k) => errors[k]).length > 0 && !errors.form && <p role="alert" className="text-sm text-destructive">Please fix the highlighted fields.</p>}
            <Button type="submit" size="lg" className="w-full" disabled={state === "busy"}>{state === "busy" ? <><Loader2 className="size-4 animate-spin" /> Submitting…</> : "Submit report"}</Button>
          </div>
        </form>
      </div>
    </PublicShell>
  );
}
