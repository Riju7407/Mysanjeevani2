'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';

type CategoryTreeNode = {
  _id: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  children: CategoryTreeNode[];
};

export default function AdminCategoriesPage() {
  const [tree, setTree] = useState<CategoryTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [newRootName, setNewRootName] = useState('');

  const fetchTree = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (data?.success) {
        setTree(data.tree || []);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  const createNode = async (name: string, parentId: string | null) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setBusyId(parentId || 'root');
    try {
      await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed, parentId }),
      });
      await fetchTree();
    } finally {
      setBusyId(null);
    }
  };

  const renameNode = async (node: CategoryTreeNode) => {
    const name = prompt('Update category name', node.name)?.trim();
    if (!name || name === node.name) return;
    setBusyId(node._id);
    try {
      await fetch(`/api/categories/${node._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      await fetchTree();
    } finally {
      setBusyId(null);
    }
  };

  const deleteNode = async (node: CategoryTreeNode) => {
    const confirmed = confirm(`Delete "${node.name}" and all nested subcategories?`);
    if (!confirmed) return;
    setBusyId(node._id);
    try {
      await fetch(`/api/categories/${node._id}`, { method: 'DELETE' });
      await fetchTree();
    } finally {
      setBusyId(null);
    }
  };

  const NodeView = ({ node, depth }: { node: CategoryTreeNode; depth: number }) => {
    const [newChildName, setNewChildName] = useState('');

    return (
      <div className="mt-3">
        <div
          className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"
          style={{ marginLeft: `${depth * 18}px` }}
        >
          <span className="text-sm font-semibold text-slate-800">{node.name}</span>
          <span className="text-xs text-slate-500">({node.children.length} child)</span>
          <button
            onClick={() => renameNode(node)}
            disabled={busyId === node._id}
            className="ml-auto rounded-md border border-blue-200 px-2 py-1 text-xs text-blue-700 hover:bg-blue-50 disabled:opacity-50"
          >
            Rename
          </button>
          <button
            onClick={() => deleteNode(node)}
            disabled={busyId === node._id}
            className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            Delete
          </button>
        </div>

        <div className="mt-2 flex gap-2" style={{ marginLeft: `${depth * 18 + 18}px` }}>
          <input
            value={newChildName}
            onChange={(e) => setNewChildName(e.target.value)}
            placeholder="Add child category"
            className="w-full max-w-md rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={async () => {
              await createNode(newChildName, node._id);
              setNewChildName('');
            }}
            disabled={busyId === node._id || !newChildName.trim()}
            className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Add
          </button>
        </div>

        {node.children.map((child) => (
          <NodeView key={child._id} node={child} depth={depth + 1} />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <Link href="/admin" className="text-sm font-medium text-blue-700 hover:text-blue-900">
              ← Back to Dashboard
            </Link>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">Category Layer Management</h1>
            <p className="text-sm text-slate-600">
              Manage category, subcategory, nested subcategory, and deeper levels. Forms update dynamically from this tree.
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">Add Root Category</h2>
          <div className="flex flex-wrap gap-2">
            <input
              value={newRootName}
              onChange={(e) => setNewRootName(e.target.value)}
              placeholder="Example: Product Types or Disease Categories"
              className="w-full max-w-xl rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={async () => {
                await createNode(newRootName, null);
                setNewRootName('');
              }}
              disabled={busyId === 'root' || !newRootName.trim()}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Add Root
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-100 p-4">
          {loading ? (
            <div className="py-10 text-center text-slate-500">Loading category tree...</div>
          ) : tree.length === 0 ? (
            <div className="py-10 text-center text-slate-500">No categories found. Create your first root category.</div>
          ) : (
            tree.map((node) => <NodeView key={node._id} node={node} depth={0} />)
          )}
        </div>
      </div>
    </div>
  );
}
