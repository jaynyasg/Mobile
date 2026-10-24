import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, ReactNode, useContext, useEffect, useReducer, useState } from "react";
import { Action, initialState, PersonalState, reducer, sanitizeState, STORAGE_KEY } from "@/logic/state";

interface AppStore {
  state: PersonalState;
  dispatch: (action: Action) => void;
  hydrated: boolean;
}

const AppContext = createContext<AppStore | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (cancelled || !raw) return;
        try {
          dispatch({ type: "hydrate", state: sanitizeState(JSON.parse(raw)) });
        } catch {
          // Unreadable storage falls back to the sample profile.
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => undefined);
  }, [state, hydrated]);

  return <AppContext.Provider value={{ state, dispatch, hydrated }}>{children}</AppContext.Provider>;
}

export function useApp(): AppStore {
  const value = useContext(AppContext);
  if (!value) throw new Error("useApp must be used inside AppProvider");
  return value;
}
