import { useEffect, useState } from "react";
import { createFilterGroup, createFilterGroupRule, deleteFilterGroup, deleteFilterGroupRule, loadFilterGroups } from "../application/filterGroups";
import { FILTER_GROUP_FIELDS, FILTER_GROUP_FIELD_LABELS, FILTER_GROUP_NUMERIC_FIELDS, type FilterGroup, type FilterGroupField, type FilterGroupRule, type FilterGroupRuleOperator } from "../../../shared/types/filterGroup";

function operatorOptions(field: FilterGroupField) {
  if (FILTER_GROUP_NUMERIC_FIELDS.has(field)) {
    return [
      { value: "equals", label: "等于" },
      { value: "greater_than", label: "大于" },
      { value: "less_than", label: "小于" },
    ] satisfies Array<{ value: FilterGroupRuleOperator; label: string }>;
  }

  return [{ value: "regex", label: "正则匹配" }] satisfies Array<{ value: FilterGroupRuleOperator; label: string }>;
}

export function RegexFilterGroupPanel() {
  const [groups, setGroups] = useState<FilterGroup[]>([]);
  const [rules, setRules] = useState<FilterGroupRule[]>([]);
  const [groupName, setGroupName] = useState("");
  const [ruleGroupId, setRuleGroupId] = useState("");
  const [ruleLabel, setRuleLabel] = useState("");
  const [ruleField, setRuleField] = useState<FilterGroupField>("buyerName");
  const [ruleOperator, setRuleOperator] = useState<FilterGroupRuleOperator>("regex");
  const [rulePattern, setRulePattern] = useState("");
  const [status, setStatus] = useState("正在加载规则筛选组...");

  const refresh = async () => {
    const snapshot = await loadFilterGroups();
    setGroups(snapshot.groups);
    setRules(snapshot.rules);
    setStatus("规则筛选组已加载。");
  };

  useEffect(() => {
    void refresh().catch(() => setStatus("规则筛选组加载失败。"));
  }, []);

  const handleSaveGroup = async () => {
    if (!groupName.trim()) {
      setStatus("请输入筛选组名称。");
      return;
    }
    try {
      await createFilterGroup(groupName, groups.length + 1);
      setGroupName("");
      await refresh();
      setStatus("已保存筛选组。");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "保存筛选组失败。");
    }
  };

  const handleSaveRule = async () => {
    if (!ruleGroupId || !ruleLabel.trim() || !rulePattern.trim()) {
      setStatus("请完整填写规则信息。");
      return;
    }
    try {
      await createFilterGroupRule({
        groupId: ruleGroupId,
        label: ruleLabel,
        field: ruleField,
        operator: ruleOperator,
        pattern: rulePattern,
      });
      setRuleLabel("");
      setRulePattern("");
      await refresh();
      setStatus("已保存规则。");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "保存规则失败。");
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    await deleteFilterGroup(groupId);
    if (ruleGroupId === groupId) {
      setRuleGroupId("");
    }
    await refresh();
    setStatus("已删除筛选组。");
  };

  const handleDeleteRule = async (ruleId: string) => {
    await deleteFilterGroupRule(ruleId);
    await refresh();
    setStatus("已删除规则。");
  };

  return (
    <div className="tag-manager">
      <div className="tag-manager__forms">
        <section className="tag-manager__card">
          <h3>新增筛选组</h3>
          <label>
            <span>筛选组名称</span>
            <input value={groupName} onChange={(event) => setGroupName(event.target.value)} placeholder="例如：购买方规则" />
          </label>
          <button type="button" onClick={() => void handleSaveGroup()}>
            保存筛选组
          </button>
        </section>

        <section className="tag-manager__card">
          <h3>新增规则</h3>
          <label>
            <span>所属筛选组</span>
            <select value={ruleGroupId} onChange={(event) => setRuleGroupId(event.target.value)}>
              <option value="">请选择筛选组</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>规则名称</span>
            <input value={ruleLabel} onChange={(event) => setRuleLabel(event.target.value)} placeholder="例如：Buyer 开头" />
          </label>
          <label>
            <span>字段</span>
            <select
              value={ruleField}
              onChange={(event) => {
                const nextField = event.target.value as FilterGroupField;
                setRuleField(nextField);
                setRuleOperator(operatorOptions(nextField)[0].value);
              }}
            >
              {FILTER_GROUP_FIELDS.map((field) => (
                <option key={field} value={field}>
                  {FILTER_GROUP_FIELD_LABELS[field]}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>规则条件</span>
            <select value={ruleOperator} onChange={(event) => setRuleOperator(event.target.value as FilterGroupRuleOperator)}>
              {operatorOptions(ruleField).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>{FILTER_GROUP_NUMERIC_FIELDS.has(ruleField) ? "比较值" : "正则表达式"}</span>
            <input value={rulePattern} onChange={(event) => setRulePattern(event.target.value)} placeholder={FILTER_GROUP_NUMERIC_FIELDS.has(ruleField) ? "例如：100" : "例如：^Buyer"} />
          </label>
          <button type="button" onClick={() => void handleSaveRule()}>
            保存规则
          </button>
        </section>
      </div>

      <section className="tag-manager__summary">
        <h3>规则预览</h3>
        <p className="settings-form__status">{status}</p>
        <div className="tag-manager__group-list">
          {groups.length === 0 ? (
            <p>还没有维护规则筛选组。</p>
          ) : (
            groups.map((group) => (
              <article key={group.id} className="tag-manager__group-card">
                <div className="workspace-card__header">
                  <strong>{group.name}</strong>
                  <button type="button" className="button-secondary" onClick={() => void handleDeleteGroup(group.id)}>
                    删除筛选组
                  </button>
                </div>
                <div className="table-status-stack">
                  {rules.filter((rule) => rule.groupId === group.id).length === 0 ? <span className="status-pill status-pill--neutral">暂无规则</span> : null}
                  {rules
                    .filter((rule) => rule.groupId === group.id)
                    .map((rule) => (
                      <span key={rule.id} className="status-pill status-pill--neutral">
                        {rule.label}: {FILTER_GROUP_FIELD_LABELS[rule.field]} / {(rule.operator ?? "regex") === "regex" ? "正则匹配" : rule.operator === "equals" ? "等于" : rule.operator === "greater_than" ? "大于" : "小于"} / {rule.pattern}
                        <button type="button" className="button-inline" onClick={() => void handleDeleteRule(rule.id)}>
                          删除
                        </button>
                      </span>
                    ))}
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
