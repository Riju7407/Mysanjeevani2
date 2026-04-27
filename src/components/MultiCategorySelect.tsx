'use client';

import { useState, useEffect, useRef } from 'react';

interface CategoryNode {
  _id: string;
  name: string;
  parentId: string | null;
  children: CategoryNode[];
}

interface MultiCategorySelectProps {
  selectedCategories: string[];
  onChange: (categories: string[]) => void;
  placeholder?: string;
  className?: string;
}

export default function MultiCategorySelect({
  selectedCategories,
  onChange,
  placeholder = "Select categories...",
  className = "",
}: MultiCategorySelectProps) {
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        const data = await response.json();
        if (data.success) {
          setCategories(data.tree || []);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const flattenCategories = (nodes: CategoryNode[], depth = 0): Array<{ id: string; name: string; depth: number; path: string[] }> => {
    const result: Array<{ id: string; name: string; depth: number; path: string[] }> = [];

    const flatten = (node: CategoryNode, currentDepth: number, path: string[]) => {
      const currentPath = [...path, node.name];
      result.push({
        id: node._id,
        name: node.name,
        depth: currentDepth,
        path: currentPath,
      });

      node.children.forEach(child => flatten(child, currentDepth + 1, currentPath));
    };

    nodes.forEach(node => flatten(node, depth, []));
    return result;
  };

  const allCategories = flattenCategories(categories);
  const filteredCategories = allCategories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.path.some(p => p.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const toggleCategory = (categoryId: string) => {
    const newSelected = selectedCategories.includes(categoryId)
      ? selectedCategories.filter(id => id !== categoryId)
      : [...selectedCategories, categoryId];
    onChange(newSelected);
  };

  const getCategoryName = (id: string) => {
    return allCategories.find(cat => cat.id === id)?.name || id;
  };

  const getCategoryPath = (id: string) => {
    const cat = allCategories.find(c => c.id === id);
    return cat ? cat.path.join(' > ') : '';
  };

  if (loading) {
    return (
      <div className={`relative ${className}`}>
        <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
          Loading categories...
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div
        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white cursor-pointer flex items-center justify-between"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-1 flex-1">
          {selectedCategories.length === 0 ? (
            <span className="text-gray-500">{placeholder}</span>
          ) : (
            selectedCategories.map(id => (
              <span
                key={id}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-100 text-blue-800"
              >
                {getCategoryName(id)}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCategory(id);
                  }}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))
          )}
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          <div className="p-2 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="py-1">
            {filteredCategories.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                No categories found
              </div>
            ) : (
              filteredCategories.map((cat) => (
                <div
                  key={cat.id}
                  className={`px-3 py-2 cursor-pointer hover:bg-gray-50 ${
                    selectedCategories.includes(cat.id) ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => toggleCategory(cat.id)}
                  style={{ paddingLeft: `${12 + cat.depth * 16}px` }}
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat.id)}
                      onChange={() => {}} // Handled by onClick
                      className="mr-2"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{cat.name}</div>
                      {cat.depth > 0 && (
                        <div className="text-xs text-gray-500">
                          {cat.path.slice(0, -1).join(' > ')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}