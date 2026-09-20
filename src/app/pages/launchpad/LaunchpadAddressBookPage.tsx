/**
 * ══════════════════════════════════════════════════════════════
 *  LaunchpadAddressBookPage — Multi-wallet Address Book (Phase 4.9)
 * ══════════════════════════════════════════════════════════════
 *  Pattern A — Standard Page with search + add
 *  Features: Multi-chain wallet management, add/edit/delete addresses,
 *            search/filter by chain, favorites, default wallet selection,
 *            copy address, usage stats, tag management, inline editing
 */

import React, { useState, useMemo, useCallback } from 'react';
import { PageLayout } from '../../components/layout/PageLayout';
import { PageContent, PageSection } from '../../components/layout/PageContent';
import { Header } from '../../components/layout/Header';
import { useThemeColors } from '../../hooks/useThemeColors';
import { TrCard } from '../../components/ui/TrCard';
import { CTAButton } from '../../components/ui/CTAButton';
import {
  Plus, Search, Star, Copy, Check, Trash2,
  X, ChevronDown,
  Shield, ShieldCheck, AlertTriangle, Info,
  Wallet,
} from 'lucide-react';
import {
  loadWalletAddresses, saveWalletAddresses, truncateAddress,
  BRIDGE_NETWORKS,
  type WalletAddress,
} from './launchpadData';

