
export enum ReadingType {
  ELECTRICITY = 'Électricité',
  WATER = 'Eau'
}

export interface PhotoEntry {
  department: string;
  dataUrl: string;
  timestamp: number;
}

export interface Reading {
  id: string;
  date: string;
  type: ReadingType;
  photos: PhotoEntry[];
  createdAt: number;
}

export interface Department {
  id: string;
  name: string;
}
