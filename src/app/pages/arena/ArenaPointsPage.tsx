/**
 * ══════════════════════════════════════════════════════════
 *  ArenaPointsPage — Redirect to Unified Rewards Hub
 * ══════════════════════════════════════════════════════════
 *  Arena Points has been merged into the unified Rewards Hub.
 *  This page redirects to /rewards?tab=arena to preserve
 *  all existing navigation links across the app.
 *
 *  Sub-pages (Ledger, EntryDetail) remain at /arena/points/*
 */

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useRoutePrefix } from '../../hooks/useRoutePrefix';

export function ArenaPointsPage() {
  const navigate = useNavigate();
  const prefix = useRoutePrefix();

  useEffect(() => {
    navigate(`${prefix}/rewards?tab=arena`, { replace: true });
  }, [navigate, prefix]);

  return null;
}
