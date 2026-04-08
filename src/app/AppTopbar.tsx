import { useEffect, useState, type FormEvent } from "react";
import { DEFAULT_USER_NAME, loadUserNameSetting, saveUserNameSetting } from "../features/settings/application/userSettings";

type AppTopbarProps = {
  title: string;
  subtitle: string;
  showUserNameEditor?: boolean;
};

function UserNameEditor() {
  const [userName, setUserName] = useState(DEFAULT_USER_NAME);
  const [loadStatus, setLoadStatus] = useState("");
  const [saveStatus, setSaveStatus] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;

    void loadUserNameSetting()
      .then((value) => {
        if (active) {
          setUserName(value);
        }
      })
      .catch(() => {
        if (active) {
          setLoadStatus("用户设置加载失败。");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setSaveStatus("正在保存用户设置...");

    try {
      const normalizedUserName = await saveUserNameSetting(userName, () => new Date().toISOString());
      setUserName(normalizedUserName);
      setSaveStatus("用户设置已保存。");
    } catch {
      setSaveStatus("用户设置保存失败。");
    } finally {
      setBusy(false);
    }
  };

  const avatarText = userName.trim().slice(0, 1) || DEFAULT_USER_NAME.slice(0, 1).toUpperCase();

  return (
    <form className="app-topbar__user-editor" onSubmit={handleSubmit}>
      <label className="app-topbar__user-field">
        <span>使用者名字</span>
        <input
          value={userName}
          disabled={busy}
          onChange={(event) => {
            setUserName(event.target.value);
            setSaveStatus("");
          }}
        />
      </label>
      <button type="submit" disabled={busy}>
        {busy ? "保存中..." : "保存用户设置"}
      </button>
      <span className="app-topbar__avatar" aria-hidden="true">
        {avatarText}
      </span>
      {loadStatus ? <p className="app-topbar__status">{loadStatus}</p> : null}
      {saveStatus ? <p className="app-topbar__status">{saveStatus}</p> : null}
    </form>
  );
}

export function AppTopbar({ title, subtitle, showUserNameEditor = false }: AppTopbarProps) {
  return (
    <header className="app-topbar">
      <div className="app-topbar__identity">
        <p className="app-topbar__eyebrow">Operations Room</p>
        <h1>{title}</h1>
        <p className="app-topbar__subtitle">{subtitle}</p>
      </div>

      <div className="app-topbar__meta">
        <span className="app-topbar__badge">本地工作台</span>
        {showUserNameEditor ? (
          <UserNameEditor />
        ) : (
          <span className="app-topbar__avatar" aria-hidden="true">
            本
          </span>
        )}
      </div>
    </header>
  );
}
