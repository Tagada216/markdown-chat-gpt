import { ItemView, WorkspaceLeaf, MarkdownView } from "obsidian";

export const VIEW_TYPE_CHAT_GPT = "chat-gpt-view";

export class ChatGPTView extends ItemView {
  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType() {
    return VIEW_TYPE_CHAT_GPT;
  }

  getDisplayText() {
    return "Chat GPT";
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    container.createEl("h4", { text: "Chat GPT View" });
  }

  async onClose() {
    // Nothing to clean up.
  }
}
