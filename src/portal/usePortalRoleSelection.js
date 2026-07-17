import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "@clerk/clerk-react";
import { createMLSApi } from "./api";

export default function usePortalRoleSelection({ enabled = true } = {}) {
  const { session } = useSession();
  const api = useMemo(() => createMLSApi(session), [session]);
  const [state, setState] = useState({
    loading: false,
    checked: false,
    selectionRequired: false,
    role: null,
    locked: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!enabled || !session) {
      setState({
        loading: false,
        checked: false,
        selectionRequired: false,
        role: null,
        locked: false,
      });
      return null;
    }
    setState((current) => ({ ...current, loading: true }));
    setError("");
    try {
      const result = await api.role("status");
      setState({ loading: false, checked: true, ...result });
      return result;
    } catch (loadError) {
      const text = loadError instanceof Error ? loadError.message : String(loadError);
      setError(text);
      setState((current) => ({ ...current, loading: false, checked: true }));
      return null;
    }
  }, [api, enabled, session]);

  useEffect(() => {
    load();
  }, [load]);

  const selectRole = useCallback(async (role) => {
    setSaving(true);
    setError("");
    try {
      const result = await api.role("select", "POST", { role });
      setState({ loading: false, checked: true, ...result });
      return result;
    } catch (selectionError) {
      const text = selectionError instanceof Error ? selectionError.message : String(selectionError);
      setError(text);
      throw selectionError;
    } finally {
      setSaving(false);
    }
  }, [api]);

  return {
    ...state,
    loading: Boolean(enabled && (!state.checked || state.loading)),
    saving,
    error,
    load,
    selectRole,
  };
}
