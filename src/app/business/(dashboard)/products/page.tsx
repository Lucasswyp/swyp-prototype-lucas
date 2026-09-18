"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { useBusiness } from "@/contexts/BusinessContext";
import { useData } from "@/contexts/DataContext";
import { createProduct, updateProduct as updateProductRemote, deleteProduct as deleteProductRemote } from "@/lib/data";
import { formatEuro } from "@/lib/utils";
import type { Product, Category } from "@/types";

const categories: Category[] = ["Fashion", "Food", "Tech", "Fitness", "Travel", "Beauty", "Events", "Days Out", "Restaurants"];

const emptyForm = {
  name: "",
  description: "",
  imageUrl: "https://images.unsplash.com/photo-1611817757591-c3f345024273?w=800&q=80&auto=format&fit=crop",
  price: 0,
  oldPrice: undefined as number | undefined,
  category: "Fashion" as Category,
  url: "",
};

export default function ProductsPage() {
  const { businessId } = useBusiness();
  const { products, refresh } = useData();
  const ownProducts = useMemo(() => products.filter((p) => p.companyId === businessId), [products, businessId]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name,
      description: p.description,
      imageUrl: p.imageUrl,
      price: p.price,
      oldPrice: p.oldPrice,
      category: p.category,
      url: p.url,
    });
    setModalOpen(true);
  }

  async function save() {
    setSaving(true);
    try {
      if (editing) {
        await updateProductRemote({ ...editing, ...form });
      } else {
        await createProduct(businessId, { ...form, imageUrl: form.imageUrl });
      }
      refresh();
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  }

  async function remove(p: Product) {
    if (!confirm(`"${p.name}" verwijderen?`)) return;
    await deleteProductRemote(p.id);
    refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold mb-1">Products</h1>
          <p className="text-white/50 text-sm">Beheer je productcatalogus voor advertenties en rewards.</p>
        </div>
        <Button className="gap-1.5" onClick={openCreate}>
          <Plus size={16} /> Nieuw product
        </Button>
      </div>

      {ownProducts.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-white/50">Nog geen producten. Voeg je eerste echte product toe.</p>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ownProducts.map((p) => (
            <Card key={p.id} className="overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.imageUrl} alt={p.name} className="w-full aspect-[16/10] object-cover" />
              <div className="p-4">
                <div className="flex items-start justify-between mb-1">
                  <p className="font-semibold text-sm">{p.name}</p>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => openEdit(p)} className="rounded-lg p-1.5 hover:bg-white/10">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => remove(p)} className="rounded-lg p-1.5 hover:bg-white/10 text-red-300">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-white/40 mb-2">{p.category}</p>
                <div className="flex items-center gap-2">
                  <span className="font-heading font-bold text-sm">{formatEuro(p.price)}</span>
                  {p.oldPrice && <span className="text-xs text-white/40 line-through">{formatEuro(p.oldPrice)}</span>}
                </div>
                <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-xs text-magenta hover:underline mt-1 block truncate">
                  {p.url}
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Product bewerken" : "Nieuw product"}>
        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-medium mb-1.5 text-white/60">Naam</label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-violet"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-white/60">Omschrijving</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-violet"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1.5 text-white/60">Prijs (€)</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-violet"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5 text-white/60">Oude prijs (optioneel)</label>
              <input
                type="number"
                value={form.oldPrice ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, oldPrice: e.target.value ? Number(e.target.value) : undefined }))}
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-violet"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-white/60">Categorie</label>
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as Category }))}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-violet"
            >
              {categories.map((c) => (
                <option key={c} value={c} className="bg-slate">
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-white/60">Link naar jouw echte winkel</label>
            <input
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              placeholder="https://jouwwinkel.nl/product"
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-violet"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-white/60">Productfoto URL</label>
            <input
              value={form.imageUrl}
              onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm outline-none focus:border-violet"
            />
          </div>
          <Button fullWidth className="mt-2" disabled={!form.name || saving} onClick={save}>
            {saving ? "Bezig..." : editing ? "Wijzigingen opslaan" : "Product toevoegen"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
