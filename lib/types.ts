export interface Folder {
  id: string;
  name: string;
  driveUrl: string;
  folderId: string;
  createdAt: Date;
  createdByUid: string;
}

export interface DriveImage {
  id: string;
  name: string;
  thumbnailLink: string;
  webViewLink: string;
  mimeType: string;
}

export interface SelectedFile {
  id: string;
  name: string;
  note?: string;
}

export interface Session {
  id: string;
  folderId: string;
  folderName: string;
  label: string;
  status: 'pending' | 'completed';
  selectedFiles: SelectedFile[];
  completedAt: Date | null;
  createdAt: Date;
  createdByUid: string;
}

export interface Submission {
  id: string;
  sessionId: string;
  submitterName: string;
  selectedFiles: SelectedFile[];
  createdAt: Date;
  updatedAt: Date | null;
}

export interface SessionWithFolder extends Session {
  folder: Folder | null;
}
