import { useEffect, useMemo, useState } from "react";
import type { InvoiceDocument } from "../../../shared/types/invoiceDocument";
import {
  buildGroupTagMap,
  createTagDefinition,
  createTagGroup,
  createTagGroupLink,
  deleteTagDefinition,
  deleteTagGroup,
  deleteTagGroupLink,
  loadTagMetadata,
} from "../application/tagMetadata";
import { syncSpecialTagGroups } from "../application/specialTagGroups";

type TagManagerPanelProps = {
  invoiceDocuments: InvoiceDocument[];
};

export function TagManagerPanel({ invoiceDocuments }: TagManagerPanelProps) {
  const [groups, setGroups] = useState<Array<{ id: string; name: string; sortOrder: number }>>([]);
  const [definitions, setDefinitions] = useState<Array<{ name: string; color: string; enabled: boolean; description: string }>>([]);
  const [links, setLinks] = useState<Array<{ tagName: string; groupId: string }>>([]);
  const [groupName, setGroupName] = useState("");
  const [tagName, setTagName] = useState("");
  const [tagColor, setTagColor] = useState("#7d71f4");
  const [tagDescription, setTagDescription] = useState("");
  const [linkTagName, setLinkTagName] = useState("");
  const [linkGroupId, setLinkGroupId] = useState("");
  const [status, setStatus] = useState("正在加载标签管理数据...");
  const derivedTagNames = useMemo(
    () => [...new Set(invoiceDocuments.flatMap((row) => row.tags))].sort((left, right) => left.localeCompare(right, "zh-CN")),
    [invoiceDocuments],
  );

  const refresh = async () => {
    await syncSpecialTagGroups(invoiceDocuments);
    const snapshot = await loadTagMetadata();
    setGroups(snapshot.groups);
    setDefinitions(snapshot.definitions);
    setLinks(snapshot.links);
    setStatus("标签管理数据已加载。");
  };

  useEffect(() => {
    void refresh().catch(() => setStatus("标签管理数据加载失败。"));
  }, [invoiceDocuments]);

  const groupTagMap = buildGroupTagMap(links);
  const knownTagNames = [...new Set([...derivedTagNames, ...definitions.map((item) => item.name)])].sort((left, right) =>
    left.localeCompare(right, "zh-CN"),
  );

  const saveTagDefinition = async () => {
    if (!tagName.trim()) {
      setStatus("请输入标签名称。");
      return;
    }

    try {
      await createTagDefinition({
        name: tagName,
        color: tagColor,
        description: tagDescription,
      });

      setTagName("");
      setTagDescription("");
      await refresh();
      setStatus("已保存标签定义。");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "保存标签定义失败。");
    }
  };

  const saveGroup = async () => {
    if (!groupName.trim()) {
      setStatus("请输入标签组名称。");
      return;
    }

    try {
      await createTagGroup(groupName, groups.length + 1);
      setGroupName("");
      await refresh();
      setStatus("已新增标签组。");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "新增标签组失败。");
    }
  };

  const saveLink = async () => {
    if (!linkTagName || !linkGroupId) {
      setStatus("请选择标签和标签组。");
      return;
    }

    try {
      await createTagGroupLink({
        tagName: linkTagName,
        groupId: linkGroupId,
      });

      await refresh();
      setStatus("已更新标签组映射。");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "更新标签组映射失败。");
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    await deleteTagGroup(groupId);
    if (linkGroupId === groupId) {
      setLinkGroupId("");
    }
    await refresh();
    setStatus("已删除标签组。");
  };

  const handleDeleteDefinition = async (tagNameToDelete: string) => {
    await deleteTagDefinition(tagNameToDelete);
    if (linkTagName === tagNameToDelete) {
      setLinkTagName("");
    }
    await refresh();
    setStatus("已删除标签定义。");
  };

  const handleDeleteLink = async (tagNameToDelete: string, groupId: string) => {
    await deleteTagGroupLink({ tagName: tagNameToDelete, groupId });
    await refresh();
    setStatus("已删除标签映射。");
  };

  return (
    <div className="tag-manager">
      <div className="tag-manager__forms">
        <section className="tag-manager__card">
          <h3>新增标签组</h3>
          <label>
            <span>标签组名称</span>
            <input value={groupName} onChange={(event) => setGroupName(event.target.value)} placeholder="例如：报销状态" />
          </label>
          <button type="button" onClick={() => void saveGroup()}>
            保存标签组
          </button>
        </section>

        <section className="tag-manager__card">
          <h3>维护标签定义</h3>
          <label>
            <span>标签名称</span>
            <input value={tagName} onChange={(event) => setTagName(event.target.value)} placeholder="例如：已报销" />
          </label>
          <label>
            <span>颜色</span>
            <input type="color" value={tagColor} onChange={(event) => setTagColor(event.target.value)} />
          </label>
          <label>
            <span>说明</span>
            <input value={tagDescription} onChange={(event) => setTagDescription(event.target.value)} placeholder="可选" />
          </label>
          <button type="button" onClick={() => void saveTagDefinition()}>
            保存标签定义
          </button>
        </section>

        <section className="tag-manager__card">
          <h3>绑定标签到标签组</h3>
          <label>
            <span>标签</span>
            <select value={linkTagName} onChange={(event) => setLinkTagName(event.target.value)}>
              <option value="">请选择标签</option>
              {knownTagNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>标签组</span>
            <select value={linkGroupId} onChange={(event) => setLinkGroupId(event.target.value)}>
              <option value="">请选择标签组</option>
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </label>
          <button type="button" onClick={() => void saveLink()}>
            保存映射
          </button>
        </section>
      </div>

      <section className="tag-manager__summary">
        <h3>标签组预览</h3>
        <p className="settings-form__status">{status}</p>
        <div className="tag-manager__group-list">
          {groups.length === 0 ? (
            <p>还没有维护标签组。</p>
          ) : (
            groups.map((group) => (
              <article key={group.id} className="tag-manager__group-card">
                <div className="workspace-card__header">
                  <strong>{group.name}</strong>
                  <button type="button" className="button-secondary" onClick={() => void handleDeleteGroup(group.id)}>
                    删除标签组
                  </button>
                </div>
                <div className="table-tag-list">
                  {(groupTagMap[group.id] ?? []).length === 0
                    ? "暂无标签"
                    : groupTagMap[group.id].map((tag) => (
                        <span key={`${group.id}-${tag}`} className="table-tag">
                          {tag}
                          <button type="button" className="button-inline" onClick={() => void handleDeleteLink(tag, group.id)}>
                            删除映射
                          </button>
                        </span>
                      ))}
                </div>
              </article>
            ))
          )}
        </div>
        {definitions.length > 0 ? (
          <div className="tag-manager__group-list">
            {definitions.map((definition) => (
              <article key={definition.name} className="tag-manager__group-card">
                <div className="workspace-card__header">
                  <strong>{definition.name}</strong>
                  <button type="button" className="button-secondary" onClick={() => void handleDeleteDefinition(definition.name)}>
                    删除标签
                  </button>
                </div>
                <p>{definition.description || "无说明"}</p>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
