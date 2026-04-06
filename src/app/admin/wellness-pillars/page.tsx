'use client';

import { useCallback, useEffect, useState } from 'react';
import { useImageUpload } from '@/lib/hooks/useImageUpload';

interface WellnessPillar {
  _id: string;
  title: string;
  desc: string;
  benefits: string;
  imageUrl?: string;
  cloudinaryPublicId?: string;
  icon?: string;
  rating: number;
  reviews: number;
  price: number;
  mrp?: number;
  isActive: boolean;
  createdAt?: string;
}

const EMPTY_FORM = {
  title: '',
  desc: '',
  benefits: '',
  rating: '4.5',
  reviews: '0',
  price: '',
  mrp: '',
  isActive: true,
};

export default function WellnessPillarsAdminPage() {
  const { uploadImage, uploading: imageUploading, error: uploadError, previewUrl } = useImageUpload();
  const [items, setItems] = useState<WellnessPillar[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<WellnessPillar | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageUrl, setImageUrl] = useState('');
  const [imagePublicId, setImagePublicId] = useState('');
  const [error, setError] = useState('');

  const getAdminHeaders = () => {
    const token = localStorage.getItem('adminToken') || '';
    const expiresAt = localStorage.getItem('tokenExpiresAt') || '';
    const adminEmail = localStorage.getItem('adminEmail') || '';
    return {
      Authorization: `Bearer ${token}`,
      'x-token-expires-at': expiresAt,
      'x-admin-email': adminEmail,
    };
  };

  const fetchPillars = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/wellness-pillars', {
        headers: getAdminHeaders(),
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load wellness pillars');
      setItems(data.data || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load wellness pillars');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPillars();
  }, [fetchPillars]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setImageUrl('');
    setImagePublicId('');
    setShowForm(true);
    setError('');
  };

  const openEdit = (item: WellnessPillar) => {
    setEditing(item);
    setForm({
      title: item.title,
      desc: item.desc,
      benefits: item.benefits,
      rating: String(item.rating ?? 4.5),
      reviews: String(item.reviews ?? 0),
      price: String(item.price ?? ''),
      mrp: item.mrp !== undefined ? String(item.mrp) : '',
      isActive: item.isActive,
    });
    setImageUrl(item.imageUrl || '');
    setImagePublicId(item.cloudinaryPublicId || '');
    setShowForm(true);
    setError('');
  };

  const save = async () => {
    if (!form.title || !form.desc || !form.benefits || !form.price) {
      setError('Title, description, benefits and price are required');
      return;
    }

    if (!imageUrl) {
      setError('Image is required. Please upload a wellness pillar image.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = {
        title: form.title,
        desc: form.desc,
        benefits: form.benefits,
        imageUrl,
        cloudinaryPublicId: imagePublicId || undefined,
        icon: editing?.icon || '💚',
        rating: Number(form.rating || 0),
        reviews: Number(form.reviews || 0),
        price: Number(form.price),
        mrp: form.mrp ? Number(form.mrp) : undefined,
        isActive: form.isActive,
      };

      const endpoint = editing
        ? `/api/admin/wellness-pillars/${editing._id}`
        : '/api/admin/wellness-pillars';
      const method = editing ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...getAdminHeaders(),
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to save wellness pillar');

      setShowForm(false);
      setEditing(null);
      setForm(EMPTY_FORM);
      setImageUrl('');
      setImagePublicId('');
      await fetchPillars();
    } catch (e: any) {
      setError(e.message || 'Failed to save wellness pillar');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this wellness pillar?')) return;
    setError('');
    try {
      const res = await fetch(`/api/admin/wellness-pillars/${id}`, {
        method: 'DELETE',
        headers: getAdminHeaders(),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete wellness pillar');
      setItems((prev) => prev.filter((x) => x._id !== id));
    } catch (e: any) {
      setError(e.message || 'Failed to delete wellness pillar');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Wellness Pillars</h1>
            <p className="text-slate-600 mt-1">Manage wellness pillar products shown on the Wellness page.</p>
          </div>
          <button
            onClick={openCreate}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold"
          >
            + Add Wellness Pillar
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
            {error}
          </div>
        )}

        {showForm && (
          <div className="mb-6 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              {editing ? 'Update Wellness Pillar' : 'Add Wellness Pillar'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                className="border border-slate-300 rounded-lg px-4 py-2"
                placeholder="Title *"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <div className="flex items-center gap-3 rounded-lg border border-slate-300 px-4 py-2">
                <label className="text-sm font-medium text-slate-700">Active</label>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="h-4 w-4"
                />
              </div>

              <div className="md:col-span-3 border border-slate-200 rounded-lg p-4 bg-slate-50">
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Wellness Pillar Image *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  disabled={imageUploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setError('');
                    const result = await uploadImage(file);
                    if (result?.success && result.imageUrl) {
                      setImageUrl(result.imageUrl);
                      setImagePublicId(result.publicId || '');
                    }
                  }}
                  className="block w-full text-sm text-slate-700 file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:bg-emerald-100 file:text-emerald-700 file:font-semibold hover:file:bg-emerald-200"
                />
                {imageUploading && <p className="text-xs text-blue-600 mt-2">Uploading image...</p>}
                {uploadError && <p className="text-xs text-red-600 mt-2">{uploadError}</p>}
                {(imageUrl || previewUrl) && (
                  <div className="mt-3">
                    <img
                      src={previewUrl || imageUrl}
                      alt="Wellness preview"
                      className="h-24 w-24 object-cover rounded-lg border border-slate-300"
                    />
                  </div>
                )}
              </div>

              <input
                className="border border-slate-300 rounded-lg px-4 py-2"
                placeholder="Price *"
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
              <input
                className="border border-slate-300 rounded-lg px-4 py-2"
                placeholder="MRP"
                type="number"
                value={form.mrp}
                onChange={(e) => setForm({ ...form, mrp: e.target.value })}
              />
              <input
                className="border border-slate-300 rounded-lg px-4 py-2"
                placeholder="Rating (0-5)"
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: e.target.value })}
              />
              <input
                className="border border-slate-300 rounded-lg px-4 py-2"
                placeholder="Reviews"
                type="number"
                min="0"
                value={form.reviews}
                onChange={(e) => setForm({ ...form, reviews: e.target.value })}
              />
              <textarea
                className="border border-slate-300 rounded-lg px-4 py-2 md:col-span-3"
                rows={2}
                placeholder="Description *"
                value={form.desc}
                onChange={(e) => setForm({ ...form, desc: e.target.value })}
              />
              <textarea
                className="border border-slate-300 rounded-lg px-4 py-2 md:col-span-3"
                rows={2}
                placeholder="Benefits *"
                value={form.benefits}
                onChange={(e) => setForm({ ...form, benefits: e.target.value })}
              />
            </div>
            <div className="mt-4 flex gap-3">
              <button
                onClick={save}
                disabled={saving}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white rounded-lg font-semibold"
              >
                {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                  setForm(EMPTY_FORM);
                  setImageUrl('');
                  setImagePublicId('');
                }}
                className="px-6 py-2.5 border border-slate-300 text-slate-700 rounded-lg font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-500">Loading wellness pillars...</div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No wellness pillars found. Add your first one.</div>
          ) : (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {['Icon', 'Title', 'Price', 'Rating', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.title} className="h-12 w-12 rounded-lg object-cover border border-slate-200" />
                      ) : (
                        <span className="text-2xl">{item.icon || '💚'}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{item.title}</div>
                      <div className="text-xs text-slate-500 line-clamp-1">{item.benefits}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="font-semibold text-emerald-700">₹{item.price}</div>
                      {item.mrp && item.mrp > item.price && (
                        <div className="text-xs text-slate-400 line-through">₹{item.mrp}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">{Number(item.rating || 0).toFixed(1)} ({item.reviews || 0})</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-3">
                        <button onClick={() => openEdit(item)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Edit</button>
                        <button onClick={() => remove(item._id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
