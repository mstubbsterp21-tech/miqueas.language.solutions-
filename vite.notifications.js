function patchViews(code) {
  const uiImport = '} from "./ui";';
  if (!code.includes(uiImport)) {
    throw new Error("MLS notification patch could not find the views UI import.");
  }

  let updated = code.replace(uiImport, `${uiImport}\nimport IOSNotificationCenter from "./IOSNotificationCenter";`);
  const currentCenter = /function NotificationCenter\(\{ app, markRead \}\) \{[\s\S]*?\n\}\n\nfunction MessagesCenter/;
  if (!currentCenter.test(updated)) {
    throw new Error("MLS notification patch could not find the legacy notification center.");
  }

  updated = updated.replace(currentCenter, `function NotificationCenter({ app, actions }) {
  return <IOSNotificationCenter app={app} actions={actions} />;
}

function MessagesCenter`);

  const legacyUsage = '<NotificationCenter app={app} markRead={actions.markNotificationRead} />';
  if (!updated.includes(legacyUsage)) {
    throw new Error("MLS notification patch could not find notification center usage.");
  }
  updated = updated.replaceAll(legacyUsage, '<NotificationCenter app={app} actions={actions} />');
  return updated;
}

function patchController(code) {
  const currentBlock = `  async function markNotificationRead(notificationId) {
    try {
      await api.app("markNotificationRead", "POST", notificationId ? { notificationId } : {});
      await load(true);
    } catch (notificationError) {
      fail(notificationError);
    }
  }`;

  if (!code.includes(currentBlock)) {
    throw new Error("MLS notification patch could not find the controller notification action.");
  }

  const enhancedBlock = `  function updateNotificationList(transform) {
    setApp((current) => {
      if (!current) return current;
      const notifications = transform(current.notifications || []);
      return {
        ...current,
        notifications,
        unreadCount: notifications.filter((item) => !item.is_read).length,
      };
    });
  }

  async function notificationMutation(action, payload = {}) {
    const token = await session?.getToken();
    if (!token) throw new Error("Your session expired. Sign in again to manage notifications.");
    const response = await fetch(\`/api/notification-actions?action=\${encodeURIComponent(action)}\`, {
      method: "POST",
      headers: {
        Authorization: \`Bearer \${token}\`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Notification action failed.");
    return result;
  }

  async function setNotificationReadState(notificationId, isRead) {
    const now = new Date().toISOString();
    updateNotificationList((notifications) => notifications.map((item) => (
      !notificationId || item.id === notificationId
        ? { ...item, is_read: isRead, read_at: isRead ? now : null }
        : item
    )));
    try {
      await notificationMutation("setReadState", {
        ...(notificationId ? { notificationId } : {}),
        isRead,
      });
    } catch (notificationError) {
      fail(notificationError);
      await load(true);
    }
  }

  function markNotificationRead(notificationId) {
    return setNotificationReadState(notificationId, true);
  }

  function markNotificationUnread(notificationId) {
    return setNotificationReadState(notificationId, false);
  }

  async function dismissNotification(notificationId) {
    if (!notificationId) return;
    updateNotificationList((notifications) => notifications.filter((item) => item.id !== notificationId));
    try {
      await notificationMutation("clear", { notificationId });
    } catch (notificationError) {
      fail(notificationError);
      await load(true);
    }
  }

  async function clearNotifications(notificationIds = []) {
    const selected = new Set((notificationIds || []).filter(Boolean));
    updateNotificationList((notifications) => selected.size
      ? notifications.filter((item) => !selected.has(item.id))
      : []);
    try {
      await notificationMutation("clear", selected.size ? { notificationIds: [...selected] } : {});
    } catch (notificationError) {
      fail(notificationError);
      await load(true);
    }
  }

  function openNotification(notification) {
    if (!notification) return;
    if (!notification.is_read) void markNotificationRead(notification.id);
    if (notification.section) setSection(notification.section);
    if (notification.related_type === "assignment" && notification.related_id) {
      const assignment = allAssignments.find((item) => item.id === notification.related_id);
      if (assignment) openAssignment(assignment);
    }
  }`;

  let updated = code.replace(currentBlock, enhancedBlock);
  const actionLine = `    markNotificationRead,`;
  if (!updated.includes(actionLine)) {
    throw new Error("MLS notification patch could not find the controller action export.");
  }
  updated = updated.replace(actionLine, `    markNotificationRead,
    markNotificationUnread,
    dismissNotification,
    clearNotifications,
    openNotification,`);
  return updated;
}

export default function notificationCenterEnhancements() {
  return {
    name: "mls-ios-notification-center",
    enforce: "pre",
    transform(code, id) {
      const file = id.split("?")[0].replaceAll("\\", "/");
      if (file.endsWith("/src/portal/views.jsx")) return patchViews(code);
      if (file.endsWith("/src/portal/useMLSController.js")) return patchController(code);
      return null;
    },
  };
}
