"use client";
import React from "react";

export interface OrderIntegrationOptionsProps {
  saleEnabled: boolean;
  autoConfirm: boolean;
  posEnabled: boolean;
  posConfigName: string;
  notes: string;
  submitting: boolean;
  submitError: string | null;
  onChange: (
    changes: Partial<{
      saleEnabled: boolean;
      autoConfirm: boolean;
      posEnabled: boolean;
      posConfigName: string;
      notes: string;
    }>,
  ) => void;
}

export function OrderIntegrationOptions({
  saleEnabled,
  autoConfirm,
  posEnabled,
  posConfigName,
  notes,
  submitting,
  submitError,
  onChange,
}: OrderIntegrationOptionsProps) {
  return (
    <div className="rounded border p-4 space-y-3">
      <div className="font-medium">Odoo Integration Options</div>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={saleEnabled}
          onChange={(e) => onChange({ saleEnabled: e.target.checked })}
          disabled={submitting}
        />
        <span>Create Sale Order</span>
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={autoConfirm}
          onChange={(e) => onChange({ autoConfirm: e.target.checked })}
          disabled={!saleEnabled || submitting}
        />
        <span>Auto-confirm Sale</span>
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={posEnabled}
          onChange={(e) => onChange({ posEnabled: e.target.checked })}
          disabled={submitting}
        />
        <span>Send to POS (Kitchen)</span>
      </label>
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-700 w-40">POS Config Name</label>
        <input
          className="flex-1 border rounded px-2 py-1"
          value={posConfigName}
          onChange={(e) => onChange({ posConfigName: e.target.value })}
          placeholder="e.g. Main Bar"
          disabled={submitting || !posEnabled}
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-700 w-40">Notes</label>
        <input
          className="flex-1 border rounded px-2 py-1"
          value={notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          placeholder="Any instructions"
          disabled={submitting}
        />
      </div>
      {submitError && <div className="text-sm text-red-600">{submitError}</div>}
      <p className="text-xs text-gray-500">
        Best-effort sync. Local order always succeeds even if Odoo is
        unreachable.
      </p>
    </div>
  );
}
