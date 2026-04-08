import { useEffect, useState, type FormEvent } from "react";
import { loadUserNameSetting, saveUserNameSetting } from "../application/userSettings";

export function UserSettingsForm() {
  const [userName, setUserName] = useState("");
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

  return (
    <form className="settings-form" onSubmit={handleSubmit}>
      <fieldset className="settings-form__fields" disabled={busy}>
        <label>
          <span>使用者名字</span>
          <input
            value={userName}
            onChange={(event) => {
              setUserName(event.target.value);
              setSaveStatus("");
            }}
          />
        </label>
      </fieldset>

      <div className="settings-form__actions">
        <button type="submit" disabled={busy}>
          {busy ? "保存中..." : "保存用户设置"}
        </button>
      </div>
      {loadStatus ? <p className="settings-form__status">{loadStatus}</p> : null}
      {saveStatus ? <p className="settings-form__status">{saveStatus}</p> : null}
    </form>
  );
}
