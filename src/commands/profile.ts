import { SlashCommandBuilder, ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { getCachedProfile, loadUserSession } from "../db";
import { buildProfileReply } from "../utils/embeds";
import { autoRole } from "../utils/roles";
import { PORT } from "../config";

export const data = new SlashCommandBuilder()
  .setName("프로필")
  .setDescription("내 maimai DX 프로필 보기");

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  const userId = interaction.user.id;
  const stored = loadUserSession(userId);
  if (stored?.friendCode) {
    const cached = getCachedProfile(stored.friendCode);
    if (cached) {
      await interaction.reply(buildProfileReply(cached, userId, PORT));
      autoRole(interaction, cached.rating);
      return;
    }
  }
  await interaction.reply({
    content: "아직 프로필이 등록되지 않았습니다. `/북마클릿` 명령어로 먼저 등록해주세요.",
    flags: MessageFlags.Ephemeral,
  });
}
