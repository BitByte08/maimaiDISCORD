import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, MessageFlags, PermissionsBitField } from "discord.js";
import { getGuildSetting, setGuildSetting } from "../db";

export const data = new SlashCommandBuilder()
  .setName("설정")
  .setDescription("서버별 자동 역할 활성화/비활성화");

export async function execute(interaction: ChatInputCommandInteraction): Promise<void> {
  if (!interaction.guild) {
    await interaction.reply({ content: "서버에서만 사용 가능합니다.", flags: MessageFlags.Ephemeral });
    return;
  }
  if (!interaction.memberPermissions?.has(PermissionsBitField.Flags.ManageGuild)) {
    await interaction.reply({ content: "서버 관리자만 사용 가능합니다.", flags: MessageFlags.Ephemeral });
    return;
  }
  const next = !getGuildSetting(interaction.guild.id);
  setGuildSetting(interaction.guild.id, next);
  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(next ? 0x5fba63 : 0xd95656)
        .setDescription(`자동 역할: **${next ? "활성화" : "비활성화"}**`),
    ],
    flags: MessageFlags.Ephemeral,
  });
}
