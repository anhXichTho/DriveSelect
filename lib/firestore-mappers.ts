import type { Folder, Session, SelectedFile, Submission } from './types';
import type { DocumentSnapshot, Timestamp } from 'firebase-admin/firestore';

function toDate(v: unknown): Date {
  if (!v) return new Date(0);
  if (v instanceof Date) return v;
  if (typeof v === 'object' && v !== null && 'toDate' in v && typeof (v as Timestamp).toDate === 'function') {
    return (v as Timestamp).toDate();
  }
  return new Date(0);
}

function toDateOrNull(v: unknown): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v === 'object' && v !== null && 'toDate' in v && typeof (v as Timestamp).toDate === 'function') {
    return (v as Timestamp).toDate();
  }
  return null;
}

export function folderFromDoc(doc: DocumentSnapshot): Folder | null {
  const data = doc.data();
  if (!data) return null;
  return {
    id: doc.id,
    name: data.name ?? '',
    driveUrl: data.driveUrl ?? '',
    folderId: data.folderId ?? '',
    createdAt: toDate(data.createdAt),
  };
}

export function sessionFromDoc(doc: DocumentSnapshot): Session | null {
  const data = doc.data();
  if (!data) return null;
  const selected: SelectedFile[] = Array.isArray(data.selectedFiles)
    ? data.selectedFiles.map((f: unknown) => {
        const obj = (f as { id?: string; name?: string }) ?? {};
        return { id: obj.id ?? '', name: obj.name ?? '' };
      })
    : [];
  return {
    id: doc.id,
    folderId: data.folderId ?? '',
    folderName: data.folderName ?? '',
    label: data.label ?? '',
    status: data.status === 'completed' ? 'completed' : 'pending',
    selectedFiles: selected,
    completedAt: toDateOrNull(data.completedAt),
    createdAt: toDate(data.createdAt),
  };
}

export function serializeFolder(f: Folder) {
  return { ...f, createdAt: f.createdAt.toISOString() };
}

export function serializeSession(s: Session) {
  return {
    ...s,
    createdAt: s.createdAt.toISOString(),
    completedAt: s.completedAt ? s.completedAt.toISOString() : null,
  };
}

export function submissionFromDoc(doc: DocumentSnapshot): Submission | null {
  const data = doc.data();
  if (!data) return null;
  const selected: SelectedFile[] = Array.isArray(data.selectedFiles)
    ? data.selectedFiles.map((f: unknown) => {
        const obj = (f as { id?: string; name?: string }) ?? {};
        return { id: obj.id ?? '', name: obj.name ?? '' };
      })
    : [];
  return {
    id: doc.id,
    sessionId: data.sessionId ?? '',
    submitterName: data.submitterName ?? '',
    selectedFiles: selected,
    createdAt: toDate(data.createdAt),
  };
}

export function serializeSubmission(s: Submission) {
  return { ...s, createdAt: s.createdAt.toISOString() };
}
