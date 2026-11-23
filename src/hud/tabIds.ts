/** The element ID of one tab. */
export function tabId(idPrefix: string, id: string): string {
  return `${idPrefix}-tab-${id}`;
}

/** The element ID of the panel that a tab list controls. */
export function tabPanelId(idPrefix: string): string {
  return `${idPrefix}-panel`;
}
