import { BrandMarkIcon, SettingsIcon } from "./icons";

export type AppMode = "ops" | "learning";

interface HeaderProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  onOpenSettings: () => void;
}

export function Header({ mode, onModeChange, onOpenSettings }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header__brand">
        <span className="app-header__mark">
          <BrandMarkIcon />
        </span>
        <div className="app-header__text">
          <div className="app-header__title">Jev Smart Desk</div>
          <div className="app-header__subtitle">고객 문의 자동 분류 및 맞춤 답변</div>
        </div>
      </div>
      <div className="app-header__actions">
        <div className="mode-toggle" role="tablist" aria-label="화면 모드 전환">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "ops"}
            className={`mode-toggle__btn ${mode === "ops" ? "is-active" : ""}`}
            onClick={() => onModeChange("ops")}
          >
            실무 모드
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "learning"}
            className={`mode-toggle__btn ${mode === "learning" ? "is-active" : ""}`}
            onClick={() => onModeChange("learning")}
          >
            Jev 학습 모드
          </button>
        </div>
        <button type="button" className="btn btn-ghost" onClick={onOpenSettings}>
          <SettingsIcon /> 설정
        </button>
      </div>
    </header>
  );
}
