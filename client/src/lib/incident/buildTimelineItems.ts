import { IncidentLog } from "@shared/schema";
import { getMetaCategory } from "./index";

export type TimelineItem =
  | { type: 'single'; log: IncidentLog }
  | { type: 'chat_group'; id: string; chats: IncidentLog[] };

export function buildTimelineItems(allTimelineLogs: IncidentLog[]): TimelineItem[] {
  const items: TimelineItem[] = [];
  let currentChatGroup: IncidentLog[] = [];
  let chatGroupIndex = 0;

  for (const log of allTimelineLogs) {
    const category = getMetaCategory(log);
    if (log.type === 'photo' && category) continue;

    if (log.type === 'chat') {
      currentChatGroup.push(log);
    } else {
      if (currentChatGroup.length > 0) {
        items.push({ type: 'chat_group', id: `chat-group-${chatGroupIndex}`, chats: currentChatGroup });
        chatGroupIndex++;
        currentChatGroup = [];
      }
      items.push({ type: 'single', log });
    }
  }

  if (currentChatGroup.length > 0) {
    items.push({ type: 'chat_group', id: `chat-group-${chatGroupIndex}`, chats: currentChatGroup });
  }

  return items;
}
