
import { useEffect, useRef, useState } from "react";

import {
  Activity,
  ArrowRight,
  Camera,
  CheckCircle2,
  CircleAlert,
  FileSearch,
  Fingerprint,
  LayoutDashboard,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  UploadCloud,
  X
} from "lucide-react";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? "http://127.0.0.1:8000" : "");

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp"
];

const initialForm = {
  brand: "",
  model: "",
  condition: "Good",
  price: "",
  listing: ""
};

export default function App() {
  const [apiStatus, setApiStatus] = useState("checking");
  const [form, setForm] = useState(initialForm);
  const [images, setImages] = useState([]);
  const [notice, setNotice] = useState("");
  const imageUrls = useRef([]);

  async function checkApi() {
    if (!API_BASE) {
      setApiStatus("unconfigured");
      return;
    }

    setApiStatus("checking");

    try {
      const response = await fetch(
        `${API_BASE.replace(/\/$/, "")}/api/health`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "omit",
          cache: "no-store"
        }
      );

      if (!response.ok) {
        throw new Error("API unavailable");
      }

      const data = await response.json();

      if (data.status !== "healthy") {
        throw new Error("Unexpected health response");
      }

      setApiStatus("online");
    } catch {
      setApiStatus("offline");
    }
  }

  useEffect(() => {
    checkApi();

    return () => {
      imageUrls.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, []);

  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value
    }));
  }

  function handleImages(event) {
    const selected = Array.from(event.target.files || []);

    event.target.value = "";

    if (!selected.length) return;

    if (images.length + selected.length > MAX_IMAGES) {
      setNotice("Maximum 5 product photos are allowed.");
      return;
    }

    for (const file of selected) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setNotice("Use JPG, PNG or WebP images only.");
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setNotice("Each image must be 5 MB or smaller.");
        return;
      }
    }

    const newImages = selected.map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file)
    }));

    const combined = [...images, ...newImages];

    imageUrls.current = combined.map((item) => item.preview);

    setImages(combined);

    setNotice(
      "Images are previewed locally. They have not been uploaded."
    );
  }

  function removeImage(id) {
    const target = images.find((item) => item.id === id);

    if (!target) return;

    URL.revokeObjectURL(target.preview);

    const remaining = images.filter(
      (item) => item.id !== id
    );

    imageUrls.current = remaining.map(
      (item) => item.preview
    );

    setImages(remaining);
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!form.brand.trim() || !form.model.trim()) {
      setNotice("Enter the smartphone brand and model.");
      return;
    }

    if (
      form.price &&
      (!Number.isFinite(Number(form.price)) ||
        Number(form.price) <= 0)
    ) {
      setNotice("Enter a valid asking price.");
      return;
    }

    if (form.listing.length > 2000) {
      setNotice("Listing description is too long.");
      return;
    }

    setNotice(
      "Local validation passed. The investigation API is not implemented yet. Nothing has been uploaded or saved."
    );
  }

  const statusInfo = {
    checking: {
      label: "Checking API",
      color: "text-amber-300",
      dot: "bg-amber-400"
    },
    online: {
      label: "API connected",
      color: "text-emerald-300",
      dot: "bg-emerald-400"
    },
    offline: {
      label: "API unavailable",
      color: "text-rose-300",
      dot: "bg-rose-400"
    },
    unconfigured: {
      label: "API not configured",
      color: "text-slate-400",
      dot: "bg-slate-500"
    }
  };

  const status = statusInfo[apiStatus];

  return (
    <div className="min-h-screen text-slate-100">

      {/* Sidebar */}

      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-white/10 bg-[#0b1220] p-5 lg:flex">

        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600">
            <ShieldCheck size={25} />
          </div>

          <div>
            <h1 className="text-lg font-bold tracking-wide">
              TRUSTLENS
            </h1>
            <p className="text-[10px] tracking-[0.25em] text-blue-400">
              INTELLIGENCE
            </p>
          </div>
        </div>

        <p className="eyebrow mb-4">Workspace</p>

        <nav className="space-y-2">
          <a
            href="#overview"
            className="flex items-center gap-3 rounded-xl bg-blue-600/15 px-4 py-3 text-sm font-semibold text-blue-300"
          >
            <LayoutDashboard size={18} />
            Overview
          </a>

          <a
            href="#investigation"
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-400 hover:bg-white/5"
          >
            <FileSearch size={18} />
            New investigation
          </a>

          <div className="flex items-center justify-between rounded-xl px-4 py-3 text-sm text-slate-500">
            <span className="flex items-center gap-3">
              <Fingerprint size={18} />
              Reports
            </span>
            <span className="text-[10px]">SOON</span>
          </div>
        </nav>

        <div className="mt-auto rounded-2xl border border-blue-400/20 bg-blue-500/5 p-4">
          <LockKeyhole className="mb-3 text-blue-400" size={22} />
          <p className="text-sm font-semibold">
            Evidence first.
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            TrustLens reports investigation signals, not guaranteed authenticity.
          </p>
        </div>
      </aside>

      {/* Main content */}

      <main className="min-w-0 lg:ml-64">

        {/* Header */}

        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#080d18]/90 px-4 py-4 backdrop-blur-xl md:px-8">

          <div className="flex items-center gap-3 lg:hidden">
            <ShieldCheck className="text-blue-400" size={25} />
            <span className="font-bold">TRUSTLENS AI</span>
          </div>

          <div className="hidden text-sm text-slate-400 lg:block">
            Buyer intelligence / Dashboard
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className={`h-2 w-2 rounded-full ${status.dot}`} />
            <span className={status.color}>
              {status.label}
            </span>

            <button
              onClick={checkApi}
              aria-label="Refresh API connection"
              className="ml-2 rounded-lg border border-white/10 p-2 hover:bg-white/5"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </header>

        <div id="overview" className="mx-auto max-w-7xl space-y-7 p-4 md:p-8">

          {/* Page title */}

          <section>
            <p className="eyebrow mb-2">
              Smartphone buyer protection
            </p>

            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Investigation <span className="text-blue-400">Center.</span>
            </h2>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
              Investigate used smartphones before purchasing.
              Examine available evidence, listing details and potential risk signals.
            </p>
          </section>

          {/* Stats */}

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">

            <StatCard
              icon={<Activity />}
              label="Investigations"
              value="0"
              detail="No completed investigations"
            />

            <StatCard
              icon={<Smartphone />}
              label="Product category"
              value="Phones"
              detail="Initial supported category"
            />

            <StatCard
              icon={<ShieldCheck />}
              label="Verification engine"
              value="In development"
              detail="No authenticity verdicts yet"
            />

          </section>

          {/* Workspace */}

          <section
            id="investigation"
            className="grid items-start gap-5 xl:grid-cols-[1.4fr_0.8fr]"
          >

            {/* Investigation form */}

            <form
              onSubmit={handleSubmit}
              className="panel space-y-6 p-5 md:p-7"
            >

              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="eyebrow">01 / Product information</p>
                  <h3 className="mt-2 text-xl font-semibold">
                    Start investigation
                  </h3>
                </div>

                <div className="rounded-xl bg-blue-500/10 p-3 text-blue-400">
                  <Smartphone size={24} />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">

                <label className="space-y-2 text-sm">
                  <span className="text-slate-300">
                    Brand *
                  </span>
                  <input
                    className="field"
                    name="brand"
                    value={form.brand}
                    onChange={updateField}
                    placeholder="Apple, Samsung, OnePlus..."
                    maxLength={50}
                    required
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="text-slate-300">
                    Model *
                  </span>
                  <input
                    className="field"
                    name="model"
                    value={form.model}
                    onChange={updateField}
                    placeholder="iPhone 13, S24..."
                    maxLength={100}
                    required
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="text-slate-300">
                    Asking price (INR)
                  </span>
                  <input
                    className="field"
                    name="price"
                    type="number"
                    min="1"
                    max="10000000"
                    step="1"
                    value={form.price}
                    onChange={updateField}
                    placeholder="Example: 25000"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="text-slate-300">
                    Condition claimed
                  </span>
                  <select
                    className="field"
                    name="condition"
                    value={form.condition}
                    onChange={updateField}
                  >
                    <option>Like New</option>
                    <option>Good</option>
                    <option>Fair</option>
                    <option>Damaged</option>
                    <option>Unknown</option>
                  </select>
                </label>

              </div>

              {/* Images */}

              <div className="space-y-3">
                <div>
                  <p className="eyebrow">02 / Visual evidence</p>
                  <h4 className="mt-2 font-semibold">
                    Product photographs
                  </h4>
                  <p className="mt-1 text-xs text-slate-500">
                    Up to 5 JPG, PNG or WebP images. Maximum 5 MB each.
                  </p>
                </div>

                <label
                  htmlFor="product-images"
                  className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-blue-400/30 bg-blue-500/5 px-4 py-8 text-center hover:bg-blue-500/10"
                >
                  <UploadCloud
                    size={30}
                    className="mb-3 text-blue-400"
                  />

                  <span className="text-sm font-semibold">
                    Upload product photos
                  </span>

                  <span className="mt-2 text-xs text-slate-500">
                    Select images from your device
                  </span>

                  <input
                    id="product-images"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={handleImages}
                  />
                </label>

                {images.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {images.map((image) => (
                      <div
                        key={image.id}
                        className="relative overflow-hidden rounded-xl border border-white/10"
                      >
                        <img
                          src={image.preview}
                          alt="Local product preview"
                          className="h-28 w-full object-cover"
                        />

                        <button
                          type="button"
                          onClick={() => removeImage(image.id)}
                          aria-label="Remove image"
                          className="absolute right-2 top-2 rounded-full bg-black/80 p-1.5 text-white"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-xs text-amber-300">
                  Local preview only. Images are not uploaded or analyzed yet.
                </p>
              </div>

              {/* Listing description */}

              <div className="space-y-2">
                <p className="eyebrow">03 / Listing evidence</p>
                <label
                  htmlFor="listing"
                  className="text-sm text-slate-300"
                >
                  Seller description or listing details
                </label>

                <textarea
                  id="listing"
                  name="listing"
                  className="field min-h-32 resize-y"
                  value={form.listing}
                  onChange={updateField}
                  placeholder="Paste the seller's product description here..."
                  maxLength={2000}
                />

                <p className="text-right text-xs text-slate-500">
                  {form.listing.length}/2000
                </p>
              </div>

              {/* Validation action */}

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-blue-600 px-5 py-4 text-sm font-bold text-white hover:bg-blue-500"
              >
                Validate details
                <ArrowRight size={18} />
              </button>

              {notice && (
                <div
                  role="status"
                  aria-live="polite"
                  className="rounded-xl border border-blue-400/20 bg-blue-500/10 p-4 text-sm leading-6 text-blue-200"
                >
                  {notice}
                </div>
              )}

            </form>

            {/* Intelligence panel */}

            <div className="space-y-5">

              <div className="panel p-5">
                <p className="eyebrow">System connection</p>

                <div className="mt-4 flex items-center gap-3">
                  {apiStatus === "online" ? (
                    <CheckCircle2 className="text-emerald-400" size={25} />
                  ) : (
                    <CircleAlert className="text-amber-400" size={25} />
                  )}

                  <div>
                    <p className="font-semibold">
                      {status.label}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      FastAPI health endpoint
                    </p>
                  </div>
                </div>
              </div>

              <div className="panel space-y-5 p-5">
                <div>
                  <p className="eyebrow">Analysis pipeline</p>
                  <h3 className="mt-2 text-lg font-semibold">
                    Intelligence modules
                  </h3>
                </div>

                <Module
                  icon={<Camera />}
                  name="VisionCheck AI"
                  description="Visual comparison"
                />

                <Module
                  icon={<Fingerprint />}
                  name="SerialCheck"
                  description="Identifier validation"
                />

                <Module
                  icon={<Activity />}
                  name="PriceIntel"
                  description="Market price intelligence"
                />

                <Module
                  icon={<ShieldCheck />}
                  name="ScamShield"
                  description="Listing scam signals"
                />

                <Module
                  icon={<FileSearch />}
                  name="SellerTrust"
                  description="Evidence-based risk"
                />

                <div className="border-t border-white/10 pt-4">
                  <p className="text-xs leading-6 text-slate-400">
                    These modules are planned. No investigation,
                    external verification or TrustScore has been
                    performed by this interface.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5">
                <div className="flex items-center gap-2 text-amber-300">
                  <LockKeyhole size={18} />
                  <span className="text-sm font-semibold">
                    Buyer safety
                  </span>
                </div>

                <p className="mt-3 text-xs leading-6 text-slate-400">
                  Never share OTPs, passwords or sensitive
                  identity information with a seller.
                  Verify device ownership and purchase records
                  through authorized channels.
                </p>
              </div>

            </div>
          </section>

          <footer className="border-t border-white/10 py-6 text-center text-xs leading-6 text-slate-500">
            TRUSTLENS AI · Buy Smart. Verify Before You Trust.
            <br />
            Investigation assistance, not a guarantee of authenticity.
          </footer>

        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, detail }) {
  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">{label}</span>
        <span className="text-blue-400">{icon}</span>
      </div>

      <p className="mt-5 text-2xl font-bold">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-500">
        {detail}
      </p>
    </div>
  );
}

function Module({ icon, name, description }) {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{name}</p>
        <p className="mt-1 text-xs text-slate-500">
          {description}
        </p>
      </div>

      <span className="rounded-full bg-slate-700/50 px-2 py-1 text-[10px] text-slate-400">
        PLANNED
      </span>
    </div>
  );
}
