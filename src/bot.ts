import { Client, Events, GatewayIntentBits, ChatInputCommandInteraction, REST, Routes } from "discord.js";
import { initEncryption } from "./crypto";
import { startWebServer, setBaseUrl } from "./web";
import { closeDb } from "./db";
import { CONFIG, PORT } from "./config";

import * as profile     from "./commands/profile";
import * as bookmarklet from "./commands/bookmarklet";
import * as role        from "./commands/role";
import * as ratingtable from "./commands/ratingtable";
import * as settings    from "./commands/settings";

type Command = { data: { toJSON(): object; name: string }; execute: (i: ChatInputCommandInteraction) => Promise<void> };

const COMMANDS: Command[] = [profile, bookmarklet, role, ratingtable, settings];

initEncryption(CONFIG.encryptionKey);
if (CONFIG.baseUrl) setBaseUrl(CONFIG.baseUrl);
startWebServer(PORT);

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, async (c) => {
  console.log(`[maimai] ${c.user.tag}`);
  const rest = new REST({ version: "10" }).setToken(CONFIG.token);
  await rest.put(
    CONFIG.guildId
      ? Routes.applicationGuildCommands(CONFIG.clientId, CONFIG.guildId)
      : Routes.applicationCommands(CONFIG.clientId),
    { body: COMMANDS.map((cmd) => cmd.data.toJSON()) },
  );
  console.log("[maimai] 준비 완료");
});

client.on(Events.InteractionCreate, async (i) => {
  if (!i.isChatInputCommand()) return;
  const cmd = COMMANDS.find((c) => c.data.name === i.commandName);
  if (!cmd) return;
  try {
    await cmd.execute(i);
  } catch (e) {
    console.error(`[cmd:${i.commandName}]`, e);
  }
});

process.on("SIGINT",  () => { closeDb(); process.exit(0); });
process.on("SIGTERM", () => { closeDb(); process.exit(0); });
client.login(CONFIG.token);
