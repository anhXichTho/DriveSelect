import type { Folder, Session, SelectedFile, Submission, Profile, ProfileImage } from './types';
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
    createdByUid: data.createdByUid ?? '',
  };
}

export function sessionFromDoc(doc: DocumentSnapshot): Session | null {
  const data = doc.data();
  if (!data) return null;
  const selected: SelectedFile[] = Array.isArray(data.selectedFiles)
    ? data.selectedFiles.map((f: unknown) => {
        const obj = (f as { id?: string; name?: string; note?: string }) ?? {};
        return { id: obj.id ?? '', name: obj.name ?? '', ...(obj.note ? { note: obj.note } : {}) };
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
    createdByUid: data.createdByUid ?? '',
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
        const obj = (f as { id?: string; name?: string; note?: string }) ?? {};
        return {
          id: obj.id ?? '',
          name: obj.name ?? '',
          ...(obj.note ? { note: obj.note } : {}),
        };
      })
    : [];
  return {
    id: doc.id,
    sessionId: data.sessionId ?? '',
    submitterName: data.submitterName ?? '',
    selectedFiles: selected,
    createdAt: toDate(data.createdAt),
    updatedAt: toDateOrNull(data.updatedAt),
  };
}

export function serializeSubmission(s: Submission) {
  return {
    ...s,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt ? s.updatedAt.toISOString() : null,
  };
}

export function profileFromDoc(doc: DocumentSnapshot): Profile | null {
  const data = doc.data();
  if (!data) return null;
  const images: ProfileImage[] = Array.isArray(data.images)
    ? data.images.map((img: unknown) => {
        const o = (img as Record<string, string>) ?? {};
        return {
          fileId: o.fileId ?? '',
          fileName: o.fileName ?? '',
          thumbnailLink: o.thumbnailLink ?? '',
          folderId: o.folderId ?? '',
          folderName: o.folderName ?? '',
        };
      })
    : [];
  return {
    uid: (data.uid as string) ?? doc.id,
    displayName: (data.displayName as string) ?? '',
    images,
    updatedAt: toDateOrNull(data.updatedAt),
  };
}

export function serializeProfile(p: Profile) {
  return { ...p, updatedAt: p.updatedAt ? p.updatedAt.toISOString() : null };
}
