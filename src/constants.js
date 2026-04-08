import {
  BarChart3,
  FileBarChart2,
  FilePlus2,
  FileSearch,
} from "lucide-react";

export const MENUS = [
  { key: "dashboard", label: "대시보드", icon: BarChart3 },
  { key: "register", label: "카드 등록", icon: FilePlus2 },
  { key: "query", label: "카드 조회", icon: FileSearch },
  { key: "report", label: "리포트 생성", icon: FileBarChart2 },
];

export const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1bWb8TSkOtI9E6tSXQKEutU9lOXu4IvlRPOT3jYRUGPE/edit?usp=drive_link";

export const DRIVE_FOLDER_URL =
  "https://drive.google.com/drive/folders/1CGXuuPxTSlo4k9DY8qienmD89ilNGzUg?usp=drive_link";

export const BRIDGE_URL = import.meta.env.VITE_GOOGLE_BRIDGE_URL || "";