export function LaunchpadAddressBookPage() {
  const c = useThemeColors();

  const [addresses, setAddresses] = useState<WalletAddress[]>(() => loadWalletAddresses());
  const [searchQuery, setSearchQuery] = useState('');
  const [chainFilter, setChainFilter] = useState<string>('all');
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const chains = useMemo(() => {
    const s = new Set(addresses.map(a => a.chain));
    return ['all', ...Array.from(s)];
  }, [addresses]);

  const filtered = useMemo(() => {
    return addresses.filter(a => {
      if (chainFilter !== 'all' && a.chain !== chainFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return a.label.toLowerCase().includes(q)
          || a.address.toLowerCase().includes(q)
          || a.chain.toLowerCase().includes(q)
          || a.tags.some(t => t.toLowerCase().includes(q));
      }
      return true;
    }).sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return b.usageCount - a.usageCount;
    });
  }, [addresses, chainFilter, searchQuery]);

  const persist = useCallback((updated: WalletAddress[]) => {
    setAddresses(updated);
    saveWalletAddresses(updated);
  }, []);

  const toggleFavorite = (id: string) => {
    persist(addresses.map(a => a.id === id ? { ...a, isFavorite: !a.isFavorite } : a));
  };

  const setDefault = (id: string) => {
    persist(addresses.map(a => ({
      ...a,
      isDefault: a.id === id,
    })));
  };

  const deleteAddress = (id: string) => {
    persist(addresses.filter(a => a.id !== id));
    setShowDeleteConfirm(null);
    setExpandedId(null);
  };

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  const handleAddAddress = (addr: Omit<WalletAddress, 'id' | 'createdAt' | 'usageCount' | 'verified'>) => {
    const newAddr: WalletAddress = {
      ...addr,
      id: `w${Date.now()}`,
      createdAt: new Date().toLocaleDateString(),
      usageCount: 0,
      verified: false,
    };
    persist([...addresses, newAddr]);
    setShowAddSheet(false);
  };

  const favorites = filtered.filter(a => a.isFavorite);
  const others = filtered.filter(a => !a.isFavorite);

  return (
    <PageLayout>
      {/* Add sheet */}
      {showAddSheet && (
        <AddAddressSheet
          onAdd={handleAddAddress}
          onClose={() => setShowAddSheet(false)}
        />
      )}

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <DeleteConfirmSheet
          address={addresses.find(a => a.id === showDeleteConfirm)!}
          onDelete={() => deleteAddress(showDeleteConfirm)}
          onClose={() => setShowDeleteConfirm(null)}
        />
      )}

      <Header
        title="So dia chi"
        back
        action={{ icon: Plus, onClick: () => setShowAddSheet(true) }}
      />

      <PageContent gap="default">
        {/* Search */}
        <div className="relative">
          <Search size={16} color={c.text3} className="absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text" value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tim dia chi, nhan, chain..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl"
            style={{ background: c.surface2, color: c.text1, fontSize: 13, border: `1px solid ${c.border}` }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X size={14} color={c.text3} />
            </button>
          )}
        </div>

        {/* Chain filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {chains.map(ch => {
            const isActive = chainFilter === ch;
            const net = BRIDGE_NETWORKS.find(n => n.name === ch);
            const color = net?.color || '#6366F1';
            return (
              <button key={ch}
                onClick={() => setChainFilter(ch)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full whitespace-nowrap"
                style={{
                  background: isActive ? color + '15' : c.surface2,
                  border: `1px solid ${isActive ? color + '30' : 'transparent'}`,
                  color: isActive ? color : c.text3,
                  fontSize: 11, fontWeight: isActive ? 600 : 400,
                }}>
                {ch === 'all' ? 'Tat ca' : ch}
              </button>
            );
          })}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: c.surface2 }}>
            <Wallet size={12} color="#6366F1" />
            <span style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>{addresses.length}</span>
            <span style={{ color: c.text3, fontSize: 10 }}>dia chi</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: c.surface2 }}>
            <Star size={12} color="#F59E0B" />
            <span style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>{addresses.filter(a => a.isFavorite).length}</span>
            <span style={{ color: c.text3, fontSize: 10 }}>yeu thich</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: c.surface2 }}>
            <ShieldCheck size={12} color="#10B981" />
            <span style={{ color: c.text1, fontSize: 11, fontWeight: 600 }}>{addresses.filter(a => a.verified).length}</span>
            <span style={{ color: c.text3, fontSize: 10 }}>xac minh</span>
          </div>
        </div>

        {/* Favorites section */}
        {favorites.length > 0 && (
          <PageSection label="Yeu thich" accentColor="#F59E0B">
            <div className="flex flex-col gap-2">
              {favorites.map(addr => (
                <AddressCard
                  key={addr.id}
                  address={addr}
                  expanded={expandedId === addr.id}
                  onToggle={() => setExpandedId(expandedId === addr.id ? null : addr.id)}
                  onToggleFavorite={() => toggleFavorite(addr.id)}
                  onSetDefault={() => setDefault(addr.id)}
                  onDelete={() => setShowDeleteConfirm(addr.id)}
                  onCopy={handleCopy}
                  copiedField={copiedField}
                />
              ))}
            </div>
          </PageSection>
        )}

        {/* All addresses */}
        {others.length > 0 && (
          <PageSection label="Tat ca dia chi" accentColor="#3B82F6">
            <div className="flex flex-col gap-2">
              {others.map(addr => (
                <AddressCard
                  key={addr.id}
                  address={addr}
                  expanded={expandedId === addr.id}
                  onToggle={() => setExpandedId(expandedId === addr.id ? null : addr.id)}
                  onToggleFavorite={() => toggleFavorite(addr.id)}
                  onSetDefault={() => setDefault(addr.id)}
                  onDelete={() => setShowDeleteConfirm(addr.id)}
                  onCopy={handleCopy}
                  copiedField={copiedField}
                />
              ))}
            </div>
          </PageSection>
        )}

        {filtered.length === 0 && (
          <TrCard className="p-8 text-center">
            <Wallet size={32} color={c.text3} className="mx-auto mb-3 opacity-40" />
            <p style={{ color: c.text1, fontSize: 14, fontWeight: 600 }}>Khong tim thay dia chi</p>
            <p style={{ color: c.text3, fontSize: 11, marginTop: 4 }}>Thu thay doi bo loc hoac them dia chi moi</p>
          </TrCard>
        )}

        {/* Info banner */}
        <div className="rounded-xl p-3 flex items-start gap-2"
          style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.12)' }}>
          <Info size={13} color="#3B82F6" className="shrink-0 mt-0.5" />
          <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.5 }}>
            So dia chi duoc luu tren thiet bi. Luon kiem tra lai dia chi truoc khi thuc hien giao dich.
            Khong chia se dia chi voi nguoi la.
          </p>
        </div>

        <div className="h-[60px]" />
      </PageContent>
    </PageLayout>
  );
}

