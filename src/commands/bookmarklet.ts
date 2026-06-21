import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from "discord.js";
import { getUserSyncToken } from "../db";
import { buildBookmarklet } from "../web";
import { PORT } from "../config";

export const data = new SlashCommandBuilder()
  .setName("북마클릿")
  .setDescription("프로필 동기화용 북마클릿 코드 받기");

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const token = getUserSyncToken(interaction.user.id);
  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle("📋 프로필 등록")
        .setColor(0x888888)
        .setDescription(`[maimai DX net](https://maimaidx-eng.com/maimai-mobile/)에서 북마클릿 실행`)
        .addFields({ name: "코드", value: `\`\`\`js\n${buildBookmarklet(token, PORT)}\n\`\`\`` }),
    ],
    flags: MessageFlags.Ephemeral,
  });
}
