import { Plugin, MarkdownView, PluginSettingTab, Setting, App } from "obsidian";
import { GPTPromptModal } from "./modal";
import { ChatGPTView, VIEW_TYPE_CHAT_GPT } from "./view";
import axios from "axios";

declare module "obsidian" {
  interface App {
    commands: {
      executeCommandById(id: string): void;
    };
  }
}

interface GPT3PluginSettings {
  apiKey: string;
}

const DEFAULT_SETTINGS: GPT3PluginSettings = {
  apiKey: "",
};

export default class GPT3Plugin extends Plugin {
  settings!: GPT3PluginSettings;

  async onload() {
    await this.loadSettings();

    this.registerView(VIEW_TYPE_CHAT_GPT, (leaf) => new ChatGPTView(leaf));

    this.addCommand({
      id: "open-chat-gpt",
      name: "Chat with GPT-3",
      checkCallback: (checking: boolean) => {
        if (!checking) {
          this.chatWithGPT3();
        }
        return true;
      },
    });

    this.addSettingTab(new GPT3SettingTab(this.app, this));
  }

  async chatWithGPT3() {
    await new GPTPromptModal(this.app, async (result) => {
      if (result) {
        const response = await this.fetchGPT3Response(result);
        if (response) {
          const view = this.app.workspace.getActiveViewOfType(MarkdownView);
          if (view) {
            const cursor = view.editor.getCursor();
            view.editor.replaceRange(`ChatGPT :  ${response})`, cursor);
            view.editor.replaceRange(`<br>`, cursor);
            view.editor.replaceRange(`Vous :  ${result}`, cursor);
          }
        }
      }
    }).open();
  }

  async fetchGPT3Response(input: string): Promise<string | null> {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (view) {
      const cursor = view.editor.getCursor();
      try {
        const response = await axios.post(
          "https://api.openai.com/v1/chat/completions",
          {
            model: `gpt-3.5-turbo`,
            messages: [
              {
                role: "user",
                content: input,
              },
            ],
            max_tokens: 100,
            n: 1,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${this.settings.apiKey}`,
            },
          }
        );
        const generatedText = response.data.choices[0].message.content;
        return generatedText;
      } catch (error) {
        return "Une erreur est survenue";
      }
    }
    return "Pas de vue active";
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

class GPT3SettingTab extends PluginSettingTab {
  plugin: GPT3Plugin;

  constructor(app: App, plugin: GPT3Plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    let { containerEl } = this;

    containerEl.empty();
    containerEl.createEl("h2", { text: "Paramètres de ChatGPT" });

    new Setting(containerEl)
      .setName("Clé API OpenAI")
      .setDesc("Entrez votre clé API OpenAI pour utiliser GPT-3")
      .addText((text) =>
        text
          .setPlaceholder("Entrez votre clé API ici...")
          .setValue(this.plugin.settings.apiKey)
          .onChange(async (value) => {
            this.plugin.settings.apiKey = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
