import { useEffect, useState } from "react";
import type { StoryboardMenu, StoryboardPreset } from "../application/uiStoryboardScenario";

type UiStoryboardProps = {
  scenario: {
    presets: {
      employee: StoryboardPreset;
      finance: StoryboardPreset;
    };
  };
};

export function UiStoryboard({ scenario }: UiStoryboardProps) {
  const [role, setRole] = useState<"employee" | "finance">("employee");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const preset = scenario.presets[role];
  const secondaryMenus = preset.menus.filter((menu) => menu.kind === "secondary");

  useEffect(() => {
    setOpenMenuId(null);
  }, [role]);

  return (
    <section className="agent-lab__storyboard" aria-label="UI 样板工作区">
      <div className="agent-lab__workspace-shell">
        <div className="agent-lab__workspace-banner">
          <span>Mock Surface</span>
          <strong>这个页面只展示布局和层级，不连接真实行为。</strong>
        </div>

        <div className="agent-lab__role-switcher" aria-label="角色预设切换">
          <button type="button" className={role === "employee" ? "agent-lab__role-button agent-lab__role-button--active" : "agent-lab__role-button"} aria-pressed={role === "employee"} onClick={() => setRole("employee")}>
            员工提交态
          </button>
          <button type="button" className={role === "finance" ? "agent-lab__role-button agent-lab__role-button--active" : "agent-lab__role-button"} aria-pressed={role === "finance"} onClick={() => setRole("finance")}>
            财务审核态
          </button>
        </div>

        <div className="agent-lab__toolbar">
          {preset.toolbarGroups.map((group) => (
            <section key={group.id} className="agent-lab__toolbar-group" aria-label={group.label}>
              <p>{group.label}</p>
              <div className="agent-lab__toolbar-actions">
                {group.actions.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    className={action.emphasis === "primary" ? "agent-lab__toolbar-button agent-lab__toolbar-button--primary" : "agent-lab__toolbar-button"}
                    onClick={() =>
                      secondaryMenus.some((menu) => menu.id === action.id)
                        ? setOpenMenuId((current) => (current === action.id ? null : action.id))
                        : undefined
                    }
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="agent-lab__workspace-body">
          <section className="agent-lab__table">
            <div className="agent-lab__table-head" role="row">
              <span>发票号码</span>
              <span>买方</span>
              <span>金额</span>
              <span>状态</span>
              <span>标签</span>
            </div>

            {preset.rows.map((row) => (
              <div key={row.id} className="agent-lab__table-row" role="row">
                <strong>{row.invoiceNumber}</strong>
                <span>{row.buyerName}</span>
                <span>{row.amount}</span>
                <span>{row.parseStatus}</span>
                <span>{row.tags.join(" / ")}</span>
              </div>
            ))}
          </section>

          <aside className="agent-lab__inspector">
            <h2>{preset.inspector.title}</h2>
            {preset.inspector.sections.map((section) => (
              <section key={section.title} className="agent-lab__inspector-section">
                <h3>{section.title}</h3>
                <ul>
                  {section.lines.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </section>
            ))}
          </aside>
        </div>

        <div className="agent-lab__storyboard-panels">
          <section className="agent-lab__panel">
            <h2>{preset.preview.title}</h2>
            <div className="agent-lab__preview-groups">
              {preset.preview.groups.map((group) => (
                <section key={group.title} className="agent-lab__preview-group">
                  <h3>{group.title}</h3>
                  <ul>
                    {group.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </section>

          <section className="agent-lab__panel">
            <h2>{preset.gate.title}</h2>
            <p className="agent-lab__gate-status">{preset.gate.status}</p>
            <ul className="agent-lab__gate-list">
              {preset.gate.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </section>

          <section className="agent-lab__panel">
            <h2>布局规范</h2>
            <ul className="agent-lab__spec-list">
              {preset.specNotes.map((note) => (
                <li key={note.label}>
                  <strong>{note.label}</strong>
                  <span>{note.detail}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {secondaryMenus.map((menu) =>
          openMenuId === menu.id ? (
            <section key={menu.id} className="agent-lab__overlay" role="dialog" aria-label={menu.label}>
              <header>
                <strong>{menu.label}</strong>
                <button type="button" onClick={() => setOpenMenuId(null)}>
                  关闭
                </button>
              </header>
              <ul>
                {menu.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ) : null,
        )}
      </div>
    </section>
  );
}