/* ═══════════════════════════════════════════════════════════
   AddressCard — wallet address card
   ═══════════════════════════════════════════════════════════ */

function AddressCard({ address, expanded, onToggle, onToggleFavorite, onSetDefault, onDelete, onCopy, copiedField }: {
  address: WalletAddress; expanded: boolean;
  onToggle: () => void; onToggleFavorite: () => void;
  onSetDefault: () => void; onDelete: () => void;
  onCopy: (text: string, field: string) => void;
  copiedField: string | null;
}) {
  const c = useThemeColors();

  return (
    <TrCard className="overflow-hidden"
      style={{ border: address.isDefault ? `1.5px solid ${address.chainColor}40` : undefined }}>
      <div className="w-full p-3.5 text-left cursor-pointer" onClick={onToggle}>
        <div className="flex items-start gap-3">
          {/* Chain icon */}
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: address.chainColor + '15', border: `1.5px solid ${address.chainColor}25` }}>
            <span style={{ color: address.chainColor, fontSize: 14, fontWeight: 800 }}>{address.chainIcon}</span>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <p style={{ color: c.text1, fontSize: 13, fontWeight: 700 }}>{address.label}</p>
              {address.isDefault && (
                <span className="px-1.5 py-px rounded-md"
                  style={{ background: 'rgba(99,102,241,0.1)', color: '#6366F1', fontSize: 8, fontWeight: 700 }}>
                  MAC DINH
                </span>
              )}
              {address.verified && (
                <ShieldCheck size={12} color="#10B981" />
              )}
            </div>
            <p style={{ color: c.text3, fontSize: 11, fontFamily: 'monospace' }}>
              {truncateAddress(address.address)}
            </p>

            {/* Tags */}
            <div className="flex items-center gap-1 mt-1.5">
              <span className="px-1.5 py-px rounded" style={{ background: address.chainColor + '12', color: address.chainColor, fontSize: 8, fontWeight: 600 }}>
                {address.chain}
              </span>
              {address.tags.slice(0, 2).map(tag => (
                <span key={tag} className="px-1.5 py-px rounded"
                  style={{ background: c.surface2, color: c.text3, fontSize: 8 }}>
                  {tag}
                </span>
              ))}
              {address.tags.length > 2 && (
                <span style={{ color: c.text3, fontSize: 8 }}>+{address.tags.length - 2}</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={e => { e.stopPropagation(); onToggleFavorite(); }} className="p-1">
              {address.isFavorite
                ? <Star size={16} color="#F59E0B" fill="#F59E0B" />
                : <Star size={16} color={c.text3} />}
            </button>
            <button onClick={e => { e.stopPropagation(); onCopy(address.address, address.id); }} className="p-1">
              {copiedField === address.id
                ? <Check size={14} color="#10B981" />
                : <Copy size={14} color={c.text3} />}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-3.5 pb-3.5" style={{ borderTop: `1px solid ${c.border}` }}>
          {/* Full address */}
          <div className="mt-3 mb-3 p-2.5 rounded-xl" style={{ background: c.surface2 }}>
            <p style={{ color: c.text3, fontSize: 9, marginBottom: 2 }}>Dia chi day du</p>
            <p style={{ color: c.text1, fontSize: 10, fontFamily: 'monospace', wordBreak: 'break-all', lineHeight: 1.5 }}>
              {address.address}
            </p>
          </div>

          {/* Stats */}
          <div className="flex flex-col gap-0 mb-3">
            {[
              { label: 'Chain', value: address.chain },
              ...(address.lastUsed ? [{ label: 'Lan dung gan nhat', value: address.lastUsed }] : []),
              { label: 'So lan su dung', value: `${address.usageCount} lan` },
              { label: 'Ngay them', value: address.createdAt },
              { label: 'Trạng thái', value: address.verified ? 'Đã xác minh' : 'Chưa xác minh' },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between py-1.5" style={{ borderBottom: `1px solid ${c.border}` }}>
                <span style={{ color: c.text3, fontSize: 11 }}>{row.label}</span>
                <span style={{ color: c.text1, fontSize: 11, fontWeight: 500 }}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Notes */}
          {address.notes && (
            <div className="rounded-xl p-2.5 mb-3" style={{ background: 'rgba(99,102,241,0.04)', border: '1px solid rgba(99,102,241,0.08)' }}>
              <p style={{ color: c.text3, fontSize: 9, marginBottom: 2 }}>Ghi chu</p>
              <p style={{ color: c.text2, fontSize: 11, lineHeight: 1.4 }}>{address.notes}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {!address.isDefault && (
              <button onClick={onSetDefault}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl"
                style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
                <Shield size={12} color="#6366F1" />
                <span style={{ color: '#6366F1', fontSize: 11, fontWeight: 600 }}>Dat lam mac dinh</span>
              </button>
            )}
            <button onClick={onDelete}
              className="flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <Trash2 size={12} color="#EF4444" />
              <span style={{ color: '#EF4444', fontSize: 11, fontWeight: 600 }}>Xoa</span>
            </button>
          </div>
        </div>
      )}
    </TrCard>
  );
}

/* ═══════════════════════════════════════════════════════════
   AddAddressSheet — add new wallet address
   ═══════════════════════════════════════════════════════════ */

function AddAddressSheet({ onAdd, onClose }: {
  onAdd: (addr: Omit<WalletAddress, 'id' | 'createdAt' | 'usageCount' | 'verified'>) => void;
  onClose: () => void;
}) {
  const c = useThemeColors();
  const [label, setLabel] = useState('');
  const [address, setAddress] = useState('');
  const [chain, setChain] = useState('Ethereum');
  const [notes, setNotes] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const selectedNet = BRIDGE_NETWORKS.find(n => n.name === chain) || BRIDGE_NETWORKS[0];
  const isValid = label.trim() && address.trim() && address.startsWith('0x') && address.length >= 42;

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (t: string) => setTags(tags.filter(tag => tag !== t));

  const handleSubmit = () => {
    if (!isValid) return;
    onAdd({
      label: label.trim(),
      address: address.trim(),
      chain,
      chainColor: selectedNet.color,
      chainIcon: selectedNet.icon,
      isDefault: false,
      isFavorite: false,
      notes: notes.trim() || undefined,
      tags,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}>
      <div className="w-full rounded-t-3xl"
        style={{ background: c.surface, maxWidth: 440, margin: '0 auto', maxHeight: '90vh', overflow: 'auto' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full" style={{ background: c.borderSolid }} />
        </div>
        <div className="px-5 pb-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 style={{ color: c.text1, fontSize: 18, fontWeight: 800 }}>Them dia chi moi</h3>
            <button onClick={onClose}><X size={20} color={c.text3} /></button>
          </div>

          {/* Label */}
          <div>
            <label style={{ color: c.text2, fontSize: 11, fontWeight: 500 }}>Nhan *</label>
            <input type="text" value={label} onChange={e => setLabel(e.target.value)}
              placeholder="VD: Vi chinh, Ledger..."
              className="w-full mt-1 px-3 py-2.5 rounded-xl"
              style={{ background: c.surface2, color: c.text1, fontSize: 13, border: `1px solid ${c.border}` }} />
          </div>

          {/* Address */}
          <div>
            <label style={{ color: c.text2, fontSize: 11, fontWeight: 500 }}>Dia chi vi *</label>
            <input type="text" value={address} onChange={e => setAddress(e.target.value)}
              placeholder="0x..."
              className="w-full mt-1 px-3 py-2.5 rounded-xl"
              style={{ background: c.surface2, color: c.text1, fontSize: 12, fontFamily: 'monospace', border: `1px solid ${c.border}` }} />
            {address && !address.startsWith('0x') && (
              <p style={{ color: '#EF4444', fontSize: 10, marginTop: 4 }}>Dia chi phai bat dau bang 0x</p>
            )}
          </div>

          {/* Chain selector */}
          <div>
            <label style={{ color: c.text2, fontSize: 11, fontWeight: 500 }}>Chain</label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {BRIDGE_NETWORKS.map(net => (
                <button key={net.id} onClick={() => setChain(net.name)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
                  style={{
                    background: chain === net.name ? net.color + '15' : c.surface2,
                    border: `1px solid ${chain === net.name ? net.color + '40' : 'transparent'}`,
                  }}>
                  <span style={{ color: net.color, fontSize: 10, fontWeight: 700 }}>{net.icon}</span>
                  <span style={{ color: chain === net.name ? net.color : c.text2, fontSize: 11, fontWeight: chain === net.name ? 600 : 400 }}>
                    {net.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label style={{ color: c.text2, fontSize: 11, fontWeight: 500 }}>Tags</label>
            <div className="flex items-center gap-2 mt-1">
              <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)}
                placeholder="Them tag..."
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                className="flex-1 px-3 py-2 rounded-xl"
                style={{ background: c.surface2, color: c.text1, fontSize: 12, border: `1px solid ${c.border}` }} />
              <button onClick={addTag}
                className="px-3 py-2 rounded-xl"
                style={{ background: 'rgba(99,102,241,0.1)' }}>
                <Plus size={14} color="#6366F1" />
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 px-2 py-1 rounded-lg"
                    style={{ background: c.surface2, color: c.text2, fontSize: 10 }}>
                    {tag}
                    <button onClick={() => removeTag(tag)}><X size={8} color={c.text3} /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label style={{ color: c.text2, fontSize: 11, fontWeight: 500 }}>Ghi chu</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Ghi chu tuy chon..."
              rows={2}
              className="w-full mt-1 px-3 py-2.5 rounded-xl resize-none"
              style={{ background: c.surface2, color: c.text1, fontSize: 12, border: `1px solid ${c.border}` }} />
          </div>

          {/* Warning */}
          <div className="rounded-xl p-2.5 flex items-start gap-2"
            style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.12)' }}>
            <AlertTriangle size={12} color="#F59E0B" className="shrink-0 mt-0.5" />
            <p style={{ color: c.text2, fontSize: 10, lineHeight: 1.5 }}>
              Luon kiem tra dia chi truoc khi them. Gui tien den sai dia chi co the khong khoi phuc duoc.
            </p>
          </div>

          <CTAButton onClick={handleSubmit} disabled={!isValid}>
            <Plus size={16} />
            Them dia chi
          </CTAButton>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   DeleteConfirmSheet — confirm address deletion
   ═══════════════════════════════════════════════════════════ */

function DeleteConfirmSheet({ address, onDelete, onClose }: {
  address: WalletAddress; onDelete: () => void; onClose: () => void;
}) {
  const c = useThemeColors();

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}>
      <div className="w-full rounded-t-3xl"
        style={{ background: c.surface, maxWidth: 440, margin: '0 auto' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full" style={{ background: c.borderSolid }} />
        </div>
        <div className="px-5 pb-6 flex flex-col gap-4">
          <div className="text-center py-2">
            <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
              style={{ background: 'rgba(239,68,68,0.1)' }}>
              <Trash2 size={24} color="#EF4444" />
            </div>
            <h3 style={{ color: c.text1, fontSize: 17, fontWeight: 800 }}>Xoa dia chi?</h3>
            <p style={{ color: c.text3, fontSize: 12, marginTop: 4 }}>
              Ban co chac muon xoa "{address.label}"?
            </p>
          </div>

          <div className="rounded-xl p-3" style={{ background: c.surface2 }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: address.chainColor + '15' }}>
                <span style={{ color: address.chainColor, fontSize: 10, fontWeight: 700 }}>{address.chainIcon}</span>
              </div>
              <div>
                <p style={{ color: c.text1, fontSize: 12, fontWeight: 600 }}>{address.label}</p>
                <p style={{ color: c.text3, fontSize: 10, fontFamily: 'monospace' }}>{truncateAddress(address.address)}</p>
              </div>
            </div>
          </div>

          <CTAButton variant="danger" onClick={onDelete}>
            <Trash2 size={16} />
            Xoa dia chi
          </CTAButton>
          <button onClick={onClose}
            className="w-full py-3 rounded-2xl"
            style={{ background: c.surface2, color: c.text2, fontSize: 14, fontWeight: 600 }}>
            Huy
          </button>
        </div>
      </div>
    </div>
  );
}