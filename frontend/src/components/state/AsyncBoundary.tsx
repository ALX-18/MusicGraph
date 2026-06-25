import type { ReactNode } from 'react';
import type { AsyncState } from '../../lib/useAsync';
import { Loading } from './Loading';
import { ErrorState } from './ErrorState';
import { EmptyState } from './EmptyState';

interface Props<T> {
  state: AsyncState<T>;
  children: (data: T) => ReactNode;
  loadingLabel?: string;
  /** Considère le résultat comme "vide" (ex: tableau de longueur 0). */
  isEmpty?: (data: T) => boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyIcon?: string;
}

// Gère les 3 états (loading / erreur / vide) de façon uniforme.
// Jamais d'écran blanc : tout chemin rend quelque chose.
export function AsyncBoundary<T>({
  state,
  children,
  loadingLabel,
  isEmpty,
  emptyTitle,
  emptyMessage,
  emptyIcon,
}: Props<T>) {
  if (state.status === 'loading' || state.status === 'idle') {
    return <Loading label={loadingLabel} />;
  }
  if (state.status === 'error') {
    return <ErrorState message={state.error ?? 'Erreur inconnue'} onRetry={state.reload} />;
  }
  const data = state.data as T;
  if (isEmpty && isEmpty(data)) {
    return <EmptyState title={emptyTitle} message={emptyMessage} icon={emptyIcon} />;
  }
  return <>{children(data)}</>;
}
